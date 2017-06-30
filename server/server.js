const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const queryString = require("query-string");
const _ = require("lodash");
var moment = require("moment");
var http = require("http");
var socketIO = require("socket.io");

// console.log(process.env);
const port = process.env.PORT || 3000;

var app = express();
var server = http.createServer(app);
var io = socketIO(server);

const publicPath = path.join(__dirname, "/public");

app.use(express.static(publicPath));
// app.use(bodyParser.urlencoded({
//     extended: false
// }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.sendFile(publicPath + "/login-page.html");
});

app.get("/error.html", (req, res) => {
    res.redirect(publicPath + "/error.html");
});


var arr = [];


io.on("connection", (socket) => {
    console.log("Connected to Front End!");

    // check if data value has another property, if yes,then swap it for current roomname.
    // and then do socket.join()
    // following code gets the URL params when new user joins
    socket.on("params", (data, callback) => {
        var parsed = queryString.parse(data.params);
        callback(parsed);

        var matchedUser = arr.some(function(e) {
            return e.username === parsed.username;
        });

        if (matchedUser) {
            socket.emit("stopit", {
                err: "username already exists"
            });
        } else {
            socket.join(parsed.roomname);
            arr.push({
                username: parsed.username,
                roomname: parsed.roomname,
                socketid: socket.id
            });

            // following code welcomes user
            socket.emit("newMessage", {
                from: "Admin",
                text: `Welcome ${parsed.username.replace(/\b\w/g, l => l.toUpperCase())}!`,
                createdAt: moment().format('LT')
            });

            // following code checks for other users in the room
            var updatedArr = arr.filter((e) => {
                if (e.roomname === parsed.roomname) {
                    return e.username;
                }
            });

            io.to(parsed.roomname).emit("usersArr", {
                arr: updatedArr
            });

            // following code tells other users about the new user
            // socket.broadcast sends the message to everyone who is in the roomname but we also make sure we don't send it to the user who initiated the message
            // io.to.emit will send to everyone including the user who started it
            socket.broadcast.to(parsed.roomname).emit("newMessage", {
                from: "Admin",
                text: `${parsed.username.replace(/\b\w/g, l => l.toUpperCase())} has joined!`,
                createdAt: moment().format('LT')
            });

            // #####  following code checks for other available rooms #####
            // iterate through the arr and find all the rooms list
            var allRooms = _.uniqBy(arr, (e) => {
                return e.roomname;
            });

            io.emit("roomsArr", {
                arr: allRooms
            });
        }
    });




    // listen for click event coming from send button on client side
    // extract who's who info of the message
    // then run io.emit to send the message to everyone

    socket.on("createMessage", (data) => {
        var parsed = queryString.parse(data.params);

        io.to(parsed.roomname).emit("newMessage", {
            from: parsed.username,
            text: data.text,
            createdAt: data.createdAt
        });
    });

    socket.on("disconnect", () => {
        console.log("Disconnected From Front End");

        // following code is for updating users
        var leftUser = arr.filter((e) => {
            return e.socketid === socket.id;
        });

        arr = arr.filter((e) => {
            return e.socketid !== socket.id;
        });
        if (leftUser.length !== 0) {
            io.to(leftUser[0].roomname).emit("newMessage", {
                from: "Admin",
                text: `${leftUser[0].username} has left the chat`,
                createdAt: moment().format('LT')
            });

            var updatedArr = arr.filter((e) => {
                return e.roomname === leftUser[0].roomname;
            });

            io.to(leftUser[0].roomname).emit("usersArr", {
                arr: updatedArr
            });

            // following code is for updating rooms list
            var allRooms = _.uniqBy(arr, (e) => {
                return e.roomname;
            });

            io.emit("roomsArr", {
                arr: allRooms
            });
        }

    });

});



server.listen(port, () => {
    console.log(`Server has started on port ${port}`);
});

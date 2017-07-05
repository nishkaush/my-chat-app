var socket = io();
const textarea = document.getElementById("textarea");
const sendBtn = document.getElementById("send-btn");
const usersList = document.getElementById("users-list");
const roomsList = document.getElementById("rooms-list");

var usersTemplate = document.getElementById("users-template");
var roomsTemplate = document.getElementById("rooms-template");
var messageTemplate = document.getElementById("message-template");
var messagesPanel = document.getElementById("messages-view-panel");
// const logout = document.getElementById("logout");
// logout.addEventListener("click", function(e) {
//     window.location.replace("/");
// });

// find out window.locationsearch property of each respective page so we can run different code on each and find out what respective username, roomname are.

socket.on("connect", function() {
    console.log("Connected to Backend!");

    // following code sends params from URL to backend
    socket.emit("params", {
        params: window.location.search
    }, function(obj) {
        console.log(obj);
    });
});

// following code is for ny errors while validating username

socket.on("stopit", function(data) {
    console.log(data.err);
    window.location = "/error.html";
});



// following code is for templating messages in the message view panel
socket.on("newMessage", function(data) {

    var template = messageTemplate.innerHTML;
    var output = Mustache.render(template, {
        from: data.from,
        text: data.text,
        createdAt: data.createdAt
    });
    messagesPanel.insertAdjacentHTML("beforeend", output);
    if (messagesPanel.scrollHeight > 0) {
        messagesPanel.scrollTop = messagesPanel.scrollHeight;
    }
});

// listen for click event and extract info from textarea
// create an object to be sent back to server with all info
// create a socket.emit event ---- emitting createMessage event
// listen for a response from server and then
//insert these return values with mustachejs into html file

sendBtn.addEventListener("click", function() {

    if (textarea.value) {
        var text = textarea.value;
        textarea.value = "";
        socket.emit("createMessage", {
            params: window.location.search,
            text: text,
            createdAt: moment().format('LT')
        });
    }

});

textarea.addEventListener("keyup", function(e) {
    e.preventDefault();
    var str = textarea.value.trim();
    if (e.keyCode === 13 && str.length !== 0) {
        sendBtn.click();
    }
});

// following code is for setting up the users list on the side panel
socket.on("usersArr", function(data) {
    usersList.innerHTML = "";
    var myarr = data.arr;
    var template = usersTemplate.innerHTML;

    var lodashResult = _.chain(window.location.search)
        .replace('?', '')
        .split('&')
        .map(_.ary(_.partial(_.split, _, '='), 1))
        .fromPairs()
        .value(); //{"username":"saba","roomname":"newzealand"}
    // following "for loop" is for replacing "+" with spaces in names
    for (var prop in lodashResult) {
        if (lodashResult[prop].indexOf("+") !== -1) {
            lodashResult[prop] = lodashResult[prop].split("+").join(" ");
        } else if (lodashResult[prop].indexOf("%20") !== -1) {
            lodashResult[prop] = lodashResult[prop].split("%20").join(" ");
        }
    }

    console.log(lodashResult);
    // following code highlights current user
    myarr.forEach(function(e) {
        if (e.username === lodashResult.username) {
            var idName = "current-user";
        } else {
            var idName = "";
        }
        var output = Mustache.render(template, {
            user: e.username,
            idName: idName
        });
        usersList.insertAdjacentHTML("beforeend", output);
    });
});


socket.on("roomsArr", function(data) {
    roomsList.innerHTML = "";
    var myarr = data.arr;
    var template = roomsTemplate.innerHTML;

    var lodashResult = _.chain(window.location.search)
        .replace('?', '')
        .split('&')
        .map(_.ary(_.partial(_.split, _, '='), 1))
        .fromPairs()
        .value(); //{"username":"saba","roomname":"newzealand"}

    // following "for loop" is for replacing "+" with spaces in names
    for (var prop in lodashResult) {
        if (lodashResult[prop].indexOf("+") !== -1) {
            lodashResult[prop] = lodashResult[prop].split("+").join(" ");
        } else if (lodashResult[prop].indexOf("%20") !== -1) {
            lodashResult[prop] = lodashResult[prop].split("%20").join(" ");
        }
    }

    // following code highlights current room
    myarr.forEach(function(e) {
        if (e.roomname === lodashResult.roomname) {
            var idName = "current-room";
        } else {
            var idName = "";
        }
        var output = Mustache.render(template, {
            room: e.roomname,
            idName: idName
        });
        roomsList.insertAdjacentHTML("beforeend", output);
    });

    // following code is for switching users when a room name is clicked
    // change window.location.search -->wont effect localhost or anythign else
    // window.location.search ==="?username=safa&roomname=irwine&button=enter"
    var availableRooms = [].slice.call(document.querySelectorAll(".available-rooms"));

    availableRooms.forEach(function(e) {
        e.addEventListener("click", changeRoom);
    });

    function changeRoom() {
        console.log(this.innerHTML);

        var clickedRoom = this.innerHTML;

        if (clickedRoom !== lodashResult.roomname) {
            window.location.search = `?username=${lodashResult.username}&roomname=${clickedRoom}&button=enter`;
        }
    }


});






socket.on("disconnect", () => {
    console.log("Disconnected From the BackEnd!");
});

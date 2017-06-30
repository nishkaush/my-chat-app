var mongoose = require("mongoose");
var validator = require("validator");
var bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



var UserSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(value) {
                return validator.isEmail(value);
            },
            message: `Invalid email, please correct it!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    username: {
        type: String,
        unique: true
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]

});

UserSchema.pre("save", function(next) {
    var user = this;

    //***********Add the if statement for password change*********
    if (user.isModified("password")) {
        return bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(this.password, salt, (err, hash) => {
                this.password = hash;
                next();
            });
        });
    } else {
        next();
    }

});


UserSchema.methods.generateAuthToken = function() {
    var user = this;

    if (user.tokens.token) {
        return new Promise((resolve, reject) => {
            return resolve(user);
        });
    } else {
        var token = jwt.sign({
            access: "auth",
            _id: user._id
        }, "abc123");

        user.tokens.push({
            access: "auth",
            token: token
        });
        return user.save().then((result) => {
            return result;
        });
    }


};



UserSchema.statics.findByCredentials = function(email, password) {

    var User = this;

    return User.findOne({
        email: email
    }).then((result) => {
        return bcrypt.compare(password, result.password).then((res) => {
            if (res) {
                return result;
            }
            return Promise.reject("bcrypt section rejection");
        });
    }).catch((e) => {
        return new Promise((resolve, reject) => {
            reject(e);
        });
    });

};



var User = mongoose.model("User", UserSchema);

module.exports.User = User;

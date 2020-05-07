var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var fs = require('fs');
var usuarios;

fs.readFile('./resource/users.json', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    usuarios = data;
});

module.exports = function () {
    // setting Local Strategy and name for username and password field on the Form
    passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },

        function (username, password, done) { // callback receiver
            var users = JSON.parse(usuarios).authentication.users;
            var usernameJson;
            var passwordJson;
            var profileJson;

            if (username != null && password != null) {
                for (i = 0; i < users.length; i++) {
                    usernameJson = users[i].username;
                    passwordJson = users[i].password;
                    profileJson = users[i].profile;

                    if (username == usernameJson) {
                        if (password == passwordJson) {
                            done(null, users[i]);
                        }
                    }
                }
            }

            done(null, false);
        }));

};
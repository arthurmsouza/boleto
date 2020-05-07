var User = function (data) {
this.data = data;
}

User.prototype.data = {}

User.prototype.changeName = function (name) {
this.data.name = name;
}

User.prototype.changePass = function (pass) {
this.data.pass = pass;
}

User.findById = function (id, callback) {
db.get('users', {id: id}).run(function (err, data) {
if (err) return callback(err);
callback(null, new User(data));
});
}

module.exports = User;
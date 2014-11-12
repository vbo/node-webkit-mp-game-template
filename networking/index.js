var Connection = require("./connection.js");
var messaging = require("./messaging.js");

exports.Message = messaging.Message;
exports.registerMessageType = messaging.registerMessageType;

exports.createConnection = function () {
    return new Connection();
};

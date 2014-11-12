var networking = require("../");

var PingPongMessage = exports.PingPongMessage = function (clientTime, serverTime) {
    this.clientTime = clientTime;
    this.serverTime = serverTime;
    this.retryDelay = 65;
};
PingPongMessage.prototype = new networking.Message();
PingPongMessage.prototype.typeid = 1;
PingPongMessage.prototype.encode = function () {
    if (!this._buffer) {
        var buf = new Buffer(1100);
        buf.writeDoubleBE(this.clientTime, 0);
        buf.writeDoubleBE(this.serverTime || 0, 8);
        this._buffer = buf;
    }
    return this._buffer;
};
PingPongMessage.decode = function (buf) {
    return [new PingPongMessage(buf.readDoubleBE(0), buf.readDoubleBE(8)), 1100];
};

var JsonMessage = exports.JsonMessage = function (data) {
    this.data = data;
    this.retryDelay = 5;
};
JsonMessage.prototype = new networking.Message();
JsonMessage.prototype.typeid = 2;
JsonMessage.prototype.encode = function () {
    if (!this._buffer) {
        var json = JSON.stringify(this.data);
        var dataBuf = new Buffer(json, "utf8");
        var sizeBuf = new Buffer(4);
        sizeBuf.writeUInt32BE(dataBuf.length, 0);
        this._buffer = Buffer.concat([sizeBuf, dataBuf]);
    }
    return this._buffer;
};
JsonMessage.decode = function (buf) {
    var size = buf.readUInt32BE(0);
    var index = 4 + size;
    var data = JSON.parse(buf.toString("utf8", 4, 4 + size));
    return [new JsonMessage(data), index]
};

for (var k in exports) {
    if (exports.hasOwnProperty(k)) {
        var type = exports[k];
        networking.registerMessageType(type);
    }
}

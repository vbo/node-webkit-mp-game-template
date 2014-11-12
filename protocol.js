var networking = require("./networking");

var TextMessage = exports.TextMessage = function (text) {
    this.text = text;
};

TextMessage.prototype = new networking.Message();
TextMessage.prototype.typeid = 0;

TextMessage.prototype.encode = function () {
    if (!this._buffer) {
        var dataBuf = new Buffer(this.text, "utf8");
        var sizeBuf = new Buffer(4);
        sizeBuf.writeUInt32BE(dataBuf.length, 0);
        this._buffer = Buffer.concat([sizeBuf, dataBuf]);
    }
    return this._buffer;
};

TextMessage.decode = function (buf) {
    var size = buf.readUInt32BE(0);
    var index = 4 + size;
    var text = buf.toString("utf8", 4, 4 + size);
    return [new TextMessage(text), index]
};

for (var k in exports) {
    if (exports.hasOwnProperty(k)) {
        var type = exports[k];
        networking.registerMessageType(type);
    }
}

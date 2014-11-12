var networking = require("../");

var PORT = 40402;

process.on("uncaughtException", function (e) {
    console.log("UNCAUGHT", e, e.stack);
});

function TestMessage (val) {
    this.val = val;
}
TestMessage.prototype = new networking.Message();
TestMessage.prototype.retryDelay = 1;
TestMessage.prototype.typeid = 255;
TestMessage.prototype.encode = function () {
    var buf = new Buffer(1);
    buf.writeUInt8(this.val, 0);
    return buf;
};
TestMessage.decode = function (buf) {
    return [new TestMessage(buf.readUInt8(0)), 1];
};
networking.registerMessageType(TestMessage);

exports.setUp = function (clb) {
    this.serverNet = networking.createConnection();
    this.clientNet = networking.createConnection();
    this.serverNet.listen(PORT);
    this.serverPeer = this.clientNet.directConnect('localhost', PORT);
    clb();
};
exports.tearDown = function (clb) {
    this.clientNet.close();
    this.serverNet.close();
    clb();
};
exports.TestMessage = TestMessage;



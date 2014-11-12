var common = require("./_common.js");
var TestMessage = common.TestMessage;

module.exports = {
    setUp: common.setUp,
    tearDown: common.tearDown,
    testReliableMessage: function (test) {
        var timeoutId = setTimeout(function () {
            test.ok(false, "Too long even for reliable message");
            test.done();
        }, 40);
        this.serverPeer.send(new TestMessage(42));
        this.serverNet.on("peer", function (peer) {
            peer.on("message", function (msg) {
                test.ok(msg instanceof TestMessage && msg.val == 42, "Reliable message received");
                clearTimeout(timeoutId);
                test.done();
            });
        });
    }
};

var common = require("./_common.js");
var TestMessage = common.TestMessage;

module.exports = {
    setUp: common.setUp,
    tearDown: common.tearDown,
    testTwoReliableMessagesInOnePacket: function (test) {
        var timeoutId = setTimeout(function () {
            test.ok(false, "Too long even for reliable message");
            test.done();
        }, 80);
        this.serverPeer.send(new TestMessage(42));
        this.serverPeer.send(new TestMessage(82));
        this.serverNet.on("peer", function (peer) {
            var toGot = { 42: 1, 82: 1 };
            peer.on("message", function (msg) {
                delete toGot[msg.val];
                test.ok(msg instanceof TestMessage, "Reliable message received");
                if (!Object.keys(toGot).length) {
                    clearTimeout(timeoutId);
                    test.done();
                }
            });
        });
    }
};


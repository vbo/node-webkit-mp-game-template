var networking = require("../");
var hrtime = require("../timing.js").hrtime;
var messages = require("./messages.js");

if (process.argv.length < 3) {
    console.log("Usage: node " + process.argv[1] + " <port-to-listen>");
    process.exit();
}
var port = process.argv[2];

var network = networking.createConnection();
network.listen(port);
network.on("listening", function () {
    console.log("Server is listening:", network.listening);
});
network.on("peer", function (peer) {
    console.log("CONNECT " + peer.id); 
    peer.on("message", function (msg) {
        if (msg instanceof messages.PingPongMessage) {
            peer.send(new messages.PingPongMessage(msg.clientTime, hrtime()));
        }
    });
});

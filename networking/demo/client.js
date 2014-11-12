var networking = require("../");
var hrtime = require("../timing.js").hrtime;
var messages = require("./messages.js");

if (process.argv.length < 3) {
    console.log("Usage: node " + process.argv[1] + " <server-url>");
    process.exit();
}
var serverUrl = process.argv[2].split(":");

var rtts = [];
var rttsToReceive = 1000;
var sent = 0;

var network = networking.createConnection();
var server = network.directConnect(serverUrl[0], serverUrl[1] | 0);

setInterval(function () {
    sent++;
    server.send(new messages.PingPongMessage(hrtime()))
}, 50);

setInterval(function () {
    console.log("COLLECTING STATS: sent:" + sent + " " + rtts.length + "/" + rttsToReceive);
}, 2000);

server.on("message", function (msg) {
    if (msg instanceof messages.PingPongMessage) {
        rtts.push([msg.serverTime, msg.clientTime, hrtime(), msg.id]);
        if (rtts.length > rttsToReceive) {
            rtts.forEach(function (rtt) { console.log(rtt[2] - rtt[1]) });
            console.log("LOSS", sent, rtts.length);
            process.exit();
        }
    }
});

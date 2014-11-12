var readline = require('readline');
var networking = require('../networking');
var protocol = require('../protocol');

var PORT = process.argv[2] | 0;

var connection = networking.createConnection();

connection.on("listening", function () {
    console.log("Server is listening!", connection.listening);
});

connection.on("peer", function (peer) {
    console.log("New connection from " + peer.id);
    peer.on("message", function (msg) {
        if (msg instanceof protocol.TextMessage) {
            console.log("Got text message from " + peer.id + ": " + msg.text);
            peer.send(new protocol.TextMessage("OLEH"));
        } else {
            console.log("Got " + (typeof msg) + " from " + peer.id + "!", msg);
        }
    });
    peer.on("disconnect", function () {
        console.log(peer.id + " have been diconnected");
    });
});
connection.listen(PORT);
connection.socket.unref();

// server command-line interface
process.stdin.resume();
process.stdin.setEncoding('utf8');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.on('line', function (line) {
    if (line == "kill" || line == "stop") {
        process.exit();
    }
    return null;
});
rl.on('SIGINT', function () { process.emit('SIGINT'); });
//do something when app is closing
process.on('exit', exitHandler.bind(null, {}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

function exitHandler(options, err) {
    if (options.exit) process.exit();
}

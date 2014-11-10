var readline = require('readline');
var dgram = require("dgram");

var PORT = process.argv[2] | 0;
var socket = dgram.createSocket("udp4");

socket.on("message", function (packet, remote) {
    console.log("got " + packet.toString("utf-8") + " from " + remote.address + ":" + remote.port);
    var buf = new Buffer("EHLO", "utf-8");
    socket.send(buf, 0, buf.length, remote.port, remote.address);
});

socket.bind(PORT);
socket.unref();

// server command-line interface
process.stdin.resume();
process.stdin.setEncoding('utf8');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.on('line', function (line) {
    if (line == "kill" || line == "stop") {
        return process.exit();
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

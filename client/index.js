var frame = require("./frame");
var $ = frame.$;
var config = require("./config");
var render = require("./render");
var serverProcess = require("./server_process");

function bindShortcut(shortcut, clb) {
    $(frame.document).bind('keydown', shortcut, clb);
}

if (config.debug) {
    // refresh
    function reload () {
        frame.nativeGui.Window.get().reload(3); // MAGIC: don't know why it works
    }
    bindShortcut("meta+r", reload);
    bindShortcut("ctrl+f5", reload);
}

serverProcess.start(config.localServer.port);

var dgram = require("dgram");

var socket = dgram.createSocket("udp4");
socket.on("message", function (packet, remote) {
    console.log("got " + packet.toString("utf-8") + " from " + remote.address + ":" + remote.port);
});
socket.unref();
process.on("exit", function () {
    serverProcess.stop();
});

setInterval(function () {
    var buf = new Buffer("HELO", "utf-8");
    socket.send(buf, 0, buf.length, config.localServer.port, "127.0.0.1");
}, 1000);

frame.sound.setMusicMood("calm");
frame.sound.play("alarm", 2);

render.init(function () {
    render.canvas.show();
    setInterval(function () {
        render.redraw();
    }, 32);
});

bindShortcut("meta+=", function () {
    render.setScale(render.getScale() + 1);
});
bindShortcut("meta+-", function () {
    render.setScale(render.getScale() - 1);
});
bindShortcut("w", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0], camera[1] - 1]);
});
bindShortcut("s", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0], camera[1] + 1]);
});
bindShortcut("d", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0] - 1, camera[1]]);
});
bindShortcut("a", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0] + 1, camera[1]]);
});

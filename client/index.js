var frame = require("./frame");
var $ = frame.$;
var guiWindow = frame.nativeGui.Window.get();
var config = require("./config");
var render = require("./render");
var serverProcess = require("./server_process");

function bindShortcut(shortcut, clb) {
    $(frame.document).bind('keydown', shortcut, clb);
}

if (config.debug) {
    (function () {
        // refresh
        function reload () {
            exitHandler();
            guiWindow.reload(3); // MAGIC: don't know why it works
        }
        bindShortcut("meta+r", reload);
        bindShortcut("ctrl+f5", reload);
    })();
}

serverProcess.start(config.localServer.port);

var networking = require("../networking");
var protocol = require('../protocol');

var connection = networking.createConnection();
var server = connection.directConnect("127.0.0.1", config.localServer.port);

setInterval(function () {
    server.send(new protocol.TextMessage("HELO"));
}, 1000);

server.on("message", function (msg) {
    if (msg instanceof protocol.TextMessage) {
        console.log("Got text message: " + msg.text);
    } else {
        console.log("Got " + (typeof msg) + "!", msg);
    }
});

function exitHandler () {
    connection.close();
    serverProcess.stop();
}
process.on("exit", exitHandler);
process.on("SIGINT", exitHandler);
guiWindow.on("close", function () {
    exitHandler();
    guiWindow.close(true);
});

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

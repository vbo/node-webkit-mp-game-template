var frame = require("./frame.js");
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
    try { connection.close(); } catch (e) {}
    try { serverProcess.stop(); } catch (e) {}
    Object.keys(require.cache).forEach(function (k) { delete require.cache[k]; })
}
process.on("exit", exitHandler);
process.on("SIGINT", exitHandler);
guiWindow.on("close", function () {
    exitHandler();
    this.close(true);
});

// Basic input handling
var processInput = (function () {
    var zoomSpeed = 0.01;
    var panSpeed = 0.001;
    var rotateSpeed = 0.001;
    var actions = {
        zoomIn: function (t) {
            render.setScale(render.getScale() + zoomSpeed*t);
        },
        zoomOut: function (t) {
            render.setScale(render.getScale() - zoomSpeed*t);
        },
        panUp: function (t) {
            var camera = render.getCamera();
            var offset = panSpeed*t;
            var rot = render.getRotation();
            render.setCamera([camera[0] - offset * Math.sin(rot), camera[1] - offset * Math.cos(rot)]);
        },
        panRight: function (t) {
            var camera = render.getCamera();
            var offset = panSpeed*t;
            var rot = render.getRotation();
            render.setCamera([camera[0] - offset * Math.cos(rot), camera[1] + offset * Math.sin(rot)]);
        },
        panDown: function (t) {
            var camera = render.getCamera();
            var offset = panSpeed*t;
            var rot = render.getRotation();
            render.setCamera([camera[0] + offset * Math.sin(rot), camera[1] + offset * Math.cos(rot)]);
        },
        panLeft: function (t) {
            var camera = render.getCamera();
            var offset = panSpeed*t;
            var rot = render.getRotation();
            render.setCamera([camera[0] + offset * Math.cos(rot), camera[1] - offset * Math.sin(rot)]);
        },
        rotateCW: function (t) {
            render.setRotation(render.getRotation() - rotateSpeed*t);
        },
        rotateCCW: function (t) {
            render.setRotation(render.getRotation() + rotateSpeed*t);
        }
    };
    var keyActions = {
        "]": actions.zoomIn,
        "[": actions.zoomOut,
        "w": actions.panUp,
        "d": actions.panRight,
        "s": actions.panDown,
        "a": actions.panLeft,
        "e": actions.rotateCW,
        "q": actions.rotateCCW
    };
    var allKeys = Object.keys(keyActions);
    var keysState = {};
    var $doc = $(frame.document);
    function bind(action, key, val) {
        $doc.bind(action, key, function () {
            keysState[key] = val;
        });
    }
    allKeys.forEach(function (key) {
        bind("keydown", key, true);
        bind("keyup", key, false);
        keysState[key] = false;
    });
    function processInput (t) {
        allKeys.forEach(function (key) {
            if (keysState[key]) {
                keyActions[key](t);
            }
        });
    }
    return processInput;
})();

function hrtime () {
    // High-resolution time in millis
    // This is not relative to real time - just to some arbitrary point in the past
    var time = process.hrtime();
    return (time[0] * 1e9 + time[1])/1e6;
}

frame.sound.setMusicMood("calm");
frame.sound.play("alarm", 2);

render.init(function () {
    render.canvas.show();
    var last = hrtime();
    setInterval(function () {
        var now = hrtime();
        var delta = now - last;
        last = now;
        processInput(delta);
        render.redraw();
    }, 32);
});


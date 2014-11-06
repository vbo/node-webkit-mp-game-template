var frame = require("./frame");
var $ = frame.$;
var config = require("./config");
var render = require("./render");

function bindShortcut(shortcut, clb) {
    $(frame.document).bind('keydown', shortcut, clb);
}

if (config.debug) {
    // refresh
    bindShortcut("meta+r", function () {
        frame.nativeGui.Window.get().reload(3); // MAGIC: don't know why it works
    });
}

frame.sound.setMusicMood("calm");
frame.sound.play("alarm", 2);

render.init(function () {
    render.canvas.show();
    setInterval(function () {
        render.redraw();
    }, 32);
});

bindShortcut("meta+=", function () {
    render.setScale(render.getScale() + 0.01);
});
bindShortcut("meta+-", function () {
    render.setScale(render.getScale() - 0.01);
});
bindShortcut("w", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0], camera[1] - 0.001]);
});
bindShortcut("s", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0], camera[1] + 0.001]);
});
bindShortcut("d", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0] - 0.001, camera[1]]);
});
bindShortcut("a", function () {
    var camera = render.getCamera();
    render.setCamera([camera[0] + 0.001, camera[1]]);
});
bindShortcut("q", function () {
    render.setRotation(render.getRotation() + 0.001);
});
bindShortcut("e", function () {
    render.setRotation(render.getRotation() - 0.001);
});

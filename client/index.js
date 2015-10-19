// client code starts here
// everything webkit-related is already preloaded in this point
// and accessible through `./frame.js` module
var frame = require("./frame.js");
var config = require("./config");
var render = require("./render");

if (config.debug) {
    // refresh
    frame.$(frame.document).bind('keydown', "meta+r", function () {
        frame.nativeGui.Window.get().reload(3); // MAGIC: don't know why it works
    });
}

frame.sound.setMusicMood("calm");
frame.sound.play("alarm", 2);
render.show();

setInterval(function () {
    render.redraw();
}, 32);

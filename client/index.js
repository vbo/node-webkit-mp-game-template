// client code starts here
// everything webkit-related is already preloaded in this point
// and accessible through `./frame` module
var frame = require("./frame");
var config = require("./config");

if (config.debug) {
    // refresh
    frame.$(frame.document).bind('keydown', "meta+r", function () {
        frame.nativeGui.Window.get().reload(3); // MAGIC: don't know why it works
    });
}

frame.$('body').text("Hello world!");

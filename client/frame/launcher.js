// here we try to pre-load everything webkit-related so the client
// can just `require("./frame")` to access all the multimedia features
requirejs.config({
    shim: {
        "jquery": { exports: "$" },
        "jquery.hotkeys": { deps: ['jquery'] }
    },
    paths: {
        "jquery": "lib/jquery",
        "jquery.hotkeys": "lib/jquery.hotkeys"
    }
});

requirejs.onError = function (err) {
    console.log("Requirejs error", err.requireType);
    console.log('modules: ' + err.requireModules);
    throw err;
};

requirejs([
    "jquery", "jquery.hotkeys", "storage", "resource", "sound", "graphics"
], function (
    $, _, storage, resource, sound, graphics
) {
    var config = require("../config");
    var gui = require("nw.gui");
    if (process.platform == "darwin") {
        var menu = new gui.Menu({type: 'menubar'});
        menu.createMacBuiltin("My App");
        gui.Window.get().menu = menu;
    }
    config.debug = !!gui.App.manifest.nw.tools;
    var async = require("async");
    async.parallel([
        function (clb) { sound.init(config.sound, clb); },
        function (clb) { graphics.init(config.graphics, clb); }
    ], function () {
        var frame = require("../frame.js");
        frame.init(gui, window, $, storage, resource, sound, graphics);
        $('#preloader').hide();
        require("../index");
    });
});

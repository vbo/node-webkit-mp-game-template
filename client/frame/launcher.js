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

requirejs(["jquery", "jquery.hotkeys", "storage", "resource", "sound"], function ($, _, storage, resource, sound) {
    var config = require("../config");
    var gui = require("nw.gui");
    config.debug = !!gui.App.manifest.nw.tools;
    sound.init(config.sound, function () {
        require("../frame").init(gui, window, $, storage, resource, sound);
        $('#preloader').hide();
        require("../index");
    });
});

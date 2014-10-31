exports.nativeGui = null;
exports.nativeWindow = null;
exports.document = null;
exports.$ = null;
exports.storage = null;
exports.resource = null;
exports.sound = null;
exports.graphics = null;

exports.init = function (gui, window, $, storage, resource, sound, graphics) {
    exports.nativeGui = gui;
    exports.nativeWindow = window;
    exports.document = window.document;
    exports.$ = $;
    exports.storage = storage;
    exports.resource = resource;
    exports.sound = sound;
    exports.graphics = graphics;
};

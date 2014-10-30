exports.nativeGui = null;
exports.nativeWindow = null;
exports.document = null;
exports.$ = null;

exports.init = function (gui, window, $) {
    exports.nativeGui = gui;
    exports.nativeWindow = window;
    exports.document = window.document;
    exports.$ = $;
};

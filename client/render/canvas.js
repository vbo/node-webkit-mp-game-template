var EventEmitter = require("events").EventEmitter;

var frame = require("../frame");
var $ = frame.$;
var graphics = frame.graphics;

var devicePixelRatio = frame.nativeWindow['devicePixelRatio'] || 1;

// emits: resize
var canvas = module.exports = new EventEmitter();
canvas.width = 0;
canvas.height = 0;

// create markup
var $canvas = $('<canvas class="panel"></canvas>').hide().appendTo("body");
$canvas.css({position: "absolute", top: 0, left: 0, right: 0, bottom: 0});

// init context
canvas.gl = graphics.createContext($canvas[0], false);

// handle resize
frame.nativeWindow.onresize = onResize;
onResize();

canvas.show = function () {
    $('.panel').hide();
    $canvas.show();
};

function onResize () {
    var w = canvas.width = $('body').width();
    var h = canvas.height = $(frame.nativeWindow).height();
    $canvas.width(w);
    $canvas.height(h);
    var canvasEl = $canvas[0];
    canvasEl.width = w * devicePixelRatio;
    canvasEl.height = h * devicePixelRatio;
    canvas.emit("resize");
}

var frame = require("./frame.js");
var $ = frame.$;
var graphics = frame.graphics;

var devicePixelRatio = frame.nativeWindow['devicePixelRatio'] || 1;

// create markup
var $canvas = $('<canvas class="panel"></canvas>').hide().appendTo("body");
$canvas.css({position: "absolute", top: 0, left: 0, right: 0, bottom: 0});

// init context
var gl = graphics.createContext($canvas[0], false);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);

// handle resize
frame.nativeWindow.onresize = onResize;
onResize();

// init rendering pipeline (just static triangle for now)
var idProg = graphics.createShaderProg(gl, "identity");
var positionAttrLoc = gl.getAttribLocation(idProg, "position");
var vbo = gl.createBuffer();
var vertices = [
    0.0, 0.5, 0.0,
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0
];
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

// draw actual scene
exports.redraw = function () {
    clear();
    gl.useProgram(idProg);
    gl.enableVertexAttribArray(positionAttrLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(positionAttrLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(this.positionAttrLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

// utility functions
function clear () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BUT);
}

function onResize () {
    var w = $('body').width();
    var h = $(frame.nativeWindow).height();
    $canvas.width(w);
    $canvas.height(h);
    var canvasEl = $canvas[0];
    canvasEl.width = w * devicePixelRatio;
    canvasEl.height = h * devicePixelRatio;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    clear();
}

exports.show = function () {
    $('.panel').hide();
    $canvas.show();
};

var glm = require("gl-matrix");

var config = require("../config").render;
var frame = require("../frame");
var $ = frame.$;
var graphics = frame.graphics;
var resource = frame.resource;

var spriteUtils = require("./sprite");
var Sprite = spriteUtils.Sprite;
var SpriteBuffer = spriteUtils.SpriteBuffer;
var SpriteRender = spriteUtils.SpriteRender;

exports.setScale = setScale;
exports.getScale = getScale;
exports.setCamera = setCamera;
exports.getCamera = getCamera;
exports.setRotation = setRotation;
exports.getRotation = getRotation;

// init context
var canvas = exports.canvas = require("./canvas");
var gl = canvas.gl;
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);

// init coordinate system
var screenProjectionMatrix = glm.mat4.create();
var scaleVec = glm.vec3.create(); scaleVec[2] = 1;
var cameraVec = glm.vec3.create(); cameraVec[2] = 0;
var cameraShift = [0.0, 0.0];
var scaleFactor = 1;
var rotation = 0.0;
var scaleMatrix = glm.mat4.create();
var resultingMatrix = glm.mat4.create();

// handle resize
canvas.on("resize", onResize);
onResize();
setScale(config.defaultScale);
setCamera([2.099, 7.0]);

// prepare actual game drawing tools
var mapTilesRender = null;
var spritesheetId = "default";

exports.init = function (clb) {
    spriteUtils.preloadSheets([spritesheetId], function () {
        mapTilesRender = new SpriteRender(graphics.createShaderProg(gl, "sprite"), spritesheetId);
        clb();
    });
};

// example data
var mapChunk = new SpriteBuffer(512, false);
mapChunk.fill([
    new Sprite(0, 0, 0, 2, 1),
    new Sprite(0, 1, 0, 3, 0),
    new Sprite(0, 2, 0, 3, 0),
    new Sprite(0, 3, 0, 0, 0),
    new Sprite(1, 0, 0, 1, 0),
    new Sprite(2, 0, 0, 1, 0),
    new Sprite(3, 0, 0, 1, 0),
    new Sprite(1, 3, 0, 1, 0),
    new Sprite(2, 3, 0, 1, 0),
    new Sprite(3, 3, 0, 1, 0),
    new Sprite(4, 3, 0, 4, 0),
    new Sprite(4, 0, 0, 4, 1),
    new Sprite(4, 1, 0, 3, 0),
    new Sprite(4, 2, 0, 3, 0),
    new Sprite(1, 1, 0, 0, 2),
    new Sprite(2, 1, 0, 0, 2),
    new Sprite(3, 1, 0, 0, 2),
    new Sprite(1, 2, 0, 0, 2),
    new Sprite(2, 2, 0, 0, 2),
    new Sprite(3, 2, 0, 0, 2),
    new Sprite(2.099, 1, 10, 5, 0)
]);

exports.redraw = function () {
    scaleVec[0] = scaleFactor;
    scaleVec[1] = scaleFactor;
    glm.mat4.identity(scaleMatrix);
    glm.mat4.scale(scaleMatrix, scaleMatrix, scaleVec);
    glm.mat4.multiply(resultingMatrix, screenProjectionMatrix, scaleMatrix);
    cameraVec[0] = cameraShift[0];
    cameraVec[1] = cameraShift[1];
    glm.mat4.translate(resultingMatrix, resultingMatrix, cameraVec);
    glm.mat4.rotate(resultingMatrix, resultingMatrix, rotation, [0, 0, 1]);
    clear();
    mapTilesRender.draw([mapChunk], resultingMatrix);
};

// utility functions
function clear () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BUT);
}

function setScale (factor) {
    scaleFactor = factor;
    clear();
}

function getScale () {
    return scaleFactor;
}

function setRotation (rad) {
    rotation = rad;
    clear();
}

function getRotation () {
    return rotation;
}

function setCamera (shift) {
    cameraShift[0] = shift[0];
    cameraShift[1] = shift[1];
    clear();
}

function getCamera () {
    return cameraShift;
}

function onResize () {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    glm.mat4.ortho(screenProjectionMatrix, 0, canvas.width, 0, canvas.height, -100, 1);
    clear();
}

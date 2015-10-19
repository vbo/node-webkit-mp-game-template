var glm = require("gl-matrix");

var config = require("../config").render;
var frame = require("../frame.js");
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
var MAT4_IDENTITY = glm.mat4.create();
glm.mat4.identity(MAT4_IDENTITY);
var screenProjectionMatrix = glm.mat4.create();
var cameraViewProjectionMatrix = glm.mat4.create();
var scaleVec = glm.vec3.create(); scaleVec[2] = 1;
var cameraVec = glm.vec3.create(); cameraVec[2] = 0;
var rotationRad = 0.0;
var cameraViewTransforms = {
    scale: glm.mat4.create(),
    rotation: glm.mat4.create(),
    translation: glm.mat4.create()
};

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
    glm.mat4.scale(cameraViewTransforms.scale, MAT4_IDENTITY, scaleVec);
    glm.mat4.translate(cameraViewTransforms.translation, MAT4_IDENTITY, cameraVec);
    glm.mat4.rotate(cameraViewTransforms.rotation, MAT4_IDENTITY, rotationRad, [0, 0, 1]);

    glm.mat4.multiply(cameraViewProjectionMatrix, cameraViewTransforms.translation, MAT4_IDENTITY);
    glm.mat4.multiply(cameraViewProjectionMatrix, cameraViewTransforms.scale, cameraViewProjectionMatrix);
    glm.mat4.multiply(cameraViewProjectionMatrix, cameraViewTransforms.rotation, cameraViewProjectionMatrix);

    glm.mat4.multiply(cameraViewProjectionMatrix, screenProjectionMatrix, cameraViewProjectionMatrix);

    clear();
    mapTilesRender.draw([mapChunk], cameraViewProjectionMatrix);
};

// utility functions
function clear () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BUT);
}

function setScale (factor) {
    scaleVec[0] = factor;
    scaleVec[1] = factor;
    clear();
}
function getScale () {
    return scaleVec[0];
}

function setCamera (shift) {
    cameraVec[0] = shift[0];
    cameraVec[1] = shift[1];
}

function getCamera () {
    return cameraVec;
}

function setRotation (rad) {
    rotationRad = rad;
}

function getRotation () {
    return rotationRad;
}

function onResize () {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    glm.mat4.ortho(screenProjectionMatrix, -canvas.width/2, canvas.width/2, -canvas.height/2, canvas.height/2, -100, 1);
    clear();
}

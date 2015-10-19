var async = require("async");

var resource = require("../frame.js").resource;
var config = require("../config").render;

var gl = require("./canvas").gl;

var sheetTextures = {};

exports.preloadSheets = function (sheetIds, done) {
    var newIds = sheetIds.filter(function (sheetId) { return !sheetTextures[sheetId]; });
    async.each(newIds, function (sheetId, clb) {
        var url = config.spritesheets[sheetId].url;
        resource.load(url, "image", function (image) {
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            sheetTextures[sheetId] = texture;
            clb();
        });
    }, done);
};


exports.Sprite = function (x, y, z, tx, ty) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.tx = tx;
    this.ty = ty;
};


exports.SpriteBuffer = (function () {
    var verticesPerSprite = 6; // two triangles
    var floatsForPosition = 3; // xyz
    var floatsForTexCoord = 4; // stuv
    var floatsPerVertex = floatsForPosition + floatsForTexCoord;
    var floatsPerSprite = verticesPerSprite * floatsPerVertex;

    function SpriteBuffer (size, dynamicStorage) {
        this.size = size || 256;
        this.storagePolicy = dynamicStorage ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
        this.vbo = gl.createBuffer();
        this.filled = 0; // number of sprites currently inside
        this.vertexData = new Float32Array(this.size * floatsPerSprite);
        this.fillBuffer(this.vertexData); // to pre-alloc buffer
    }

    SpriteBuffer.prototype.fill = function (sprites) {
        var len = sprites.length;
        if (len > this.size) throw new Error("Can't fit " + len + " sprites to " + this.size + " batch!");
        var dataIndex = 0, data = this.vertexData;
        for (var i = 0; i < len; ++i) {
            var sprite = sprites[i];
            dataIndex = tessellateSprite(sprite, data, dataIndex);
        }
        if (dataIndex !== floatsPerSprite * len) {
            throw new Error("Tessellation error!");
        }
        this.fillBuffer(this.vertexData);
        this.filled = len;
    };

    SpriteBuffer.prototype.fillBuffer = function (data) {
        this.bind();
        gl.bufferData(gl.ARRAY_BUFFER, data, this.storagePolicy);
        this.unbind();
    };

    SpriteBuffer.prototype.bind = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    };

    SpriteBuffer.prototype.unbind = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    SpriteBuffer.prototype.draw = function (positionAttrLoc, texCoordAttrLoc) {
        this.bind();
        gl.vertexAttribPointer(positionAttrLoc, floatsForPosition, gl.FLOAT, false, floatsPerVertex * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.vertexAttribPointer(texCoordAttrLoc, floatsForTexCoord, gl.FLOAT, false, floatsPerVertex * Float32Array.BYTES_PER_ELEMENT, floatsForPosition * Float32Array.BYTES_PER_ELEMENT);
        gl.drawArrays(gl.TRIANGLES, 0, this.filled * verticesPerSprite);
        this.unbind();
    };

    function tessellateSprite (sprite, buf, index) {
        // Tessellates a given sprite to two triangles.
        // ^ y
        // |
        // |  lt    rt
        // |    ---
        // |   |\ 2|
        // |   | \ |
        // |   |1 \|
        // |    ---
        // |  lb    rb
        //  --------------> x
        // First (left) triangle vertices: lb, lt, rb
        // Second (right) triangle vertices: lt, rt, rb
        // Texture coordinates go from top to bottom.
        var x = sprite.x, y = sprite.y, z = sprite.z,
            tx = sprite.tx, ty = sprite.ty, tw = sprite.tw, th = sprite.th;
        // 1: lb
        buf[index++] = x; buf[index++] = y; buf[index++] = z;
        buf[index++] = tx; buf[index++] = ty;
        buf[index++] = 0; buf[index++] = 1;
        // 1: lt
        buf[index++] = x; buf[index++] = y + 1; buf[index++] = z;
        buf[index++] = tx; buf[index++] = ty;
        buf[index++] = 0; buf[index++] = 0;
        // 1: rb
        buf[index++] = x + 1; buf[index++] = y; buf[index++] = z;
        buf[index++] = tx; buf[index++] = ty;
        buf[index++] = 1; buf[index++] = 1;
        // 2: lt
        buf[index++] = x; buf[index++] = y + 1; buf[index++] = z;
        buf[index++] = tx; buf[index++] = ty;
        buf[index++] = 0; buf[index++] = 0;
        // 2: rt
        buf[index++] = x + 1; buf[index++] = y + 1; buf[index++] = z;
        buf[index++] = tx; buf[index++] = ty;
        buf[index++] = 1; buf[index++] = 0;
        // 2: rb
        buf[index++] = x + 1; buf[index++] = y; buf[index++] = z;
        buf[index++] = tx; buf[index++] = ty;
        buf[index++] = 1; buf[index++] = 1;
        return index;
    }

    return SpriteBuffer;
})();


exports.SpriteRender = (function () {
    function SpriteRender (prog, sheetId) {
        this.prog = prog;
        this.texture = sheetTextures[sheetId];
        this.sheetConf = config.spritesheets[sheetId];
        this.positionAttrLoc = gl.getAttribLocation(prog, "position");
        this.texCoordAttrLoc = gl.getAttribLocation(prog, "tex_coord");
        this.projectionUnifLoc = gl.getUniformLocation(prog, "projection");
        this.samplerUnifLoc = gl.getUniformLocation(prog, "sampler");
        this.texSizeUnifLoc = gl.getUniformLocation(prog, "tex_size");
        this.texSpriteSizeUnifLoc = gl.getUniformLocation(prog, "tex_sprite_size");
    }

    SpriteRender.prototype.draw = function (buffers, projection) {
        var positionAttrLoc = this.positionAttrLoc,
            texCoordAttrLoc = this.texCoordAttrLoc;
        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.samplerUnifLoc, 0);
        gl.uniform1f(this.texSizeUnifLoc, this.sheetConf.size);
        gl.uniform1f(this.texSpriteSizeUnifLoc, this.sheetConf.sprite_size);
        gl.uniformMatrix4fv(this.projectionUnifLoc, false, projection);
        gl.enableVertexAttribArray(positionAttrLoc);
        gl.enableVertexAttribArray(texCoordAttrLoc);
        buffers.forEach(function (buf) {
            buf.draw(positionAttrLoc, texCoordAttrLoc);
        });
        gl.disableVertexAttribArray(texCoordAttrLoc);
        gl.disableVertexAttribArray(positionAttrLoc);
    };

    return SpriteRender;
})();

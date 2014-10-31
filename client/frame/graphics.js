define(["resource"], function (resource) {
    var graphics = {};
    var shaderSources = {};

    graphics.init = function (config, clb) {
        function loadShaderPair (id) {
            ['f', 'v'].forEach(function (type) {
                resource.load("shader/" + id + "." + type + ".glsl", "text", function (source) {
                    shaderSources[id + "." + type] = source;
                });
            });
        }
        config.shaders.forEach(loadShaderPair);
        var shadersCnt = config.shaders.length * 2;
        var waitId = setInterval(function () {
            if (Object.keys(shaderSources).length === shadersCnt) {
                clearInterval(waitId);
                clb();
            }
        }, 20);
    };

    graphics.createContext = function (canvas, antialias) {
        var attributes = {
            antialias: !!antialias
        };
        var context = canvas.getContext("webgl", attributes);
        if (!context) throw new Error("Unable to initialize WebGL");
        return context;
    };

    graphics.createShaderProg = function (gl, id) {
        var fragment = graphics.loadShader(gl, id, true);
        var vertex = graphics.loadShader(gl, id, false);
        var prog = gl.createProgram();
        gl.attachShader(prog, vertex);
        gl.attachShader(prog, fragment);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            throw new Error("Linker failed on program " + id);
        }
        return prog;
    };

    graphics.loadShader = function (gl, id, is_fragment) {
        is_fragment = !!is_fragment;
        var shaderType = is_fragment ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER;
        var shaderId = id + (is_fragment ? ".f" : ".v");
        var source = shaderSources[shaderId];
        if (!source) throw new Error("Undefined shader: " + shaderId);
        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("An error occurred compiling shader " + shaderId
                + ": " + gl.getShaderInfoLog(shader));
        }
        return shader;
    };

    return graphics;
});

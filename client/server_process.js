var cp = require('child_process');

var child = null;

exports.start = function (port) {
    var platform = process.platform,
        exe = (platform == "win32" ? ".exe" : "");
    var root = process.cwd() + '/../../';
    var node = root + "bin/" + platform + "/node" + exe;
    child = cp.spawn(
        node, ["server", port], { cwd: root }
    );
    child.on("close", function (code) {
        throw new Error("Server process died with code: " + code);
    });
    if (require("./config").debug) {
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", function (chunk) {
            console.log("SERVER: " + chunk);
        });
    }
    child.unref();
};

exports.stop = function () {
    child.stdin.write("stop\n");
};

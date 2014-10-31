define([], function () {
    var loaded = {};
    var resourceManager = {};

    resourceManager.load = function (url, type, ready) {
        type = type || "binary";
        if (loaded[url]) {
            ready(loaded[url]);
        } else if (type == "image") {
            console.log("loading resource " + url + " as image");
            var img = new Image();
            img.onerror = function (err) {
                throw new Error('Resource loading error: Image error. URL:' + url, err);
            };
            img.onload = function(){
                loaded[url] = img;
                ready(loaded[url]);
                delete img.onload;
            };
            img.src = "./resource/" + url;
        } else {
            console.log("loading resource " + url + (text ? " as text" : " as binary"));
            var text = type == "text";
            var request = new XMLHttpRequest();
            request.open("GET", "./resource/" + url, true);
            request.responseType = text ? "text" : "arraybuffer";
            request.onload = function() {
                loaded[url] = request.response;
                ready(loaded[url]);
            };
            request.onerror = function() {
                throw new Error('Resource loading error: XHR error. URL:' + url);
            };
            request.send();
        }
    };

    return resourceManager;
});

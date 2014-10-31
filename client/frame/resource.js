define([], function () {
    var loaded = {};
    var resourceManager = {};

    resourceManager.load = function (url, ready, text) {
        text = !!text;
        if (loaded[url]) {
            ready(loaded[url]);
        } else {
            console.log("loading resource " + url + (text ? " as text" : " as binary"));
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

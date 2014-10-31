define([], function () {
    var storage = {};

    storage.setItem = function (key, value) {
        return localStorage.setItem(key, value);
    };

    storage.getItem = function (key) {
        return localStorage.getItem(key);
    };

    return storage;
});

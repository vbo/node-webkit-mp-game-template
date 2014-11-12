exports.hrtime = function () {
    // High-resolution time in millis
    // This is not relative to real time - just to some arbitrary point in the past
    var time = process.hrtime();
    return (time[0] * 1e9 + time[1])/1e6;
};

// general
// debug
exports.debug = false; // can be reset from `frame`
// sound
exports.sound = {
    defaultGain: {
        master: 0.6,
        music: 0.5,
        effects: 0.4
    },
    music: {
        menu: ["m1", "m2"],
        calm: ["m1", "m2"],
        action: ["m1", "m3"]
    },
    preload: ["m1", "m2", "m3", "alarm", "laser"],
    tracks: {
        m1: 'audio/music/magicchoop1.ogg',
        m2: 'audio/music/POPISHNEWMAGIC.ogg',
        m3: 'audio/music/n3xtik.ogg',
        alarm: 'audio/effect/alarm.ogg',
        laser: 'audio/effect/laser.ogg'
    }
};
// graphics
exports.graphics = {
    shaders: ["identity", "sprite"]
};
// application
// render
exports.render = {
    defaultScale: 24.0,
    spritesheets: {
        default: {
            url: "image/sprites-default-nonfree.png",
            sprite_size: 32.0,
            size: 512.0
        }
    }
};
// local server
exports.localServer = {
    port: 25561
};

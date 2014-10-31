define(["resource", "storage"], function (resource, storage) {
    var sound = {};
    // must be filled by init function
    var context = null;
    var gainNodes = {
        master: null,
        music: null,
        effects: null
    };
    var config = null;
    // music switching mechanism state
    var currentMusicMood, currentMusicId, currentMusicSource;
    var nextMusicTimeout;
    // to hold preloaded tracks
    var bufferedTracks = {};

    sound.init = function (soundConfig, clb) {
        config = soundConfig;
        context = new window.webkitAudioContext();
        // init gain graph
        var master = gainNodes.master = context.createGain();
        master.connect(context.destination);
        master.gain.value = config.defaultGain.master;
        var music = gainNodes.music = context.createGain();
        music.connect(master);
        music.gain.value = config.defaultGain.music;
        var effects = gainNodes.effects = context.createGain();
        effects.connect(master);
        effects.gain.value = config.defaultGain.effects;
        // clb will be fired after pre-loading all necessary tracks
        this.preload(config.preload, clb);
    };

    sound.preload = function (tracks, clb) {
        var newTracks = [];
        tracks.forEach(function (id) {
            if (!(id in bufferedTracks)) {
                newTracks[id] = config.tracks[id];
            }
        });
        new BufferLoader(context, newTracks, function (decoded) {
            for (var k in decoded) {
                if (decoded.hasOwnProperty(k)) {
                    bufferedTracks[k] = decoded[k];
                }
            }
            clb();
        }).load();
    };

    sound.applyStoredSettings = function () {
        ['master', 'music', 'effects'].forEach(function (k) {
            var e = 'volume_' + k;
            var val = storage.getItem(e);
            if (val !== null) {
                gainNodes[k].gain.value = val;
            }
        });
    };

    function SoundSource(id, gain) {
        gain = gain || 1.0;
        this.gainNode = context.createGain();
        this.gainNode.gain.value = gain;
        this.src = context.createBufferSource();
        this.src.buffer = bufferedTracks[id];
        this.src.connect(this.gainNode);
        this.duration = this.src.buffer.duration;
        this.fadeGainTime = 5;
    }
    SoundSource.prototype.connect = function (receiver) {
        this.gainNode.connect(receiver);
    };
    SoundSource.prototype.fadeGain = function (value) {
        var currentTime = context.currentTime;
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(value, currentTime + this.fadeGainTime);
    };
    SoundSource.prototype.start = function (at) {
        this.src.start(at);
    };

    function switchMusic(id) {
        console.log("switching music to:" + id);
        if (!currentMusicSource) {
            currentMusicSource = new SoundSource(id, 0.2);
            currentMusicSource.start(0);
            currentMusicSource.fadeGain(1.0);
        } else {
            var oldSource = currentMusicSource;
            oldSource.fadeGain(0.01);
            currentMusicSource = new SoundSource(id, 0.01);
            currentMusicSource.start(0);
            currentMusicSource.fadeGain(1.0);
        }
        currentMusicSource.connect(gainNodes.music);
        nextMusicTimeout = setTimeout(function () {
            sound.setMusicMood(currentMusicMood, true);
        }, (currentMusicSource.duration - currentMusicSource.fadeGainTime) * 1000);
        currentMusicId = id;
    }

    sound.play = function (id, at) {
        at = at || 0;
        var source = context.createBufferSource();
        source.buffer = bufferedTracks[id];
        source.connect(gainNodes.effects);
        source.start(at);
    };

    sound.setMusicMood = function (mood, force) {
        var sameMood = currentMusicMood == mood;
        if (sameMood && !force) return;
        if (!sameMood && nextMusicTimeout) {
            clearTimeout(nextMusicTimeout);
        }
        var music = config.music[mood].filter(function (id) {
            return id != currentMusicId && bufferedTracks[id];
        });
        var cnt = music.length;
        var newMusic = cnt ? music[Math.floor(Math.random() * cnt)] : currentMusicId;
        switchMusic(newMusic);
        currentMusicMood = mood;
    };

    function BufferLoader(context, urlList, callback) {
        this.context = context;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = this.urlList instanceof Array ? [] : {};
        this.loadCount = 0;
        this.loadTotal = 0;
    }

    BufferLoader.prototype.loadBuffer = function(url, index) {
        // Load buffer asynchronously
        var loader = this;
        resource.load(url, "binary", function (content) {
            // Asynchronously decode the audio file data
            loader.context.decodeAudioData(
                content,
                function(buffer) {
                    if (!buffer) {
                        throw new Error('error decoding file data: ' + url);
                    }
                    loader.bufferList[index] = buffer;
                    if (++loader.loadCount == loader.loadTotal)
                        loader.onload(loader.bufferList);
                },
                function(error) {
                    console.error('decodeAudioData error', error);
                }
            );
        });
    };

    BufferLoader.prototype.load = function() {
        for (var k in this.urlList) {
            if (this.urlList.hasOwnProperty(k)) {
                this.loadTotal++;
                this.loadBuffer(this.urlList[k], k);
            }
        }
    };

    return sound;
});

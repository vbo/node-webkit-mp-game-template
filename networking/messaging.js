var Bitfield = require("bitfield"); // TODO: dependency, and not an ideal API. Make homebrew for this?
// TODO: maybe we should try to reuse Buffers? Need to benchmark this
// TODO: check for memory allocations, maybe we should to implement some pooling/"out" parameter optimizations somewhere

var ACKS = exports.ACKS = 32;   // number of acknowledges of previously received packets

var messageTypes = {};

// call this to support new type of message
exports.registerMessageType = function (type) {
    var typeid = type.prototype.typeid; // it just feels good to define typeid on prototype, I haven't benchmark it
    var oldtype = messageTypes[typeid];
    if (oldtype) {
        throw new Error("Networking message type with id=" + typeid + " already exists: " + oldtype.name);
    }
    messageTypes[typeid] = type;
};

// base class for all your message types
var Message = exports.Message = function Message () {
    this.id = null;      // will be filled just before send
    this.sent = null;    // time when this message was sent (ms) or null if it's our first try
    this._buffer = null; // this should be nice to cache encoded message body at least for urgent reliable messages
    // Values below should be common for all messages of this type
    // so I think it's better to define them on message prototype once
    // and not in actual message constructor. Benchmark this!
    this.retryDelay = 0; // ms to wait before resending, 0 - no retry, set in derived constructor
    this.typeid = 0;     // Here you should specify 1 byte integer used to determine type of the message
};

Message.prototype.encode = function () {
    // Should return a Buffer, optionally with caching in this._buffer
    // Format is up to you =) Just try to make it as small as possible
    // Don't forget that Node.js buffers allocated uninitialized!
    if (!this._buffer) {
        this._buffer = new Buffer(256);
    }
    return this._buffer;
};

Message.decode = function (buf) {
    // Should return a [message, number of bytes decoded]
    // Input is the Buffer of data received with first bytes sliced out (typeid + messageid)
    // So you can decode it exactly like you encode it
    // Return null if message can't be decoded
    if (buf.length < 256) return null;
    // You don't need to set id and retryDelay, we don't use them anyway
    return [new Message(), 256];
};

exports.encodeMessage = function (msg) {
    var msgHeader = new Buffer(5);
    msgHeader.writeUInt8(msg.typeid, 0);
    msgHeader.writeUInt32BE(msg.id, 1);
    var buf = msg.encode();
    return [msgHeader, buf];
};

exports.decodeMessage = function (buf) {
    var typeid = buf.readUInt8(0);
    var id = buf.readUInt32BE(1);
    var type = messageTypes[typeid];
    if (!type) { throw new Error("Couldn't find registered networking message type with id=" + typeid); }
    var decoded = type.decode(buf.slice(5));
    var msg = decoded[0];
    var index = decoded[1];
    msg.id = id;
    return [msg, index + 5];
};

exports.encodeHeader = function (seq, peer) {
    // >>> 0 casts to uint32
    seq = seq >>> 0;          // packet seq
    var ack = peer.seq >>> 0; // peer.seq we received for sure (it's seq of latest packet received)
    var head = new Buffer(8);
    head.writeUInt32BE(seq, 0);
    head.writeUInt32BE(ack, 4);
    var acksField = new Bitfield(ACKS); // bitfield contain ack status for ACKS packets before peer.seq
    for (var i = ack - 1, j = 0; j < ACKS; i--, j++) {
        // Glenn said it's better to start with ack, not (ack - 1) here
        // because for first packets we don't actually want to ack anything
        // maybe I should fix this here too
        if (peer.seqsReceived[i]) acksField.set(j, 1);
    }
    return Buffer.concat([head, acksField.buffer])
};

exports.decodeHeader = function (buf) {
    var seq = buf.readUInt32BE(0);
    var ack = buf.readUInt32BE(4);
    var acksStart = 8;
    var acksEnd = 8 + ACKS / 8;
    var acksField = new Bitfield(buf.slice(acksStart, acksEnd));
    var acks = new Array(ACKS + 1);
    acks[0] = ack;
    for (var i = ack - 1, j = 0; j < ACKS; i--, j++) {
        if (acksField.get(j)) acks[j + 1] = i;
    }
    return [seq, acks, buf.slice(acksEnd)];
};

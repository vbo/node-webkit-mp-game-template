var messaging = require("./messaging");

var EventEmitter = require("events").EventEmitter;

var Peer = module.exports = function Peer (id, address, port) {
    this.id = id;
    this.address = address;
    this.port = port;
    this.nextMessageId = 0;
    this.seq = -1;                // highest seq of received packet
    this.seqLocal = 0;            // seq of the next sent packet
    this.seqsReceived = {};       // used to ack remote packets
    this.messageIdsReceived = {}; // used to filter duplicate messages (how to clean this up?)
    this.pendingMessages = {};    // will be considered to send on next flush
    this.messageIdsBySeq = {};    // used to ack messages when packet is acked
};

Peer.prototype = new EventEmitter(); // emits "ack", "message"
Peer.prototype.constructor = Peer;

Peer.prototype.send = function (msg) {
    msg.id = this.nextMessageId++;
    this.pendingMessages[msg.id] = msg;
};

Peer.prototype.recvMessage = function (msg) {
    if (!this.messageIdsReceived[msg.id]) {
        this.messageIdsReceived[msg.id] = 1;
        this.emit("message", msg);
    } else {
        console.log("DUPL! " + msg.id);
    }
};

Peer.prototype.recvPacket = function (seq, acks) {
    // Work with remote seq and acks
    this.seqsReceived[seq] = 1;  // now we can acknowledge this packet
    if (seq > this.seq || this.seq < 0) {
        this.seq = seq; // store latest seq received
        // cleanup old receives
        var tooOld = seq - messaging.ACKS; // we'll not ack this guys anyway
        for (var recvd in this.seqsReceived) {
            if (recvd < tooOld) {
                // TODO: maybe there is better data structure to hold them?
                delete this.seqsReceived[recvd];
            }
        }
    }
    // ack messages from acked packets
    var messageIdsBySeq = this.messageIdsBySeq;
    var pendingMessages = this.pendingMessages;
    for (var i = 0, ii = acks.length; i < ii; ++i) {
        var messageIds = messageIdsBySeq[acks[i]];
        if (messageIds) {
            for (var j = 0, jj = messageIds.length; j < jj; ++j) {
                var messageId = messageIds[j];
                delete pendingMessages[messageId];
                this.emit("ack", messageId);
            }
            delete messageIdsBySeq[acks[i]];
        }
    }
}

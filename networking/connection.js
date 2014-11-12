var dgram = require("dgram");
var EventEmitter = require("events").EventEmitter;

var Peer = require("./peer");
var hrtime = require("./timing").hrtime;
var messaging = require("./messaging");

var RATE = 20;   // packet sending loop interval delay (ms)
var PMAX = 1200; // maximum packet size (bytes). 1400 is known as common MTU

var Connection = module.exports = function Connection () {
    this.socket = dgram.createSocket("udp4");
    this.peers = {};        // all connected peers indexed by peer.id
    this.listening = false; // is local peer wants to accept direct connections
    // Error handling
    this.socket.on("close", function () { clearInterval(this.intervalId); }.bind(this));
    this.socket.on("error", function (e) { console.log("Network socket error!"); throw e; });
    // Recv
    this.socket.on("message", function (data, remote) {
        // Determine sender, for now just using host:port as peer id
        // TODO: client ID etc.
        var address = remote.address;
        var port = remote.port;
        var peerId = address + ":" + port;
        var peer = this.peers[peerId];
        if (!peer) {
            // New connection?
            // TODO: how to avoid spam here?
            if (!this.listening) return; // we don't want to accept this if we are not a server type
            this.peers[peerId] = peer = new Peer(peerId, address, port);
            this.emit("peer", peer);
        }
        // Decode packet
        var decoded = messaging.decodeHeader(data);
        var seq = decoded[0];         // remote seq of this packet
        var acks = decoded[1];        // list of our local seqs known to be received by this peer
        var messagesBuf = decoded[2]; // remaining buffer after packet decoding contains messages (if any)
        //console.log("RECV", seq, acks);
        peer.recvPacket(seq, acks);
        while (messagesBuf.length) {
            // TODO: don't need to parse message body for duplicates
            var parts = messaging.decodeMessage(messagesBuf);
            var msg = parts[0];
            messagesBuf = messagesBuf.slice(parts[1]); // remaining bytes
            peer.recvMessage(msg);
        }
    }.bind(this));

    this.intervalId = setInterval(function () {
        var curtime = hrtime();
        // We are sending packets to all connected peers once in RATE ms
        for (var p in this.peers) {
            var peer = this.peers[p];
            var msg;
            // we are always send packets, even with no messages at all
            var seq = peer.seqLocal++;
            var headerBuf = messaging.encodeHeader(seq, peer); // data from peer sufficient to encode acks about received packets
            // Finding out if we need to send something now
            var messagesForThisPacket = {};
            for (var m in peer.pendingMessages) {
                // TODO: prioritize!
                msg = peer.pendingMessages[m];
                // check if we want to include this msg
                var sent = msg.sent;
                if (sent) {
                    // was already sent in previous packet
                    if (!msg.retryDelay) {
                        // fully unreliable message
                        // TODO: right place for this?
                        // TODO: what if we have some bandwidth for this too?
                        delete peer.pendingMessages[m];
                    } else if (curtime > sent + msg.retryDelay) {
                        // reliable: resend after minor delay if not acked yet
                        // TODO: if we CAN fit such messages after all urgent message there we should do this
                        console.log("RETRY! " + msg.id + " after " + msg.retryDelay);
                        messagesForThisPacket[msg.id] = msg;
                    }
                } else {
                    // sending for the first time
                    messagesForThisPacket[msg.id] = msg;
                }
            }
            // collect buffers for this packet while it's size if OK
            // TODO: Buffer pool
            var bufs = [headerBuf];
            var messageIds = [];
            var size = headerBuf.length;
            for (var k in messagesForThisPacket) {
                msg = messagesForThisPacket[k];
                var msgBufs = messaging.encodeMessage(msg);
                for (var i = 0, ii = msgBufs.length; i < ii; ++i) {
                    size += msgBufs[i].length;
                }
                if (size > PMAX) {
                    // can't fit message to this packet
                    // console.log("Can't fit!");
                    break;
                }
                msg.sent = curtime;
                bufs.push.apply(bufs, msgBufs);
                messageIds.push(msg.id);
            }
            peer.messageIdsBySeq[seq] = messageIds;
            //console.log("SEND", seq, peer.seqsReceived, messageIds);
            this.rawSend(Buffer.concat(bufs), peer);
        }
    }.bind(this), RATE);
};

Connection.prototype = new EventEmitter(); // emits "peer"
Connection.prototype.constructor = Connection;

Connection.prototype.close = function () {
    this.socket.close();
};

Connection.prototype.directConnect = function (address, port) {
    var id = generatePeerId(address, port);
    var peer = new Peer(id, address, port);
    this.peers[id] = peer;
    return peer;
};

Connection.prototype.rawSend = function (packet, peer) {
    return this.socket.send(packet, 0, packet.length, peer.port, peer.address);
};

Connection.prototype.listen = function (port) {
    this.socket.on("listening", function () {
        this.listening = this.socket.address();
        this.emit("listening");
    }.bind(this));
    this.socket.bind(port);
};

function generatePeerId (address, port) {
    return address + ":" + port;
}

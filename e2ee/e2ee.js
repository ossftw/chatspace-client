(function () {
  'use strict';

  var P = 2n ** 255n - 19n;
  var A24 = 121665n;
  var BASE = new Uint8Array(32);
  BASE[0] = 9;

  function mod(a, b) {
    var r = a % b;
    return r < 0n ? r + b : r;
  }

  function decodeLE(bytes) {
    var result = 0n;
    for (var i = 0; i < bytes.length; i++) {
      result |= BigInt(bytes[i]) << BigInt(8 * i);
    }
    return result;
  }

  function encodeLE(num, len) {
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = Number(num & 0xffn);
      num >>= 8n;
    }
    return bytes;
  }

  function clamp(s) {
    s = new Uint8Array(s);
    s[0] &= 248;
    s[31] &= 127;
    s[31] |= 64;
    return s;
  }

  function modPow(base, exp) {
    var result = 1n;
    base = base % P;
    while (exp > 0n) {
      if (exp & 1n) result = mod(result * base, P);
      exp >>= 1n;
      base = mod(base * base, P);
    }
    return result;
  }

  function scalarMult(n, u) {
    n = clamp(n);
    var x1 = decodeLE(u) & (2n ** 255n - 1n);
    var x2 = 1n, z2 = 0n, x3 = x1, z3 = 1n;
    var swap = 0n;

    for (var t = 254; t >= 0; t--) {
      var bit = BigInt((n[t >> 3] >> (t & 7)) & 1);
      var s = bit ^ swap;
      swap = bit;

      if (s) {
        var tmp = x2; x2 = x3; x3 = tmp;
        tmp = z2; z2 = z3; z3 = tmp;
      }

      var A = mod(x2 + z2, P);
      var AA = mod(A * A, P);
      var B = mod(x2 - z2, P);
      var BB = mod(B * B, P);
      var E = mod(AA - BB, P);
      var C = mod(x3 + z3, P);
      var D = mod(x3 - z3, P);
      var DA = mod(D * A, P);
      var CB = mod(C * B, P);

      x3 = mod((DA + CB) * (DA + CB), P);
      z3 = mod(x1 * mod((DA - CB) * (DA - CB), P), P);
      x2 = mod(AA * BB, P);
      z2 = mod(E * mod(AA + mod(A24 * E, P), P), P);
    }

    if (swap) {
      tmp = x2; x2 = x3; x3 = tmp;
      tmp = z2; z2 = z3; z3 = tmp;
    }

    var invZ2 = modPow(z2, P - 2n);
    return encodeLE(mod(x2 * invZ2, P), 32);
  }

  function generateKeyPair() {
    var priv = new Uint8Array(32);
    crypto.getRandomValues(priv);
    return { privateKey: priv, publicKey: scalarMult(priv, BASE) };
  }

  function sharedSecret(myPriv, theirPub) {
    return scalarMult(myPriv, theirPub);
  }

  function concat() {
    var arrays = arguments;
    var total = 0;
    for (var i = 0; i < arrays.length; i++) total += arrays[i].length;
    var result = new Uint8Array(total);
    var offset = 0;
    for (var i = 0; i < arrays.length; i++) {
      result.set(arrays[i], offset);
      offset += arrays[i].length;
    }
    return result;
  }

  function toB64(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromB64(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var binary = atob(str);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function hmacSHA256(key, data) {
    var keyObj = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', keyObj, data));
  }

  async function hkdf(salt, ikm, info, length) {
    var prk = await hmacSHA256(salt, ikm);
    var n = Math.ceil(length / 32);
    var result = new Uint8Array(length);
    var t = new Uint8Array(0);
    var infoEnc = new TextEncoder().encode(info);
    for (var i = 1; i <= n; i++) {
      var input = concat(t, infoEnc, new Uint8Array([i]));
      t = await hmacSHA256(prk, input);
      result.set(t, (i - 1) * 32);
    }
    return result.slice(0, length);
  }

  async function aesEncrypt(keyBytes, plaintext, nonce) {
    var key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
    if (!nonce) nonce = crypto.getRandomValues(new Uint8Array(12));
    var encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, plaintext);
    return { ciphertext: new Uint8Array(encrypted), nonce: nonce };
  }

  async function aesDecrypt(keyBytes, ciphertext, nonce) {
    var key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
    var decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, ciphertext);
    return new Uint8Array(decrypted);
  }

  var E2EE = {
    _priv: null,
    _pub: null,
    _pubB64: null,
    _ready: false,
    _peers: {},
    _chUsers: {},

    async init() {
      if (this._ready) return;

      var storedPriv = localStorage.getItem('e2ee_priv');
      var storedPub = localStorage.getItem('e2ee_pub');

      if (storedPriv && storedPub) {
        this._priv = fromB64(storedPriv);
        this._pub = fromB64(storedPub);
      } else {
        var kp = generateKeyPair();
        this._priv = kp.privateKey;
        this._pub = kp.publicKey;
        localStorage.setItem('e2ee_priv', toB64(this._priv));
        localStorage.setItem('e2ee_pub', toB64(this._pub));
      }

      this._pubB64 = toB64(this._pub);

      try {
        var cached = JSON.parse(localStorage.getItem('e2ee_peers') || '{}');
        for (var uid in cached) {
          if (cached.hasOwnProperty(uid)) {
            this._peers[uid] = { b64: cached[uid], raw: fromB64(cached[uid]) };
          }
        }
      } catch (e) {}

      try {
        this._chUsers = JSON.parse(localStorage.getItem('e2ee_chans') || '{}');
      } catch (e) {
        this._chUsers = {};
      }

      this._ready = true;
    },

    getPubB64() { return this._pubB64; },
    get isReady() { return this._ready; },

    addPeerKey(userId, b64) {
      this._peers[userId] = { b64: b64, raw: fromB64(b64) };
      var toStore = {};
      for (var uid in this._peers) {
        if (this._peers.hasOwnProperty(uid)) toStore[uid] = this._peers[uid].b64;
      }
      localStorage.setItem('e2ee_peers', JSON.stringify(toStore));
    },

    getPeerB64(userId) {
      var p = this._peers[userId];
      return p ? p.b64 : null;
    },

    addChUser(channelId, userId) {
      if (!this._chUsers[channelId]) this._chUsers[channelId] = {};
      this._chUsers[channelId][userId] = true;
      var toStore = {};
      for (var cid in this._chUsers) {
        if (this._chUsers.hasOwnProperty(cid)) {
          toStore[cid] = {};
          for (var uid in this._chUsers[cid]) {
            if (this._chUsers[cid].hasOwnProperty(uid)) toStore[cid][uid] = true;
          }
        }
      }
      localStorage.setItem('e2ee_chans', JSON.stringify(toStore));
    },

    getChUserIds(channelId) {
      var users = this._chUsers[channelId];
      return users ? Object.keys(users) : [];
    },

    async encrypt(plaintext, channelId) {
      if (!this._ready) return null;

      var msgKey = crypto.getRandomValues(new Uint8Array(32));
      var ptEncoded = new TextEncoder().encode(plaintext);
      var enc = await aesEncrypt(msgKey, ptEncoded);
      var ciphertext = enc.ciphertext;
      var msgNonce = enc.nonce;

      var recipients = {};
      var myId = localStorage.id;
      if (myId) recipients[myId] = this._pubB64;

      var chUsers = this.getChUserIds(channelId);
      for (var i = 0; i < chUsers.length; i++) {
        var uid = chUsers[i];
        if (uid === myId) continue;
        var pk = this.getPeerB64(uid);
        if (pk) recipients[uid] = pk;
      }

      var recipientIds = Object.keys(recipients);
      if (recipientIds.length === 0) return null;

      var encryptedKeys = {};
      for (var i = 0; i < recipientIds.length; i++) {
        var uid = recipientIds[i];
        var recipPubB64 = recipients[uid];
        var shared = sharedSecret(this._priv, fromB64(recipPubB64));
        var salt = new TextEncoder().encode(channelId || '0');
        var kek = await hkdf(salt, shared, 'chatspace-e2ee-kek', 32);
        var kekNonce = crypto.getRandomValues(new Uint8Array(12));
        var ekeyResult = await aesEncrypt(kek, msgKey, kekNonce);
        encryptedKeys[uid] = toB64(concat(ekeyResult.nonce, ekeyResult.ciphertext));
      }

      var keysStr = JSON.stringify(encryptedKeys);
      if (keysStr.length > 3500) return null;

      var result = '[E2EE_MSG:v1:' + keysStr + ':' + toB64(ciphertext) + ':' + toB64(msgNonce) + ']';
      if (result.length > 4096) return null;

      return result;
    },

    async decrypt(senderId, payload, channelId) {
      if (!this._ready || !payload) return null;

      var m = payload.match(/^\[E2EE_MSG:(v\d+):(\{.*?\}):([A-Za-z0-9_\-]+):([A-Za-z0-9_\-]+)\]$/);
      if (!m || m[1] !== 'v1') return null;

      var encryptedKeys;
      try { encryptedKeys = JSON.parse(m[2]); } catch (e) { return null; }
      var ciphertext = fromB64(m[3]);
      var msgNonce = fromB64(m[4]);

      var myId = localStorage.id;
      var myEntryB64 = encryptedKeys[myId];
      if (!myEntryB64) return null;

      var myEntry = fromB64(myEntryB64);
      var kekNonce = myEntry.slice(0, 12);
      var ekeyCt = myEntry.slice(12);

      var senderPubB64;
      if (senderId === myId) {
        senderPubB64 = this._pubB64;
      } else {
        senderPubB64 = this.getPeerB64(senderId);
      }
      if (!senderPubB64) return null;

      var shared = sharedSecret(this._priv, fromB64(senderPubB64));
      var salt = new TextEncoder().encode(channelId || '0');
      var kek = await hkdf(salt, shared, 'chatspace-e2ee-kek', 32);

      try {
        var msgKey = await aesDecrypt(kek, ekeyCt, kekNonce);
        var plainBytes = await aesDecrypt(msgKey, ciphertext, msgNonce);
        return new TextDecoder().decode(plainBytes);
      } catch (e) {
        return null;
      }
    },

    announceKey(channelId) {
      if (!this._ready || !channelId || !client.connected()) return;
      client.send({ m: 'channel', type: 'send', channel: channelId, message: '[E2EE_KEY:v1:' + this._pubB64 + ']' });
    }
  };

  window.E2EE = E2EE;
})();

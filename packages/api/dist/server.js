var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "../../node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__)
        prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt])
        emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn)
        emitter._events[evt].push(listener);
      else
        emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0)
        emitter._events = new Events();
      else
        delete emitter._events[evt];
    }
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0)
        return names;
      for (name in events = this._events) {
        if (has.call(events, name))
          names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers)
        return [];
      if (handlers.fn)
        return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners)
        return 0;
      if (listeners.fn)
        return 1;
      return listeners.length;
    };
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt])
        return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once)
          this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once)
            this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args)
                for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt])
        return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length)
          this._events[evt] = events.length === 1 ? events[0] : events;
        else
          clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt])
          clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prefixed = prefix;
    EventEmitter.EventEmitter = EventEmitter;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter;
    }
  }
});

// ../../node_modules/p-finally/index.js
var require_p_finally = __commonJS({
  "../../node_modules/p-finally/index.js"(exports, module) {
    "use strict";
    module.exports = (promise, onFinally) => {
      onFinally = onFinally || (() => {
      });
      return promise.then(
        (val) => new Promise((resolve3) => {
          resolve3(onFinally());
        }).then(() => val),
        (err) => new Promise((resolve3) => {
          resolve3(onFinally());
        }).then(() => {
          throw err;
        })
      );
    };
  }
});

// ../../node_modules/p-timeout/index.js
var require_p_timeout = __commonJS({
  "../../node_modules/p-timeout/index.js"(exports, module) {
    "use strict";
    var pFinally = require_p_finally();
    var TimeoutError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "TimeoutError";
      }
    };
    var pTimeout = (promise, milliseconds, fallback) => new Promise((resolve3, reject) => {
      if (typeof milliseconds !== "number" || milliseconds < 0) {
        throw new TypeError("Expected `milliseconds` to be a positive number");
      }
      if (milliseconds === Infinity) {
        resolve3(promise);
        return;
      }
      const timer = setTimeout(() => {
        if (typeof fallback === "function") {
          try {
            resolve3(fallback());
          } catch (error) {
            reject(error);
          }
          return;
        }
        const message = typeof fallback === "string" ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
        const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);
        if (typeof promise.cancel === "function") {
          promise.cancel();
        }
        reject(timeoutError);
      }, milliseconds);
      pFinally(
        // eslint-disable-next-line promise/prefer-await-to-then
        promise.then(resolve3, reject),
        () => {
          clearTimeout(timer);
        }
      );
    });
    module.exports = pTimeout;
    module.exports.default = pTimeout;
    module.exports.TimeoutError = TimeoutError;
  }
});

// ../../node_modules/p-queue/dist/lower-bound.js
var require_lower_bound = __commonJS({
  "../../node_modules/p-queue/dist/lower-bound.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function lowerBound(array, value, comparator) {
      let first = 0;
      let count = array.length;
      while (count > 0) {
        const step = count / 2 | 0;
        let it = first + step;
        if (comparator(array[it], value) <= 0) {
          first = ++it;
          count -= step + 1;
        } else {
          count = step;
        }
      }
      return first;
    }
    exports.default = lowerBound;
  }
});

// ../../node_modules/p-queue/dist/priority-queue.js
var require_priority_queue = __commonJS({
  "../../node_modules/p-queue/dist/priority-queue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var lower_bound_1 = require_lower_bound();
    var PriorityQueue = class {
      constructor() {
        this._queue = [];
      }
      enqueue(run, options) {
        options = Object.assign({ priority: 0 }, options);
        const element = {
          priority: options.priority,
          run
        };
        if (this.size && this._queue[this.size - 1].priority >= options.priority) {
          this._queue.push(element);
          return;
        }
        const index = lower_bound_1.default(this._queue, element, (a, b) => b.priority - a.priority);
        this._queue.splice(index, 0, element);
      }
      dequeue() {
        const item = this._queue.shift();
        return item === null || item === void 0 ? void 0 : item.run;
      }
      filter(options) {
        return this._queue.filter((element) => element.priority === options.priority).map((element) => element.run);
      }
      get size() {
        return this._queue.length;
      }
    };
    exports.default = PriorityQueue;
  }
});

// ../../node_modules/p-queue/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/p-queue/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventEmitter = require_eventemitter3();
    var p_timeout_1 = require_p_timeout();
    var priority_queue_1 = require_priority_queue();
    var empty = () => {
    };
    var timeoutError = new p_timeout_1.TimeoutError();
    var PQueue2 = class extends EventEmitter {
      constructor(options) {
        var _a2, _b, _c, _d;
        super();
        this._intervalCount = 0;
        this._intervalEnd = 0;
        this._pendingCount = 0;
        this._resolveEmpty = empty;
        this._resolveIdle = empty;
        options = Object.assign({ carryoverConcurrencyCount: false, intervalCap: Infinity, interval: 0, concurrency: Infinity, autoStart: true, queueClass: priority_queue_1.default }, options);
        if (!(typeof options.intervalCap === "number" && options.intervalCap >= 1)) {
          throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a2 = options.intervalCap) === null || _a2 === void 0 ? void 0 : _a2.toString()) !== null && _b !== void 0 ? _b : ""}\` (${typeof options.intervalCap})`);
        }
        if (options.interval === void 0 || !(Number.isFinite(options.interval) && options.interval >= 0)) {
          throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""}\` (${typeof options.interval})`);
        }
        this._carryoverConcurrencyCount = options.carryoverConcurrencyCount;
        this._isIntervalIgnored = options.intervalCap === Infinity || options.interval === 0;
        this._intervalCap = options.intervalCap;
        this._interval = options.interval;
        this._queue = new options.queueClass();
        this._queueClass = options.queueClass;
        this.concurrency = options.concurrency;
        this._timeout = options.timeout;
        this._throwOnTimeout = options.throwOnTimeout === true;
        this._isPaused = options.autoStart === false;
      }
      get _doesIntervalAllowAnother() {
        return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
      }
      get _doesConcurrentAllowAnother() {
        return this._pendingCount < this._concurrency;
      }
      _next() {
        this._pendingCount--;
        this._tryToStartAnother();
        this.emit("next");
      }
      _resolvePromises() {
        this._resolveEmpty();
        this._resolveEmpty = empty;
        if (this._pendingCount === 0) {
          this._resolveIdle();
          this._resolveIdle = empty;
          this.emit("idle");
        }
      }
      _onResumeInterval() {
        this._onInterval();
        this._initializeIntervalIfNeeded();
        this._timeoutId = void 0;
      }
      _isIntervalPaused() {
        const now = Date.now();
        if (this._intervalId === void 0) {
          const delay = this._intervalEnd - now;
          if (delay < 0) {
            this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
          } else {
            if (this._timeoutId === void 0) {
              this._timeoutId = setTimeout(() => {
                this._onResumeInterval();
              }, delay);
            }
            return true;
          }
        }
        return false;
      }
      _tryToStartAnother() {
        if (this._queue.size === 0) {
          if (this._intervalId) {
            clearInterval(this._intervalId);
          }
          this._intervalId = void 0;
          this._resolvePromises();
          return false;
        }
        if (!this._isPaused) {
          const canInitializeInterval = !this._isIntervalPaused();
          if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
            const job = this._queue.dequeue();
            if (!job) {
              return false;
            }
            this.emit("active");
            job();
            if (canInitializeInterval) {
              this._initializeIntervalIfNeeded();
            }
            return true;
          }
        }
        return false;
      }
      _initializeIntervalIfNeeded() {
        if (this._isIntervalIgnored || this._intervalId !== void 0) {
          return;
        }
        this._intervalId = setInterval(() => {
          this._onInterval();
        }, this._interval);
        this._intervalEnd = Date.now() + this._interval;
      }
      _onInterval() {
        if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
          clearInterval(this._intervalId);
          this._intervalId = void 0;
        }
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
        this._processQueue();
      }
      /**
      Executes all queued functions until it reaches the limit.
      */
      _processQueue() {
        while (this._tryToStartAnother()) {
        }
      }
      get concurrency() {
        return this._concurrency;
      }
      set concurrency(newConcurrency) {
        if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
          throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
        }
        this._concurrency = newConcurrency;
        this._processQueue();
      }
      /**
      Adds a sync or async task to the queue. Always returns a promise.
      */
      async add(fn, options = {}) {
        return new Promise((resolve3, reject) => {
          const run = async () => {
            this._pendingCount++;
            this._intervalCount++;
            try {
              const operation = this._timeout === void 0 && options.timeout === void 0 ? fn() : p_timeout_1.default(Promise.resolve(fn()), options.timeout === void 0 ? this._timeout : options.timeout, () => {
                if (options.throwOnTimeout === void 0 ? this._throwOnTimeout : options.throwOnTimeout) {
                  reject(timeoutError);
                }
                return void 0;
              });
              resolve3(await operation);
            } catch (error) {
              reject(error);
            }
            this._next();
          };
          this._queue.enqueue(run, options);
          this._tryToStartAnother();
          this.emit("add");
        });
      }
      /**
          Same as `.add()`, but accepts an array of sync or async functions.
      
          @returns A promise that resolves when all functions are resolved.
          */
      async addAll(functions, options) {
        return Promise.all(functions.map(async (function_) => this.add(function_, options)));
      }
      /**
      Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
      */
      start() {
        if (!this._isPaused) {
          return this;
        }
        this._isPaused = false;
        this._processQueue();
        return this;
      }
      /**
      Put queue execution on hold.
      */
      pause() {
        this._isPaused = true;
      }
      /**
      Clear the queue.
      */
      clear() {
        this._queue = new this._queueClass();
      }
      /**
          Can be called multiple times. Useful if you for example add additional items at a later time.
      
          @returns A promise that settles when the queue becomes empty.
          */
      async onEmpty() {
        if (this._queue.size === 0) {
          return;
        }
        return new Promise((resolve3) => {
          const existingResolve = this._resolveEmpty;
          this._resolveEmpty = () => {
            existingResolve();
            resolve3();
          };
        });
      }
      /**
          The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
      
          @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
          */
      async onIdle() {
        if (this._pendingCount === 0 && this._queue.size === 0) {
          return;
        }
        return new Promise((resolve3) => {
          const existingResolve = this._resolveIdle;
          this._resolveIdle = () => {
            existingResolve();
            resolve3();
          };
        });
      }
      /**
      Size of the queue.
      */
      get size() {
        return this._queue.size;
      }
      /**
          Size of the queue, filtered by the given options.
      
          For example, this can be used to find the number of items remaining in the queue with a specific priority level.
          */
      sizeBy(options) {
        return this._queue.filter(options).length;
      }
      /**
      Number of pending promises.
      */
      get pending() {
        return this._pendingCount;
      }
      /**
      Whether the queue is currently paused.
      */
      get isPaused() {
        return this._isPaused;
      }
      get timeout() {
        return this._timeout;
      }
      /**
      Set the timeout for future operations.
      */
      set timeout(milliseconds) {
        this._timeout = milliseconds;
      }
    };
    exports.default = PQueue2;
  }
});

// ../../node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "../../node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1)
        validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr2 = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr2[curByte++] = tmp >> 16 & 255;
        arr2[curByte++] = tmp >> 8 & 255;
        arr2[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr2[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr2[curByte++] = tmp >> 8 & 255;
        arr2[curByte++] = tmp & 255;
      }
      return arr2;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// src/routes/chat.routes.ts
import { Router } from "express";

// src/config/database.ts
import pg from "pg";
var { Pool } = pg;
var EMBEDDING_DIM_ESPERADA = 1024;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  // Máximo de conexões simultâneas
  idleTimeoutMillis: 12e4,
  // Fecha conexões ociosas após 120s
  connectionTimeoutMillis: 6e4
  // Timeout para obter conexão do pool
});
async function testarConexaoDB() {
  try {
    const client2 = await pool.connect();
    const result = await client2.query("SELECT NOW() as agora");
    console.log(
      `\u2705 [Database] Conectado ao PostgreSQL \u2014 ${result.rows[0].agora}`
    );
    client2.release();
  } catch (error) {
    console.error("\u274C [Database] Falha ao conectar ao PostgreSQL:", error);
    console.error(
      "   Verifique a vari\xE1vel DATABASE_URL no arquivo .env"
    );
  }
}
async function verificarDimensaoEmbedding() {
  try {
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'documents'
      ) AS existe
    `);
    if (!tabelaExiste.rows[0]?.existe) {
      console.log("\u23ED\uFE0F  [Database] Tabela 'documents' n\xE3o existe ainda. Pulando verifica\xE7\xE3o de dimens\xE3o.");
      return;
    }
    const result = await pool.query(`
      SELECT atttypmod AS dim
      FROM pg_attribute
      WHERE attrelid = 'documents'::regclass
        AND attname = 'embedding'
    `);
    if (result.rows.length === 0) {
      console.warn("\u26A0\uFE0F  [Database] Coluna 'embedding' n\xE3o encontrada na tabela 'documents'.");
      return;
    }
    const dimAtual = result.rows[0].dim;
    if (dimAtual === EMBEDDING_DIM_ESPERADA) {
      console.log(`\u2705 [Database] Dimens\xE3o do embedding: ${dimAtual}d \u2713`);
      return;
    }
    console.warn(
      `\u26A0\uFE0F  [Database] Dimens\xE3o incompat\xEDvel detectada: ${dimAtual}d (esperado: ${EMBEDDING_DIM_ESPERADA}d)`
    );
    console.log(`\u{1F504} [Database] Iniciando auto-migra\xE7\xE3o ${dimAtual}d \u2192 ${EMBEDDING_DIM_ESPERADA}d...`);
    const countResult = await pool.query(`SELECT COUNT(*) AS total FROM documents WHERE embedding IS NOT NULL`);
    const registrosExistentes = Number(countResult.rows[0]?.total || 0);
    if (registrosExistentes > 0) {
      console.warn(
        `\u26A0\uFE0F  [Database] ${registrosExistentes} registro(s) com embeddings ser\xE3o invalidados. Re-uploade os documentos ap\xF3s a migra\xE7\xE3o.`
      );
    }
    await pool.query(`DROP INDEX IF EXISTS idx_documents_embedding`);
    await pool.query(`ALTER TABLE documents DROP COLUMN IF EXISTS embedding`);
    await pool.query(`ALTER TABLE documents ADD COLUMN embedding vector(${EMBEDDING_DIM_ESPERADA})`);
    await pool.query(`
      CREATE INDEX idx_documents_embedding
        ON documents USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 200)
    `);
    console.log(
      `\u2705 [Database] Auto-migra\xE7\xE3o conclu\xEDda! Embedding agora \xE9 ${EMBEDDING_DIM_ESPERADA}d (HNSW).`
    );
    if (registrosExistentes > 0) {
      console.warn(
        `\u26A0\uFE0F  [Database] A\xC7\xC3O NECESS\xC1RIA: Re-uploade os ${registrosExistentes} documento(s) via /api/embedding/upload`
      );
    }
  } catch (error) {
    console.error(
      "\u274C [Database] Falha na verifica\xE7\xE3o/migra\xE7\xE3o de dimens\xE3o:",
      error instanceof Error ? error.message : error
    );
  }
}

// src/config/ollama.ts
var OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
var EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "bge-m3";
var LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:4b";
var REWRITE_MODEL = process.env.OLLAMA_REWRITE_MODEL || "qwen3.5:4b";
var NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 8192;
var FETCH_TIMEOUT_MS = 18e4;
function podarHistorico(mensagens, maxInteracoes = 4) {
  if (mensagens.length <= maxInteracoes + 1)
    return mensagens;
  const systemPrompt = mensagens.find((m) => m.role === "system");
  const outrasMensagens = mensagens.filter((m) => m.role !== "system");
  const mensagensRecentes = outrasMensagens.slice(-maxInteracoes);
  return systemPrompt ? [systemPrompt, ...mensagensRecentes] : mensagensRecentes;
}
async function verificarOllama() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(1e4)
      // Timeout rápido de 10s para health check
    });
    if (!response.ok)
      throw new Error(`Status ${response.status}`);
    const data = await response.json();
    const modelos = data.models?.map((m) => m.name) || [];
    console.log(`\u2705 [Ollama] Conectado em ${OLLAMA_BASE_URL}`);
    console.log(`   Modelos dispon\xEDveis: ${modelos.join(", ") || "nenhum"}`);
  } catch (error) {
    console.error(`\u274C [Ollama] Servidor inacess\xEDvel em ${OLLAMA_BASE_URL}`);
    console.error("   Verifique se o Ollama est\xE1 rodando e a vari\xE1vel OLLAMA_BASE_URL");
  }
}
async function gerarEmbeddingOllama(texto) {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: texto,
      keep_alive: "24h"
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Ollama Embedding] Erro ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error("[Ollama Embedding] Resposta inv\xE1lida \u2014 campo 'embedding' ausente");
  }
  return data.embedding;
}
async function reescreverComLLM(systemPrompt, pergunta) {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: REWRITE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pergunta }
      ],
      stream: false,
      keep_alive: "24h",
      options: {
        temperature: 0,
        num_ctx: NUM_CTX,
        num_predict: 100
      }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Ollama Rewrite] Erro ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`[Ollama Rewrite] Erro do Ollama: ${data.error}`);
  }
  if (!data.message || typeof data.message.content !== "string") {
    console.error("\u274C [Ollama Rewrite] Resposta inv\xE1lida:", JSON.stringify(data));
    throw new Error("[Ollama Rewrite] Resposta inv\xE1lida \u2014 campo 'message.content' ausente ou inv\xE1lido");
  }
  return data.message.content.trim();
}
async function streamRespostaOllama(mensagens, res, fontes) {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const mensagensSeguras = podarHistorico(mensagens);
  res.write(`data: ${JSON.stringify({ type: "fontes", fontes })}

`);
  const ollamaResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: mensagensSeguras,
      stream: true,
      keep_alive: "24h",
      options: { num_ctx: NUM_CTX }
    })
  });
  if (!ollamaResponse.ok) {
    const errorText = await ollamaResponse.text();
    throw new Error(`[Ollama LLM Stream] Erro ${ollamaResponse.status}: ${errorText}`);
  }
  if (!ollamaResponse.body) {
    throw new Error("[Ollama LLM Stream] Corpo da resposta vazio");
  }
  const reader = ollamaResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gerouTokens = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
          continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (chunk.error) {
            console.error("\u274C [Ollama LLM Stream] Erro retornado no chunk:", chunk.error);
          }
          if (chunk.message?.content) {
            gerouTokens = true;
            res.write(`data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`);
          }
          if (chunk.done) {
            console.log("\u{1F916} [Stream] Gera\xE7\xE3o conclu\xEDda pelo Ollama");
          }
        } catch {
        }
      }
    }
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim());
        if (chunk.message?.content) {
          gerouTokens = true;
          res.write(`data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`);
        }
      } catch {
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (!gerouTokens) {
    console.warn("\u26A0\uFE0F [Ollama] Resposta vazia no streaming. Enviando fallback.");
    const fallbackMsg = "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do curso ou acessar o portal do IFMG.";
    res.write(
      `data: ${JSON.stringify({ type: "token", content: fallbackMsg })}

`
    );
  }
  res.write(`data: [DONE]

`);
}

// src/services/memory.service.ts
var SESSION_TTL_MS = 5 * 60 * 1e3;
var CLEANUP_INTERVAL_MS = 30 * 1e3;
var MAX_SESSIONS = 100;
var MAX_MESSAGES_PER_SESSION = 10;
var sessions = /* @__PURE__ */ new Map();
var expiredSessions = /* @__PURE__ */ new Map();
var cleanupInterval = setInterval(() => {
  const agora = Date.now();
  let removidas = 0;
  for (const [id, ctx] of sessions) {
    if (agora - ctx.lastAccessedAt > SESSION_TTL_MS) {
      sessions.delete(id);
      expiredSessions.set(id, agora);
      removidas++;
      console.log(
        `\u{1F9F9} [Mem\xF3ria] Sess\xE3o expirada e removida: ${id.substring(0, 8)}... (${ctx.messages.length} msgs, ${Math.round((agora - ctx.createdAt) / 1e3)}s de vida)`
      );
    }
  }
  for (const [id, expiredAt] of expiredSessions) {
    if (agora - expiredAt > 10 * 60 * 1e3) {
      expiredSessions.delete(id);
    }
  }
  if (removidas > 0) {
    console.log(
      `\u{1F9F9} [Mem\xF3ria] ${removidas} sess\xE3o(\xF5es) removida(s). Ativas: ${sessions.size}`
    );
  }
}, CLEANUP_INTERVAL_MS);
cleanupInterval.unref();
function isSessionExpired(sessionId) {
  if (sessions.has(sessionId)) {
    return false;
  }
  return expiredSessions.has(sessionId);
}
function getOrCreateSession(sessionId) {
  const existente = sessions.get(sessionId);
  if (existente) {
    existente.lastAccessedAt = Date.now();
    return existente;
  }
  if (sessions.size >= MAX_SESSIONS) {
    let oldestId = "";
    let oldestTime = Infinity;
    for (const [id, ctx] of sessions) {
      if (ctx.lastAccessedAt < oldestTime) {
        oldestTime = ctx.lastAccessedAt;
        oldestId = id;
      }
    }
    if (oldestId) {
      sessions.delete(oldestId);
      console.log(
        `\u{1F9F9} [Mem\xF3ria] Sess\xE3o evicta (LRU) para liberar espa\xE7o: ${oldestId.substring(0, 8)}...`
      );
    }
  }
  const novaSessao = {
    sessionId,
    messages: [],
    entities: {
      disciplinas: [],
      periodos: [],
      temas: [],
      ultimoAssunto: ""
    },
    lastIntent: "",
    lastDocuments: [],
    createdAt: Date.now(),
    lastAccessedAt: Date.now()
  };
  sessions.set(sessionId, novaSessao);
  console.log(
    `\u{1F9E0} [Mem\xF3ria] Nova sess\xE3o criada: ${sessionId.substring(0, 8)}... (total ativas: ${sessions.size})`
  );
  return novaSessao;
}
function updateSession(sessionId, pergunta, intent, resposta) {
  const session = sessions.get(sessionId);
  if (!session)
    return;
  session.messages.push({
    role: "user",
    content: pergunta,
    timestamp: Date.now()
  });
  if (resposta) {
    session.messages.push({
      role: "assistant",
      content: resposta,
      timestamp: Date.now()
    });
  }
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
    session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
  }
  session.lastIntent = intent;
  extrairEntidades(pergunta, session.entities);
  session.lastAccessedAt = Date.now();
}
function resolverReferencias(pergunta, session) {
  const { entities, messages } = session;
  if (messages.length === 0)
    return pergunta;
  let perguntaResolvida = pergunta;
  if (entities.disciplinas.length > 0) {
    const ultimaDisciplina = entities.disciplinas[entities.disciplinas.length - 1];
    perguntaResolvida = perguntaResolvida.replace(
      /\b(d?essa|nessa|desta|dela)\b/gi,
      `de ${ultimaDisciplina}`
    );
  }
  if (entities.periodos.length > 0) {
    const ultimoPeriodo = entities.periodos[entities.periodos.length - 1];
    perguntaResolvida = perguntaResolvida.replace(
      /\b(d?esse|nesse|deste|dele)\b/gi,
      `do ${ultimoPeriodo}\xBA per\xEDodo`
    );
  } else if (entities.ultimoAssunto) {
    perguntaResolvida = perguntaResolvida.replace(
      /\b(d?esse|nesse|deste|dele)\b/gi,
      `de ${entities.ultimoAssunto}`
    );
  }
  if (/^(e\s|e\s+sobre\s|também\s)/i.test(perguntaResolvida) && entities.ultimoAssunto) {
    perguntaResolvida = `${perguntaResolvida} (contexto: ${entities.ultimoAssunto})`;
  }
  if (perguntaResolvida !== pergunta) {
    console.log(
      `\u{1F517} [Mem\xF3ria] Pronomes resolvidos:
   Original:  "${pergunta}"
   Resolvida: "${perguntaResolvida}"`
    );
  }
  return perguntaResolvida;
}
function getSessionStats() {
  let totalMessages = 0;
  for (const session of sessions.values()) {
    totalMessages += session.messages.length;
  }
  return {
    active: sessions.size,
    maxSessions: MAX_SESSIONS,
    ttlMinutes: SESSION_TTL_MS / 6e4,
    memoryEstimateKB: Math.round((totalMessages * 100 + sessions.size * 500) / 1024)
  };
}
function limparTodasSessoes() {
  const total = sessions.size;
  sessions.clear();
  expiredSessions.clear();
  console.log(`\u{1F9F9} [Mem\xF3ria] Todas as ${total} sess\xE3o(\xF5es) removidas (shutdown).`);
}
function extrairEntidades(texto, entities) {
  const textoLower = texto.toLowerCase();
  const periodoNumerico = texto.match(/(\d+)[ºª°]?\s*per[ií]odo/i);
  if (periodoNumerico) {
    const num = Number(periodoNumerico[1]);
    if (!entities.periodos.includes(num)) {
      entities.periodos.push(num);
    }
  }
  const periodosExtenso = {
    primeiro: 1,
    segundo: 2,
    terceiro: 3,
    quarto: 4,
    quinto: 5,
    sexto: 6,
    s\u00E9timo: 7,
    oitavo: 8,
    nono: 9,
    d\u00E9cimo: 10
  };
  for (const [nome, num] of Object.entries(periodosExtenso)) {
    if (textoLower.includes(`${nome} per\xEDodo`) && !entities.periodos.includes(num)) {
      entities.periodos.push(num);
    }
  }
  const disciplinas = [
    "C\xE1lculo",
    "C\xE1lculo 1",
    "C\xE1lculo 2",
    "C\xE1lculo 3",
    "\xC1lgebra Linear",
    "Geometria Anal\xEDtica",
    "Algoritmos",
    "Algoritmos e Programa\xE7\xE3o",
    "Estrutura de Dados",
    "Estruturas de Dados",
    "Banco de Dados",
    "Bancos de Dados",
    "Engenharia de Software",
    "Sistemas Operacionais",
    "Redes de Computadores",
    "Intelig\xEAncia Artificial",
    "Compiladores",
    "Programa\xE7\xE3o Orientada a Objetos",
    "Arquitetura de Computadores",
    "Matem\xE1tica Discreta",
    "Probabilidade e Estat\xEDstica",
    "F\xEDsica",
    "F\xEDsica 1",
    "F\xEDsica 2",
    "L\xF3gica",
    "Teoria da Computa\xE7\xE3o",
    "Intera\xE7\xE3o Humano-Computador",
    "Trabalho de Conclus\xE3o de Curso",
    "TCC",
    "Est\xE1gio Supervisionado",
    "Projeto Integrador"
  ];
  for (const disciplina of disciplinas) {
    if (textoLower.includes(disciplina.toLowerCase())) {
      if (!entities.disciplinas.includes(disciplina)) {
        entities.disciplinas.push(disciplina);
      }
    }
  }
  const temas = {
    "pr\xE9-requisito": "pr\xE9-requisitos",
    "prerequisito": "pr\xE9-requisitos",
    "carga hor\xE1ria": "carga hor\xE1ria",
    "ementa": "ementa",
    "matr\xEDcula": "matr\xEDcula",
    "trancamento": "trancamento",
    "reprova\xE7\xE3o": "reprova\xE7\xE3o",
    "reprovar": "reprova\xE7\xE3o",
    "aprova\xE7\xE3o": "aprova\xE7\xE3o",
    "aprovar": "aprova\xE7\xE3o",
    "frequ\xEAncia": "frequ\xEAncia",
    "falta": "frequ\xEAncia",
    "est\xE1gio": "est\xE1gio",
    "atividades complementares": "atividades complementares",
    "horas complementares": "atividades complementares",
    "bolsa": "bolsas",
    "aux\xEDlio": "assist\xEAncia estudantil",
    "biblioteca": "biblioteca",
    "laborat\xF3rio": "laborat\xF3rio",
    "disciplina": "disciplinas",
    "grade curricular": "grade curricular",
    "matriz curricular": "grade curricular"
  };
  for (const [termo, tema] of Object.entries(temas)) {
    if (textoLower.includes(termo) && !entities.temas.includes(tema)) {
      entities.temas.push(tema);
    }
  }
  if (entities.disciplinas.length > 0) {
    entities.ultimoAssunto = entities.disciplinas[entities.disciplinas.length - 1];
  } else if (entities.periodos.length > 0) {
    entities.ultimoAssunto = `${entities.periodos[entities.periodos.length - 1]}\xBA per\xEDodo`;
  } else if (entities.temas.length > 0) {
    entities.ultimoAssunto = entities.temas[entities.temas.length - 1];
  }
}

// src/services/fast_path.util.ts
function detectGreetingBypass(question) {
  const cleanedQuestion = question.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, "");
  const strictGreetings = [
    "ola",
    "oi",
    "bom dia",
    "boa tarde",
    "boa noite",
    "ola ola",
    "oi oi",
    "eae",
    "e ai",
    "hello",
    "hi",
    "hey",
    "ola assistente"
  ];
  if (strictGreetings.includes(cleanedQuestion)) {
    return true;
  }
  const functionalityPatterns = [
    /como (voce )?pode me ajudar/i,
    /qual (e )?sua funcao/i,
    /o que (voce )?pode fazer/i,
    /o que (voce )?faz/i,
    /quem e voce/i,
    /quais (sao suas )?capacidades/i,
    /me ajude/i,
    /^ajuda$/i,
    /^help$/i,
    /como funciona/i
  ];
  for (const regex2 of functionalityPatterns) {
    if (regex2.test(cleanedQuestion)) {
      return true;
    }
  }
  return false;
}
var STATIC_GREETING_RESPONSE = `Ol\xE1! Seja muito bem-vindo(a)! \u{1F44B}

Sou o assistente virtual oficial do IFMG Campus Ouro Branco. Estou aqui para ajudar voc\xEA com informa\xE7\xF5es acad\xEAmicas, incluindo regulamentos do curso, o Projeto Pedag\xF3gico do Curso (PPC), a grade curricular e as normas do campus.

Voc\xEA pode fazer perguntas sobre esses t\xF3picos! Estou \xE0 sua disposi\xE7\xE3o. \u{1F60A}`;
async function streamStaticGreeting(res) {
  res.write(`data: ${JSON.stringify({ type: "fontes", fontes: [] })}

`);
  const words = STATIC_GREETING_RESPONSE.split(/(\s+)/);
  const groupSize = 4;
  for (let i = 0; i < words.length; i += groupSize) {
    const chunk = words.slice(i, i + groupSize).join("");
    res.write(`data: ${JSON.stringify({ type: "token", content: chunk })}

`);
    await new Promise((resolve3) => setTimeout(resolve3, 15));
  }
  res.write(`data: [DONE]

`);
}

// src/services/rag.service.ts
var REWRITE_SYSTEM_PROMPT = `Voc\xEA \xE9 um assistente de pr\xE9-processamento de consultas para um sistema de busca de documentos acad\xEAmicos do IFMG (Instituto Federal de Minas Gerais), Campus Ouro Branco.

Sua tarefa: reescrever a pergunta do usu\xE1rio para melhorar a busca sem\xE2ntica em documentos acad\xEAmicos.

REGRAS:
1. Classifique a inten\xE7\xE3o da pergunta e inicie a resposta com uma Tag de Inten\xE7\xE3o:
   - [CURSO]: D\xFAvidas sobre o projeto pedag\xF3gico, regras gerais, est\xE1gios, TCC.
   - [DISCIPLINA]: D\xFAvidas sobre nomes de mat\xE9rias, c\xF3digos, carga hor\xE1ria, pr\xE9-requisitos.
   - [CONTEUDO]: D\xFAvidas espec\xEDficas sobre a ementa ou t\xF3picos ensinados dentro de uma disciplina.
   - [GREETING]: Cumprimentos, sauda\xE7\xF5es gerais (ex: "Ol\xE1", "bom dia") ou perguntas gerais sobre quem \xE9 o assistente/o que ele faz.
   - [OUTRAS]: D\xFAvidas administrativas, infraestrutura do campus, portarias, calend\xE1rio.
2. Expanda TODAS as siglas acad\xEAmicas:
   - TCC \u2192 Trabalho de Conclus\xE3o de Curso
   - PPC \u2192 Projeto Pedag\xF3gico do Curso
   - CR \u2192 Coeficiente de Rendimento
   - ENADE \u2192 Exame Nacional de Desempenho de Estudantes
   - TI \u2192 Tecnologia da Informa\xE7\xE3o
   - SI \u2192 Sistemas de Informa\xE7\xE3o
   - IFMG \u2192 Instituto Federal de Minas Gerais
   - NDE \u2192 N\xFAcleo Docente Estruturante
   - CEAD \u2192 Centro de Educa\xE7\xE3o Aberta e a Dist\xE2ncia
   - IRA \u2192 \xCDndice de Rendimento Acad\xEAmico
   - AC \u2192 Atividades Complementares
   - DP \u2192 Depend\xEAncia (disciplina em depend\xEAncia)
3. Transforme linguagem coloquial em linguagem formal/acad\xEAmica.
4. Adicione contexto impl\xEDcito quando cab\xEDvel (ex: "reprovar" \u2192 "crit\xE9rios de reprova\xE7\xE3o").
5. Mantenha o sentido original da pergunta.
6. Responda APENAS com a Tag de Inten\xE7\xE3o seguida da pergunta reescrita, sem aspas. Exemplo: "[DISCIPLINA] qual \xE9 a carga hor\xE1ria de c\xE1lculo 1?"`;
async function reescreverPergunta(pergunta) {
  try {
    console.log(`\u270D\uFE0F  [Reescrita] Original: "${pergunta}"`);
    const reescrita = await reescreverComLLM(REWRITE_SYSTEM_PROMPT, pergunta);
    if (!reescrita || reescrita.length > 1e3) {
      console.log(`\u270D\uFE0F  [Reescrita] Resultado inv\xE1lido, usando original.`);
      return { intencao: "OUTRAS", perguntaReescrita: pergunta };
    }
    const match = reescrita.trim().match(/^\[(.*?)\]\s*(.*)/);
    if (match) {
      const intencao = match[1].toUpperCase();
      const perguntaReescrita = match[2];
      console.log(`\u270D\uFE0F  [Reescrita] Inten\xE7\xE3o: [${intencao}] | Reescrita: "${perguntaReescrita}"`);
      return { intencao, perguntaReescrita };
    }
    console.log(`\u270D\uFE0F  [Reescrita] Resultado sem tag: "${reescrita}"`);
    return { intencao: "OUTRAS", perguntaReescrita: reescrita };
  } catch (error) {
    console.warn(
      `\u26A0\uFE0F  [Reescrita] Falha na reescrita, usando pergunta original:`,
      error instanceof Error ? error.message : error
    );
    return { intencao: "OUTRAS", perguntaReescrita: pergunta };
  }
}
async function gerarEmbedding(texto) {
  console.log(`\u{1F522} [RAG] Vetorizando pergunta: "${texto.substring(0, 60)}..."`);
  const embedding = await gerarEmbeddingOllama(texto);
  console.log(
    `\u{1F522} [RAG] Embedding gerado com sucesso (${embedding.length} dimens\xF5es)`
  );
  return embedding;
}
var RRF_K = 60;
var RRF_ALPHA = 0.5;
async function buscarHibrido(embedding, queryTexto, limite = 5) {
  console.log(
    `\u{1F50D} [RAG] Busca h\xEDbrida: vetorial (\u03B1=${RRF_ALPHA}) + FTS (1-\u03B1=${1 - RRF_ALPHA}), k=${RRF_K}`
  );
  const vectorStr = `[${embedding.join(",")}]`;
  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           1 - (embedding <=> $1::vector) AS similaridade,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 20
       ),
       lexical AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) AS ts_score,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) DESC
           ) AS rank
         FROM documents
         WHERE content_tsv @@ plainto_tsquery('portuguese_unaccent', $2)
         ORDER BY ts_score DESC
         LIMIT 20
       )
     SELECT
       COALESCE(s.id, l.id) AS id,
       COALESCE(s.conteudo, l.conteudo) AS conteudo,
       COALESCE(s.origem, l.origem) AS origem,
       COALESCE(s.similaridade, 0) AS similaridade,
       (
         ${RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + s.rank), 0.0) +
         ${1 - RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + l.rank), 0.0)
       ) AS rrf_score
     FROM semantic s
     FULL OUTER JOIN lexical l ON s.id = l.id
     ORDER BY rrf_score DESC
     LIMIT $3`,
    [vectorStr, queryTexto, limite]
  );
  const documentos = result.rows.map((row) => ({
    conteudo: row.conteudo,
    origem: row.origem || "documento desconhecido",
    similaridade: Number(row.rrf_score)
  }));
  if (documentos.length === 0) {
    console.log(`\u{1F50D} [RAG] Nenhum documento encontrado (vetorial + FTS).`);
  } else {
    console.log(`\u{1F50D} [RAG] ${documentos.length} documentos (RRF h\xEDbrido):`);
    documentos.forEach((doc, i) => {
      console.log(
        `   ${i + 1}. [RRF: ${doc.similaridade.toFixed(4)}] ${doc.origem}: "${doc.conteudo.substring(0, 50)}..."`
      );
    });
  }
  return documentos;
}
function montarMensagensRAG(pergunta, documentos, intencao) {
  const contexto = documentos.length > 0 ? documentos.map(
    (doc, i) => `--- Trecho ${i + 1} (fonte: ${doc.origem}, similaridade: ${doc.similaridade.toFixed(2)}) ---
${doc.conteudo}`
  ).join("\n\n") : "Nenhum documento relevante foi encontrado na base de conhecimento.";
  const systemPrompt = `Voc\xEA \xE9 o assistente virtual oficial do IFMG Campus Ouro Branco.

Sua fun\xE7\xE3o \xE9 responder d\xFAvidas dos alunos sobre regulamentos, PPC (Projeto Pedag\xF3gico do Curso), grade curricular, normas acad\xEAmicas e informa\xE7\xF5es do campus.

INTEN\xC7\xC3O DA PERGUNTA: [${intencao}] (Foque a sua resposta no contexto dessa inten\xE7\xE3o).

CONTEXTO (trechos dos documentos oficiais do curso):
${contexto}

REGRAS OBRIGAT\xD3RIAS (siga rigorosamente):
1. Use EXCLUSIVAMENTE as informa\xE7\xF5es do CONTEXTO acima.
2. N\xC3O invente, suponha ou complemente com conhecimento externo.
3. Se a resposta n\xE3o estiver nos trechos, diga: "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do curso ou acessar o portal do IFMG."
4. Cite a fonte (nome do documento) quando poss\xEDvel.

DIRETIVAS OBRIGAT\xD3RIAS DE IDIOMA E FORMATA\xC7\xC3O:
- REGRA ABSOLUTA: Voc\xEA deve responder EXCLUSIVAMENTE em Portugu\xEAs do Brasil (pt-BR). Traduza qualquer termo do contexto que esteja em ingl\xEAs. \xC9 proibido responder em ingl\xEAs ou qualquer outro idioma.
- Seja DIRETO E CONCISO. N\xE3o copie longos trechos de texto (como ementas completas ou bibliografias) a menos que o usu\xE1rio tenha solicitado especificamente.
- Se a inten\xE7\xE3o for [DISCIPLINA] e o usu\xE1rio pedir uma lista de disciplinas de um per\xEDodo, cite APENAS os nomes das disciplinas e seus c\xF3digos.
- Mantenha a formata\xE7\xE3o simples. Use listas ('* ') com UM \xDANICO N\xCDVEL de aninhamento. NUNCA coloque listas dentro de listas.
- Use **negrito** para destacar nomes de disciplinas, c\xF3digos ou termos chaves.
- Finalize com uma pergunta breve e proativa (Ex: "Gostaria que eu detalhasse a ementa de alguma dessas disciplinas?").`;
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: pergunta }
  ];
}
async function processarPerguntaStream(pergunta, res, sessionId) {
  const dataHora = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
  console.log(`
${"\u2500".repeat(50)}`);
  console.log(`\u{1F4E8} [RAG] Nova pergunta (stream): "${pergunta}"`);
  console.log(`\u{1F4C5} [RAG] Data/Hora: ${dataHora}`);
  if (sessionId)
    console.log(`\u{1F9E0} [RAG] Sess\xE3o: ${sessionId.substring(0, 8)}...`);
  console.log(`${"\u2500".repeat(50)}`);
  if (sessionId && isSessionExpired(sessionId)) {
    console.log(`\u23F0 [RAG] Sess\xE3o expirada: ${sessionId.substring(0, 8)}...`);
    res.write(`data: ${JSON.stringify({ type: "session_expired" })}

`);
    res.write(`data: [DONE]

`);
    return;
  }
  const session = sessionId ? getOrCreateSession(sessionId) : null;
  const perguntaContextualizada = session ? resolverReferencias(pergunta, session) : pergunta;
  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando pergunta..." })}

`);
  const inicio = Date.now();
  if (detectGreetingBypass(perguntaContextualizada)) {
    console.log(`\u{1F680} [RAG] Fast-path ativado: sauda\xE7\xE3o detectada localmente.`);
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}

`);
    const t32 = Date.now();
    await streamStaticGreeting(res);
    const generationMs2 = Date.now() - t32;
    const totalMs2 = Date.now() - inicio;
    res.write(`data: ${JSON.stringify({ type: "metrics", timings: { rewrite: 0, embedding: 0, retrieval: 0, generation: generationMs2, total: totalMs2 } })}

`);
    if (session) {
      updateSession(session.sessionId, pergunta, "GREETING", STATIC_GREETING_RESPONSE);
    }
    console.log(`\u23F1\uFE0F  [RAG] Fast-path conclu\xEDdo em ${(totalMs2 / 1e3).toFixed(1)}s (sem busca)
`);
    return;
  }
  const t0 = Date.now();
  const { intencao, perguntaReescrita } = await reescreverPergunta(perguntaContextualizada);
  const rewriteMs = Date.now() - t0;
  if (intencao === "GREETING") {
    console.log(`\u{1F680} [RAG] Fast-path ativado: reescrevedor classificou como GREETING.`);
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}

`);
    const t32 = Date.now();
    await streamStaticGreeting(res);
    const generationMs2 = Date.now() - t32;
    const totalMs2 = Date.now() - inicio;
    res.write(`data: ${JSON.stringify({ type: "metrics", timings: { rewrite: rewriteMs, embedding: 0, retrieval: 0, generation: generationMs2, total: totalMs2 } })}

`);
    if (session) {
      updateSession(session.sessionId, pergunta, "GREETING", STATIC_GREETING_RESPONSE);
    }
    console.log(`\u23F1\uFE0F  [RAG] Fast-path LLM conclu\xEDdo em ${(totalMs2 / 1e3).toFixed(1)}s (sem busca)
`);
    return;
  }
  res.write(`data: ${JSON.stringify({ type: "status", status: "Buscando nos documentos..." })}

`);
  const t1 = Date.now();
  const embedding = await gerarEmbedding(perguntaReescrita);
  const embedMs = Date.now() - t1;
  const t2 = Date.now();
  const documentos = await buscarHibrido(embedding, perguntaReescrita);
  const retrievalMs = Date.now() - t2;
  const fontes = documentos.map(
    (doc) => `${doc.origem} (similaridade: ${doc.similaridade.toFixed(2)})`
  );
  const mensagens = montarMensagensRAG(pergunta, documentos, intencao);
  console.log(
    `\u{1F916} [RAG] Iniciando streaming com ${documentos.length} documentos de contexto...`
  );
  const t3 = Date.now();
  await streamRespostaOllama(mensagens, res, fontes);
  const generationMs = Date.now() - t3;
  const totalMs = Date.now() - inicio;
  const timings = {
    rewrite: rewriteMs,
    embedding: embedMs,
    retrieval: retrievalMs,
    generation: generationMs,
    total: totalMs
  };
  res.write(`data: ${JSON.stringify({ type: "metrics", timings })}

`);
  if (session) {
    updateSession(session.sessionId, pergunta, intencao, "");
    session.lastDocuments = documentos;
  }
  console.log(
    `\u23F1\uFE0F  [RAG] Pipeline conclu\xEDdo em ${(totalMs / 1e3).toFixed(1)}s (rewrite: ${rewriteMs}ms, embed: ${embedMs}ms, retrieval: ${retrievalMs}ms, gen: ${generationMs}ms)
`
  );
}

// src/services/queue.service.ts
var MAX_CONCURRENT = Number(process.env.OLLAMA_MAX_CONCURRENT) || 2;
var QUEUE_TIMEOUT_MS = 12e4;
var OllamaSemaphore = class {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
  }
  currentCount = 0;
  waitQueue = [];
  /**
   * Aguarda até que um slot esteja disponível.
   * @throws Error se o timeout for atingido
   */
  async acquire() {
    if (this.currentCount < this.maxConcurrent) {
      this.currentCount++;
      return;
    }
    return new Promise((resolve3, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waitQueue.findIndex((w) => w.resolve === resolve3);
        if (idx !== -1)
          this.waitQueue.splice(idx, 1);
        reject(new Error("Tempo de espera na fila esgotado. Tente novamente."));
      }, QUEUE_TIMEOUT_MS);
      this.waitQueue.push({ resolve: resolve3, timer });
    });
  }
  /** Libera um slot, desbloqueando o próximo request na fila. */
  release() {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      clearTimeout(next.timer);
      next.resolve();
    } else {
      this.currentCount = Math.max(0, this.currentCount - 1);
    }
  }
  /** Retorna métricas da fila para observabilidade. */
  getStatus() {
    return {
      active: this.currentCount,
      waiting: this.waitQueue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
};
var ollamaSemaphore = new OllamaSemaphore(MAX_CONCURRENT);
async function comControleDeConcorrencia(fn) {
  await ollamaSemaphore.acquire();
  try {
    return await fn();
  } finally {
    ollamaSemaphore.release();
  }
}

// src/controllers/chat.controller.ts
async function enviarPergunta(req, res) {
  try {
    const { pergunta, sessionId } = req.body;
    if (!pergunta || typeof pergunta !== "string") {
      res.status(400).json({
        erro: "O campo 'pergunta' \xE9 obrigat\xF3rio e deve ser uma string."
      });
      return;
    }
    const perguntaTrimmed = pergunta.trim();
    if (perguntaTrimmed.length < 3) {
      res.status(400).json({
        erro: "A pergunta deve ter pelo menos 3 caracteres."
      });
      return;
    }
    if (perguntaTrimmed.length > 1e3) {
      res.status(400).json({
        erro: "A pergunta deve ter no m\xE1ximo 1000 caracteres."
      });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
      // Desabilita buffering em proxies nginx
    });
    req.on("close", () => {
      console.log("\u{1F50C} [SSE] Cliente desconectou durante o stream");
    });
    await comControleDeConcorrencia(async () => {
      await processarPerguntaStream(perguntaTrimmed, res, sessionId);
    });
    res.end();
  } catch (error) {
    console.error("[ChatController] Erro ao processar pergunta:", error);
    if (res.headersSent) {
      const mensagemErro = error instanceof Error && error.message.includes("Ollama") ? "O servidor de IA ficou inacess\xEDvel durante a gera\xE7\xE3o. Tente novamente." : "Ocorreu um erro durante a gera\xE7\xE3o da resposta.";
      res.write(
        `data: ${JSON.stringify({ type: "erro", mensagem: mensagemErro })}

`
      );
      res.end();
    } else {
      res.status(500).json({
        erro: "Ocorreu um erro interno ao processar sua pergunta. Tente novamente mais tarde."
      });
    }
  }
}
async function registerFeedback(req, res) {
  try {
    const { sessionId, messageId, feedback, question, response } = req.body;
    if (!feedback || feedback !== "up" && feedback !== "down") {
      res.status(400).json({
        erro: "O campo 'feedback' \xE9 obrigat\xF3rio e deve ser 'up' ou 'down'."
      });
      return;
    }
    console.log(`
\u{1F4E2} [FEEDBACK RECEBIDO]`);
    console.log(`   Sess\xE3o: ${sessionId || "N/A"}`);
    console.log(`   ID Mensagem: ${messageId || "N/A"}`);
    console.log(`   Voto: ${feedback === "up" ? "\u{1F44D} \xDAtil" : "\u{1F44E} N\xE3o \xDAtil"}`);
    if (question)
      console.log(`   Pergunta: "${question}"`);
    if (response)
      console.log(`   Resposta: "${response.substring(0, 150)}..."`);
    console.log(`${"\u2500".repeat(40)}`);
    res.status(200).json({ sucesso: true });
  } catch (error) {
    console.error("[ChatController] Erro ao registrar feedback:", error);
    res.status(500).json({
      erro: "Ocorreu um erro interno ao registrar o feedback."
    });
  }
}

// src/routes/chat.routes.ts
var chatRouter = Router();
chatRouter.post("/", enviarPergunta);
chatRouter.post("/feedback", registerFeedback);

// src/routes/embedding.routes.ts
import { Router as Router2 } from "express";
import multer from "multer";

// src/services/embedding.service.ts
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import xlsx from "xlsx";

// ../../node_modules/@langchain/core/dist/_virtual/_rolldown/runtime.js
var __defProp2 = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
  let target = {};
  for (var name in all)
    __defProp2(target, name, {
      get: all[name],
      enumerable: true
    });
  if (!no_symbols)
    __defProp2(target, Symbol.toStringTag, { value: "Module" });
  return target;
};

// ../../node_modules/@langchain/core/dist/documents/document.js
var Document = class {
  pageContent;
  metadata;
  /**
  * An optional identifier for the document.
  *
  * Ideally this should be unique across the document collection and formatted
  * as a UUID, but this will not be enforced.
  */
  id;
  constructor(fields) {
    this.pageContent = fields.pageContent !== void 0 ? fields.pageContent.toString() : "";
    this.metadata = fields.metadata ?? {};
    this.id = fields.id;
  }
};

// ../../node_modules/@langchain/core/dist/tools/utils.js
function _isToolCall(toolCall) {
  return !!(toolCall && typeof toolCall === "object" && "type" in toolCall && toolCall.type === "tool_call");
}
var ToolInputParsingException = class extends Error {
  output;
  constructor(message, output) {
    super(message);
    this.output = output;
  }
};

// ../../node_modules/@langchain/core/dist/load/map_keys.js
var UPPER_TO_WORD_BOUNDARY = /([A-Z]+)([A-Z][a-z0-9]+)/g;
var LOWER_TO_UPPER_BOUNDARY = /([a-z0-9])([A-Z])/g;
var SEPARATORS = /[-_\s]+/g;
function snakeCase(key) {
  return key.replace(UPPER_TO_WORD_BOUNDARY, "$1_$2").replace(LOWER_TO_UPPER_BOUNDARY, "$1_$2").replace(SEPARATORS, "_").toLowerCase();
}
function keyToJson(key, map) {
  return map?.[key] || snakeCase(key);
}
function mapKeys(fields, mapper, map) {
  const mapped = {};
  for (const key in fields)
    if (Object.hasOwn(fields, key))
      mapped[mapper(key, map)] = fields[key];
  return mapped;
}

// ../../node_modules/@langchain/core/dist/load/validation.js
var LC_ESCAPED_KEY = "__lc_escaped__";
function needsEscaping(obj) {
  return "lc" in obj || Object.keys(obj).length === 1 && "__lc_escaped__" in obj;
}
function escapeObject(obj) {
  return { [LC_ESCAPED_KEY]: obj };
}
function isSerializableLike(obj) {
  return obj !== null && typeof obj === "object" && "lc_serializable" in obj && typeof obj.toJSON === "function";
}
function createNotImplemented(obj) {
  let id;
  if (obj !== null && typeof obj === "object")
    if ("lc_id" in obj && Array.isArray(obj.lc_id))
      id = obj.lc_id;
    else
      id = [obj.constructor?.name ?? "Object"];
  else
    id = [typeof obj];
  return {
    lc: 1,
    type: "not_implemented",
    id
  };
}
function escapeIfNeeded(value, pathSet = /* @__PURE__ */ new WeakSet()) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if (pathSet.has(value))
      return createNotImplemented(value);
    if (isSerializableLike(value))
      return value;
    pathSet.add(value);
    const record = value;
    if (needsEscaping(record)) {
      pathSet.delete(value);
      return escapeObject(record);
    }
    const result = {};
    for (const [key, val] of Object.entries(record))
      result[key] = escapeIfNeeded(val, pathSet);
    pathSet.delete(value);
    return result;
  }
  if (Array.isArray(value))
    return value.map((item) => escapeIfNeeded(item, pathSet));
  return value;
}

// ../../node_modules/@langchain/core/dist/load/serializable.js
function shallowCopy(obj) {
  return Array.isArray(obj) ? [...obj] : { ...obj };
}
function replaceSecrets(root, secretsMap) {
  const result = shallowCopy(root);
  for (const [path3, secretId] of Object.entries(secretsMap)) {
    const [last, ...partsReverse] = path3.split(".").reverse();
    let current = result;
    for (const part of partsReverse.reverse()) {
      if (current[part] === void 0)
        break;
      current[part] = shallowCopy(current[part]);
      current = current[part];
    }
    if (current[last] !== void 0)
      current[last] = {
        lc: 1,
        type: "secret",
        id: [secretId]
      };
  }
  return result;
}
function get_lc_unique_name(serializableClass) {
  const parentClass = Object.getPrototypeOf(serializableClass);
  if (typeof serializableClass.lc_name === "function" && (typeof parentClass.lc_name !== "function" || serializableClass.lc_name() !== parentClass.lc_name()))
    return serializableClass.lc_name();
  else
    return serializableClass.name;
}
var Serializable = class Serializable2 {
  lc_serializable = false;
  lc_kwargs;
  /**
  * The name of the serializable. Override to provide an alias or
  * to preserve the serialized module name in minified environments.
  *
  * Implemented as a static method to support loading logic.
  */
  static lc_name() {
    return this.name;
  }
  /**
  * The final serialized identifier for the module.
  */
  get lc_id() {
    return [...this.lc_namespace, get_lc_unique_name(this.constructor)];
  }
  /**
  * A map of secrets, which will be omitted from serialization.
  * Keys are paths to the secret in constructor args, e.g. "foo.bar.baz".
  * Values are the secret ids, which will be used when deserializing.
  */
  get lc_secrets() {
  }
  /**
  * A map of additional attributes to merge with constructor args.
  * Keys are the attribute names, e.g. "foo".
  * Values are the attribute values, which will be serialized.
  * These attributes need to be accepted by the constructor as arguments.
  */
  get lc_attributes() {
  }
  /**
  * A map of aliases for constructor args.
  * Keys are the attribute names, e.g. "foo".
  * Values are the alias that will replace the key in serialization.
  * This is used to eg. make argument names match Python.
  */
  get lc_aliases() {
  }
  /**
  * A manual list of keys that should be serialized.
  * If not overridden, all fields passed into the constructor will be serialized.
  */
  get lc_serializable_keys() {
  }
  constructor(kwargs, ..._args) {
    if (this.lc_serializable_keys !== void 0)
      this.lc_kwargs = Object.fromEntries(Object.entries(kwargs || {}).filter(([key]) => this.lc_serializable_keys?.includes(key)));
    else
      this.lc_kwargs = kwargs ?? {};
  }
  toJSON() {
    if (!this.lc_serializable)
      return this.toJSONNotImplemented();
    if (this.lc_kwargs instanceof Serializable2 || typeof this.lc_kwargs !== "object" || Array.isArray(this.lc_kwargs))
      return this.toJSONNotImplemented();
    const aliases = {};
    const secrets = {};
    const kwargs = Object.keys(this.lc_kwargs).reduce((acc, key) => {
      acc[key] = key in this ? this[key] : this.lc_kwargs[key];
      return acc;
    }, {});
    for (let current = Object.getPrototypeOf(this); current; current = Object.getPrototypeOf(current)) {
      Object.assign(aliases, Reflect.get(current, "lc_aliases", this));
      Object.assign(secrets, Reflect.get(current, "lc_secrets", this));
      Object.assign(kwargs, Reflect.get(current, "lc_attributes", this));
    }
    Object.keys(secrets).forEach((keyPath) => {
      let read = this;
      let write = kwargs;
      const [last, ...partsReverse] = keyPath.split(".").reverse();
      for (const key of partsReverse.reverse()) {
        if (!(key in read) || read[key] === void 0)
          return;
        if (!(key in write) || write[key] === void 0) {
          if (typeof read[key] === "object" && read[key] != null)
            write[key] = {};
          else if (Array.isArray(read[key]))
            write[key] = [];
        }
        read = read[key];
        write = write[key];
      }
      if (last in read && read[last] !== void 0)
        write[last] = write[last] || read[last];
    });
    const escapedKwargs = {};
    const pathSet = /* @__PURE__ */ new WeakSet();
    pathSet.add(this);
    for (const [key, value] of Object.entries(kwargs))
      escapedKwargs[key] = escapeIfNeeded(value, pathSet);
    const processedKwargs = mapKeys(Object.keys(secrets).length ? replaceSecrets(escapedKwargs, secrets) : escapedKwargs, keyToJson, aliases);
    return {
      lc: 1,
      type: "constructor",
      id: this.lc_id,
      kwargs: processedKwargs
    };
  }
  toJSONNotImplemented() {
    return {
      lc: 1,
      type: "not_implemented",
      id: this.lc_id
    };
  }
};

// ../../node_modules/@langchain/core/dist/utils/uuid/regex.js
var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

// ../../node_modules/@langchain/core/dist/utils/uuid/validate.js
function validate(uuid2) {
  return typeof uuid2 === "string" && regex_default.test(uuid2);
}

// ../../node_modules/@langchain/core/dist/utils/uuid/parse.js
function parse(uuid2) {
  if (!validate(uuid2))
    throw TypeError("Invalid UUID");
  let v;
  return Uint8Array.of((v = parseInt(uuid2.slice(0, 8), 16)) >>> 24, v >>> 16 & 255, v >>> 8 & 255, v & 255, (v = parseInt(uuid2.slice(9, 13), 16)) >>> 8, v & 255, (v = parseInt(uuid2.slice(14, 18), 16)) >>> 8, v & 255, (v = parseInt(uuid2.slice(19, 23), 16)) >>> 8, v & 255, (v = parseInt(uuid2.slice(24, 36), 16)) / 1099511627776 & 255, v / 4294967296 & 255, v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255);
}

// ../../node_modules/@langchain/core/dist/utils/uuid/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i)
  byteToHex.push((i + 256).toString(16).slice(1));
function unsafeStringify(arr2, offset = 0) {
  return (byteToHex[arr2[offset + 0]] + byteToHex[arr2[offset + 1]] + byteToHex[arr2[offset + 2]] + byteToHex[arr2[offset + 3]] + "-" + byteToHex[arr2[offset + 4]] + byteToHex[arr2[offset + 5]] + "-" + byteToHex[arr2[offset + 6]] + byteToHex[arr2[offset + 7]] + "-" + byteToHex[arr2[offset + 8]] + byteToHex[arr2[offset + 9]] + "-" + byteToHex[arr2[offset + 10]] + byteToHex[arr2[offset + 11]] + byteToHex[arr2[offset + 12]] + byteToHex[arr2[offset + 13]] + byteToHex[arr2[offset + 14]] + byteToHex[arr2[offset + 15]]).toLowerCase();
}

// ../../node_modules/@langchain/core/dist/utils/uuid/rng.js
var rnds8 = new Uint8Array(16);
function rng() {
  return crypto.getRandomValues(rnds8);
}

// ../../node_modules/@langchain/core/dist/utils/uuid/v4.js
function v4(options, buf, offset) {
  if (!buf && !options && crypto.randomUUID)
    return crypto.randomUUID();
  return _v4(options, buf, offset);
}
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16)
    throw new Error("Random bytes length must be >= 16");
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length)
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    for (let i = 0; i < 16; ++i)
      buf[offset + i] = rnds[i];
    return buf;
  }
  return unsafeStringify(rnds);
}

// ../../node_modules/@langchain/core/dist/utils/uuid/sha1.js
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;
    case 1:
      return x ^ y ^ z;
    case 2:
      return x & y ^ x & z ^ y & z;
    case 3:
      return x ^ y ^ z;
  }
}
function ROTL(x, n2) {
  return x << n2 | x >>> 32 - n2;
}
function sha1(bytes) {
  const K = [
    1518500249,
    1859775393,
    2400959708,
    3395469782
  ];
  const H = [
    1732584193,
    4023233417,
    2562383102,
    271733878,
    3285377520
  ];
  const newBytes = new Uint8Array(bytes.length + 1);
  newBytes.set(bytes);
  newBytes[bytes.length] = 128;
  bytes = newBytes;
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);
  for (let i = 0; i < N; ++i) {
    const arr2 = new Uint32Array(16);
    for (let j = 0; j < 16; ++j)
      arr2[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    M[i] = arr2;
  }
  M[N - 1][14] = (bytes.length - 1) * 8 / 2 ** 32;
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 4294967295;
  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);
    for (let t = 0; t < 16; ++t)
      W[t] = M[i][t];
    for (let t = 16; t < 80; ++t)
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }
    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }
  return Uint8Array.of(H[0] >> 24, H[0] >> 16, H[0] >> 8, H[0], H[1] >> 24, H[1] >> 16, H[1] >> 8, H[1], H[2] >> 24, H[2] >> 16, H[2] >> 8, H[2], H[3] >> 24, H[3] >> 16, H[3] >> 8, H[3], H[4] >> 24, H[4] >> 16, H[4] >> 8, H[4]);
}

// ../../node_modules/@langchain/core/dist/utils/uuid/v35.js
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i)
    bytes[i] = str.charCodeAt(i);
  return bytes;
}
var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
var URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
function v35(version3, hash, value, namespace, buf, offset) {
  const valueBytes = typeof value === "string" ? stringToBytes(value) : value;
  const namespaceBytes = typeof namespace === "string" ? parse(namespace) : namespace;
  if (typeof namespace === "string")
    namespace = parse(namespace);
  if (namespace?.length !== 16)
    throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
  let bytes = new Uint8Array(16 + valueBytes.length);
  bytes.set(namespaceBytes);
  bytes.set(valueBytes, namespaceBytes.length);
  bytes = hash(bytes);
  bytes[6] = bytes[6] & 15 | version3;
  bytes[8] = bytes[8] & 63 | 128;
  if (buf) {
    offset ??= 0;
    if (offset < 0 || offset + 16 > buf.length)
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    for (let i = 0; i < 16; ++i)
      buf[offset + i] = bytes[i];
    return buf;
  }
  return unsafeStringify(bytes);
}

// ../../node_modules/@langchain/core/dist/utils/uuid/v5.js
function v5(value, namespace, buf, offset) {
  return v35(80, sha1, value, namespace, buf, offset);
}
v5.DNS = DNS;
v5.URL = URL2;

// ../../node_modules/@langchain/core/dist/utils/uuid/v7.js
var _state = {};
function v7(options, buf, offset) {
  let bytes;
  if (options)
    bytes = v7Bytes(options.random ?? options.rng?.() ?? rng(), options.msecs, options.seq, buf, offset);
  else {
    const now = Date.now();
    const rnds = rng();
    updateV7State(_state, now, rnds);
    bytes = v7Bytes(rnds, _state.msecs, _state.seq, buf, offset);
  }
  return buf ?? unsafeStringify(bytes);
}
function updateV7State(state, now, rnds) {
  state.msecs ??= -Infinity;
  state.seq ??= 0;
  if (now > state.msecs) {
    state.seq = rnds[6] << 23 | rnds[7] << 16 | rnds[8] << 8 | rnds[9];
    state.msecs = now;
  } else {
    state.seq = state.seq + 1 | 0;
    if (state.seq === 0)
      state.msecs++;
  }
  return state;
}
function v7Bytes(rnds, msecs, seq, buf, offset = 0) {
  if (rnds.length < 16)
    throw new Error("Random bytes length must be >= 16");
  if (!buf) {
    buf = new Uint8Array(16);
    offset = 0;
  } else if (offset < 0 || offset + 16 > buf.length)
    throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
  msecs ??= Date.now();
  seq ??= rnds[6] * 127 << 24 | rnds[7] << 16 | rnds[8] << 8 | rnds[9];
  buf[offset++] = msecs / 1099511627776 & 255;
  buf[offset++] = msecs / 4294967296 & 255;
  buf[offset++] = msecs / 16777216 & 255;
  buf[offset++] = msecs / 65536 & 255;
  buf[offset++] = msecs / 256 & 255;
  buf[offset++] = msecs & 255;
  buf[offset++] = 112 | seq >>> 28 & 15;
  buf[offset++] = seq >>> 20 & 255;
  buf[offset++] = 128 | seq >>> 14 & 63;
  buf[offset++] = seq >>> 6 & 255;
  buf[offset++] = seq << 2 & 255 | rnds[10] & 3;
  buf[offset++] = rnds[11];
  buf[offset++] = rnds[12];
  buf[offset++] = rnds[13];
  buf[offset++] = rnds[14];
  buf[offset++] = rnds[15];
  return buf;
}

// ../../node_modules/@langchain/core/dist/utils/uuid/index.js
var v42 = v4;
var v72 = v7;
var validate2 = validate;

// ../../node_modules/@langchain/core/dist/singletons/async_local_storage/globals.js
var TRACING_ALS_KEY = Symbol.for("ls:tracing_async_local_storage");
var _CONTEXT_VARIABLES_KEY = Symbol.for("lc:context_variables");
var setGlobalAsyncLocalStorageInstance = (instance) => {
  globalThis[TRACING_ALS_KEY] = instance;
};
var getGlobalAsyncLocalStorageInstance = () => {
  return globalThis[TRACING_ALS_KEY];
};

// ../../node_modules/@langchain/core/dist/utils/namespace.js
function createNamespace(path3) {
  const symbol = Symbol.for(path3);
  return {
    brand(Base, marker) {
      const brandSymbol = marker ? Symbol.for(`${path3}.${marker}`) : symbol;
      class _Branded extends Base {
        [brandSymbol] = true;
        constructor(...args) {
          super(...args);
        }
        static isInstance(obj) {
          return typeof obj === "object" && obj !== null && brandSymbol in obj && obj[brandSymbol] === true;
        }
      }
      Object.defineProperty(_Branded, "name", { value: Base.name });
      return _Branded;
    },
    sub(childPath) {
      return createNamespace(`${path3}.${childPath}`);
    },
    isInstance(obj) {
      return typeof obj === "object" && obj !== null && symbol in obj && obj[symbol] === true;
    }
  };
}
var ns = createNamespace("langchain");

// ../../node_modules/@langchain/core/dist/errors/index.js
var ns2 = ns.sub("error");
var LangChainError = class extends ns2.brand(Error) {
  name = "LangChainError";
  constructor(message) {
    super(message);
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, this.constructor);
  }
};
var ModelAbortError = class extends ns2.brand(LangChainError, "model-abort") {
  name = "ModelAbortError";
  /**
  * The partial message output that was produced before the operation was aborted.
  * This is typically an AIMessageChunk, or could be undefined if no output was available.
  */
  partialOutput;
  /**
  * Constructs a new ModelAbortError instance.
  *
  * @param message - A human-readable message describing the abort event.
  * @param partialOutput - Any partial model output generated before the abort (optional).
  */
  constructor(message, partialOutput) {
    super(message);
    this.partialOutput = partialOutput;
  }
};
var ContextOverflowError = class ContextOverflowError2 extends ns2.brand(LangChainError, "context-overflow") {
  name = "ContextOverflowError";
  /**
  * The underlying error that caused this {@link ContextOverflowError}, if any.
  *
  * This property is optionally set when wrapping a lower-level error using {@link ContextOverflowError.fromError}.
  * It allows error handlers to access or inspect the original error that led to the context overflow.
  */
  cause;
  constructor(message) {
    super(message ?? "Input exceeded the model's context window.");
  }
  /**
  * Creates a new {@link ContextOverflowError} instance from an existing error.
  *
  * This static utility copies the message from the provided error and
  * attaches the original error as the {@link ContextOverflowError.cause} property,
  * enabling error handlers to inspect or propagate the original failure.
  *
  * @param obj - The original error object causing the context overflow.
  * @returns A new {@link ContextOverflowError} instance with the original error set as its cause.
  *
  * @example
  * ```typescript
  * try {
  *   await model.invoke(input);
  * } catch (err) {
  *   throw ContextOverflowError.fromError(err);
  * }
  * ```
  */
  static fromError(obj) {
    const error = new ContextOverflowError2(obj.message);
    error.cause = obj;
    return error;
  }
};

// ../../node_modules/@langchain/core/dist/utils/json.js
function strictParsePartialJson(s) {
  try {
    return JSON.parse(s);
  } catch {
  }
  const buffer = s.trim();
  if (buffer.length === 0)
    throw new Error("Unexpected end of JSON input");
  let pos = 0;
  function skipWhitespace() {
    while (pos < buffer.length && /\s/.test(buffer[pos]))
      pos += 1;
  }
  function parseString() {
    if (buffer[pos] !== '"')
      throw new Error(`Expected '"' at position ${pos}, got '${buffer[pos]}'`);
    pos += 1;
    let result = "";
    let escaped = false;
    while (pos < buffer.length) {
      const char = buffer[pos];
      if (escaped) {
        if (char === "n")
          result += "\n";
        else if (char === "t")
          result += "	";
        else if (char === "r")
          result += "\r";
        else if (char === "\\")
          result += "\\";
        else if (char === '"')
          result += '"';
        else if (char === "b")
          result += "\b";
        else if (char === "f")
          result += "\f";
        else if (char === "/")
          result += "/";
        else if (char === "u") {
          const hex = buffer.substring(pos + 1, pos + 5);
          if (/^[0-9A-Fa-f]{0,4}$/.test(hex)) {
            if (hex.length === 4)
              result += String.fromCharCode(Number.parseInt(hex, 16));
            else
              result += `u${hex}`;
            pos += hex.length;
          } else
            throw new Error(`Invalid unicode escape sequence '\\u${hex}' at position ${pos}`);
        } else
          throw new Error(`Invalid escape sequence '\\${char}' at position ${pos}`);
        escaped = false;
      } else if (char === "\\")
        escaped = true;
      else if (char === '"') {
        pos += 1;
        return result;
      } else
        result += char;
      pos += 1;
    }
    if (escaped)
      result += "\\";
    return result;
  }
  function parseNumber() {
    const start = pos;
    let numStr = "";
    if (buffer[pos] === "-") {
      numStr += "-";
      pos += 1;
    }
    if (pos < buffer.length && buffer[pos] === "0") {
      numStr += "0";
      pos += 1;
      if (buffer[pos] >= "0" && buffer[pos] <= "9")
        throw new Error(`Invalid number at position ${start}`);
    }
    if (pos < buffer.length && buffer[pos] >= "1" && buffer[pos] <= "9")
      while (pos < buffer.length && buffer[pos] >= "0" && buffer[pos] <= "9") {
        numStr += buffer[pos];
        pos += 1;
      }
    if (pos < buffer.length && buffer[pos] === ".") {
      numStr += ".";
      pos += 1;
      while (pos < buffer.length && buffer[pos] >= "0" && buffer[pos] <= "9") {
        numStr += buffer[pos];
        pos += 1;
      }
    }
    if (pos < buffer.length && (buffer[pos] === "e" || buffer[pos] === "E")) {
      numStr += buffer[pos];
      pos += 1;
      if (pos < buffer.length && (buffer[pos] === "+" || buffer[pos] === "-")) {
        numStr += buffer[pos];
        pos += 1;
      }
      while (pos < buffer.length && buffer[pos] >= "0" && buffer[pos] <= "9") {
        numStr += buffer[pos];
        pos += 1;
      }
    }
    if (numStr === "-")
      return -0;
    const num = Number.parseFloat(numStr);
    if (Number.isNaN(num)) {
      pos = start;
      throw new Error(`Invalid number '${numStr}' at position ${start}`);
    }
    return num;
  }
  function parseValue() {
    skipWhitespace();
    if (pos >= buffer.length)
      throw new Error(`Unexpected end of input at position ${pos}`);
    const char = buffer[pos];
    if (char === "{")
      return parseObject();
    if (char === "[")
      return parseArray();
    if (char === '"')
      return parseString();
    if ("null".startsWith(buffer.substring(pos, pos + 4))) {
      pos += Math.min(4, buffer.length - pos);
      return null;
    }
    if ("true".startsWith(buffer.substring(pos, pos + 4))) {
      pos += Math.min(4, buffer.length - pos);
      return true;
    }
    if ("false".startsWith(buffer.substring(pos, pos + 5))) {
      pos += Math.min(5, buffer.length - pos);
      return false;
    }
    if (char === "-" || char >= "0" && char <= "9")
      return parseNumber();
    throw new Error(`Unexpected character '${char}' at position ${pos}`);
  }
  function parseArray() {
    if (buffer[pos] !== "[")
      throw new Error(`Expected '[' at position ${pos}, got '${buffer[pos]}'`);
    const arr2 = [];
    pos += 1;
    skipWhitespace();
    if (pos >= buffer.length)
      return arr2;
    if (buffer[pos] === "]") {
      pos += 1;
      return arr2;
    }
    while (pos < buffer.length) {
      skipWhitespace();
      if (pos >= buffer.length)
        return arr2;
      arr2.push(parseValue());
      skipWhitespace();
      if (pos >= buffer.length)
        return arr2;
      if (buffer[pos] === "]") {
        pos += 1;
        return arr2;
      } else if (buffer[pos] === ",") {
        pos += 1;
        continue;
      }
      throw new Error(`Expected ',' or ']' at position ${pos}, got '${buffer[pos]}'`);
    }
    return arr2;
  }
  function parseObject() {
    if (buffer[pos] !== "{")
      throw new Error(`Expected '{' at position ${pos}, got '${buffer[pos]}'`);
    const obj = {};
    pos += 1;
    skipWhitespace();
    if (pos >= buffer.length)
      return obj;
    if (buffer[pos] === "}") {
      pos += 1;
      return obj;
    }
    while (pos < buffer.length) {
      skipWhitespace();
      if (pos >= buffer.length)
        return obj;
      const key = parseString();
      skipWhitespace();
      if (pos >= buffer.length)
        return obj;
      if (buffer[pos] !== ":")
        throw new Error(`Expected ':' at position ${pos}, got '${buffer[pos]}'`);
      pos += 1;
      skipWhitespace();
      if (pos >= buffer.length)
        return obj;
      obj[key] = parseValue();
      skipWhitespace();
      if (pos >= buffer.length)
        return obj;
      if (buffer[pos] === "}") {
        pos += 1;
        return obj;
      } else if (buffer[pos] === ",") {
        pos += 1;
        continue;
      }
      throw new Error(`Expected ',' or '}' at position ${pos}, got '${buffer[pos]}'`);
    }
    return obj;
  }
  const value = parseValue();
  skipWhitespace();
  if (pos < buffer.length)
    throw new Error(`Unexpected character '${buffer[pos]}' at position ${pos}`);
  return value;
}
function parsePartialJson(s) {
  try {
    if (typeof s === "undefined")
      return null;
    return strictParsePartialJson(s);
  } catch {
    return null;
  }
}

// ../../node_modules/@langchain/core/dist/messages/content/data.js
function isDataContentBlock(content_block) {
  return typeof content_block === "object" && content_block !== null && "type" in content_block && typeof content_block.type === "string" && "source_type" in content_block && (content_block.source_type === "url" || content_block.source_type === "base64" || content_block.source_type === "text" || content_block.source_type === "id");
}
function isURLContentBlock(content_block) {
  return isDataContentBlock(content_block) && content_block.source_type === "url" && "url" in content_block && typeof content_block.url === "string";
}
function isBase64ContentBlock(content_block) {
  return isDataContentBlock(content_block) && content_block.source_type === "base64" && "data" in content_block && typeof content_block.data === "string";
}
function isIDContentBlock(content_block) {
  return isDataContentBlock(content_block) && content_block.source_type === "id" && "id" in content_block && typeof content_block.id === "string";
}
function parseBase64DataUrl({ dataUrl: data_url, asTypedArray = false }) {
  const formatMatch = data_url.match(/^data:(\w+\/\w+);base64,([A-Za-z0-9+/]+=*)$/);
  let mime_type;
  if (formatMatch) {
    mime_type = formatMatch[1].toLowerCase();
    const data = asTypedArray ? Uint8Array.from(atob(formatMatch[2]), (c) => c.charCodeAt(0)) : formatMatch[2];
    return {
      mime_type,
      data
    };
  }
}

// ../../node_modules/@langchain/core/dist/messages/block_translators/utils.js
function _isContentBlock(block, type) {
  return _isObject(block) && block.type === type;
}
function _isObject(value) {
  return typeof value === "object" && value !== null;
}
function _isArray(value) {
  return Array.isArray(value);
}
function _isString(value) {
  return typeof value === "string";
}
function _isNumber(value) {
  return typeof value === "number";
}
function _isBytesArray(value) {
  return value instanceof Uint8Array;
}
function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return;
  }
}
var iife = (fn) => fn();

// ../../node_modules/@langchain/core/dist/messages/block_translators/anthropic.js
function convertAnthropicAnnotation(citation) {
  if (citation.type === "char_location" && _isString(citation.document_title) && _isNumber(citation.start_char_index) && _isNumber(citation.end_char_index) && _isString(citation.cited_text)) {
    const { document_title, start_char_index, end_char_index, cited_text, ...rest } = citation;
    return {
      ...rest,
      type: "citation",
      source: "char",
      title: document_title ?? void 0,
      startIndex: start_char_index,
      endIndex: end_char_index,
      citedText: cited_text
    };
  }
  if (citation.type === "page_location" && _isString(citation.document_title) && _isNumber(citation.start_page_number) && _isNumber(citation.end_page_number) && _isString(citation.cited_text)) {
    const { document_title, start_page_number, end_page_number, cited_text, ...rest } = citation;
    return {
      ...rest,
      type: "citation",
      source: "page",
      title: document_title ?? void 0,
      startIndex: start_page_number,
      endIndex: end_page_number,
      citedText: cited_text
    };
  }
  if (citation.type === "content_block_location" && _isString(citation.document_title) && _isNumber(citation.start_block_index) && _isNumber(citation.end_block_index) && _isString(citation.cited_text)) {
    const { document_title, start_block_index, end_block_index, cited_text, ...rest } = citation;
    return {
      ...rest,
      type: "citation",
      source: "block",
      title: document_title ?? void 0,
      startIndex: start_block_index,
      endIndex: end_block_index,
      citedText: cited_text
    };
  }
  if (citation.type === "web_search_result_location" && _isString(citation.url) && _isString(citation.title) && _isString(citation.encrypted_index) && _isString(citation.cited_text)) {
    const { url, title, encrypted_index, cited_text, ...rest } = citation;
    return {
      ...rest,
      type: "citation",
      source: "url",
      url,
      title,
      startIndex: Number(encrypted_index),
      endIndex: Number(encrypted_index),
      citedText: cited_text
    };
  }
  if (citation.type === "search_result_location" && _isString(citation.source) && _isString(citation.title) && _isNumber(citation.start_block_index) && _isNumber(citation.end_block_index) && _isString(citation.cited_text)) {
    const { source, title, start_block_index, end_block_index, cited_text, ...rest } = citation;
    return {
      ...rest,
      type: "citation",
      source: "search",
      url: source,
      title: title ?? void 0,
      startIndex: start_block_index,
      endIndex: end_block_index,
      citedText: cited_text
    };
  }
}
function convertToV1FromAnthropicContentBlock(block) {
  if (_isContentBlock(block, "document") && _isObject(block.source) && "type" in block.source) {
    if (block.source.type === "base64" && _isString(block.source.media_type) && _isString(block.source.data))
      return {
        type: "file",
        mimeType: block.source.media_type,
        data: block.source.data
      };
    else if (block.source.type === "url" && _isString(block.source.url))
      return {
        type: "file",
        url: block.source.url
      };
    else if (block.source.type === "file" && _isString(block.source.file_id))
      return {
        type: "file",
        fileId: block.source.file_id
      };
    else if (block.source.type === "text" && _isString(block.source.data))
      return {
        type: "file",
        mimeType: String(block.source.media_type ?? "text/plain"),
        data: block.source.data
      };
  } else if (_isContentBlock(block, "image") && _isObject(block.source) && "type" in block.source) {
    if (block.source.type === "base64" && _isString(block.source.media_type) && _isString(block.source.data))
      return {
        type: "image",
        mimeType: block.source.media_type,
        data: block.source.data
      };
    else if (block.source.type === "url" && _isString(block.source.url))
      return {
        type: "image",
        url: block.source.url
      };
    else if (block.source.type === "file" && _isString(block.source.file_id))
      return {
        type: "image",
        fileId: block.source.file_id
      };
  }
}
function convertToV1FromAnthropicInput(content) {
  function* iterateContent() {
    for (const block of content) {
      const stdBlock = convertToV1FromAnthropicContentBlock(block);
      if (stdBlock)
        yield stdBlock;
      else
        yield block;
    }
  }
  return Array.from(iterateContent());
}
function convertToV1FromAnthropicMessage(message) {
  function* iterateContent() {
    const content = typeof message.content === "string" ? [{
      type: "text",
      text: message.content
    }] : message.content;
    for (const block of content) {
      if (_isContentBlock(block, "text") && _isString(block.text)) {
        const { text, citations, ...rest } = block;
        if (_isArray(citations) && citations.length) {
          const _citations = citations.reduce((acc, item) => {
            const citation = convertAnthropicAnnotation(item);
            if (citation)
              return [...acc, citation];
            return acc;
          }, []);
          yield {
            ...rest,
            type: "text",
            text,
            annotations: _citations
          };
          continue;
        } else {
          yield {
            ...rest,
            type: "text",
            text
          };
          continue;
        }
      } else if (_isContentBlock(block, "thinking") && _isString(block.thinking)) {
        const { thinking, signature, ...rest } = block;
        yield {
          ...rest,
          type: "reasoning",
          reasoning: thinking,
          signature
        };
        continue;
      } else if (_isContentBlock(block, "redacted_thinking")) {
        yield {
          type: "non_standard",
          value: block
        };
        continue;
      } else if (_isContentBlock(block, "tool_use") && _isString(block.name) && _isString(block.id)) {
        yield {
          type: "tool_call",
          id: block.id,
          name: block.name,
          args: block.input
        };
        continue;
      } else if (_isContentBlock(block, "input_json_delta")) {
        if (_isAIMessageChunk(message) && message.tool_call_chunks?.length) {
          const tool_call_chunk = message.tool_call_chunks[0];
          yield {
            type: "tool_call_chunk",
            id: tool_call_chunk.id,
            name: tool_call_chunk.name,
            args: tool_call_chunk.args,
            index: tool_call_chunk.index
          };
          continue;
        }
      } else if (_isContentBlock(block, "server_tool_use") && _isString(block.name) && _isString(block.id)) {
        const { name, id } = block;
        if (name === "web_search") {
          yield {
            id,
            type: "server_tool_call",
            name: "web_search",
            args: { query: iife(() => {
              if (typeof block.input === "string")
                return block.input;
              else if (_isObject(block.input) && _isString(block.input.query))
                return block.input.query;
              else if (_isString(block.partial_json)) {
                const json = safeParseJson(block.partial_json);
                if (json?.query)
                  return json.query;
              }
              return "";
            }) }
          };
          continue;
        } else if (block.name === "code_execution") {
          yield {
            id,
            type: "server_tool_call",
            name: "code_execution",
            args: { code: iife(() => {
              if (typeof block.input === "string")
                return block.input;
              else if (_isObject(block.input) && _isString(block.input.code))
                return block.input.code;
              else if (_isString(block.partial_json)) {
                const json = safeParseJson(block.partial_json);
                if (json?.code)
                  return json.code;
              }
              return "";
            }) }
          };
          continue;
        }
      } else if (_isContentBlock(block, "web_search_tool_result") && _isString(block.tool_use_id) && _isArray(block.content)) {
        const { content: content2, tool_use_id } = block;
        yield {
          type: "server_tool_call_result",
          name: "web_search",
          toolCallId: tool_use_id,
          status: "success",
          output: { urls: content2.reduce((acc, content3) => {
            if (_isContentBlock(content3, "web_search_result"))
              return [...acc, content3.url];
            return acc;
          }, []) }
        };
        continue;
      } else if (_isContentBlock(block, "code_execution_tool_result") && _isString(block.tool_use_id) && _isObject(block.content)) {
        yield {
          type: "server_tool_call_result",
          name: "code_execution",
          toolCallId: block.tool_use_id,
          status: "success",
          output: block.content
        };
        continue;
      } else if (_isContentBlock(block, "mcp_tool_use")) {
        yield {
          id: block.id,
          type: "server_tool_call",
          name: "mcp_tool_use",
          args: block.input
        };
        continue;
      } else if (_isContentBlock(block, "mcp_tool_result") && _isString(block.tool_use_id) && _isObject(block.content)) {
        yield {
          type: "server_tool_call_result",
          name: "mcp_tool_use",
          toolCallId: block.tool_use_id,
          status: "success",
          output: block.content
        };
        continue;
      } else if (_isContentBlock(block, "container_upload")) {
        yield {
          type: "server_tool_call",
          name: "container_upload",
          args: block.input
        };
        continue;
      } else if (_isContentBlock(block, "search_result")) {
        yield {
          id: block.id,
          type: "non_standard",
          value: block
        };
        continue;
      } else if (_isContentBlock(block, "tool_result")) {
        yield {
          id: block.id,
          type: "non_standard",
          value: block
        };
        continue;
      } else {
        const stdBlock = convertToV1FromAnthropicContentBlock(block);
        if (stdBlock) {
          yield stdBlock;
          continue;
        }
      }
      yield {
        type: "non_standard",
        value: block
      };
    }
  }
  return Array.from(iterateContent());
}
var ChatAnthropicTranslator = {
  translateContent: convertToV1FromAnthropicMessage,
  translateContentChunk: convertToV1FromAnthropicMessage
};
function _isAIMessageChunk(message) {
  return typeof message?._getType === "function" && typeof message.concat === "function" && message._getType() === "ai";
}

// ../../node_modules/@langchain/core/dist/messages/block_translators/data.js
function convertToV1FromDataContentBlock(block) {
  if (isURLContentBlock(block))
    return {
      type: block.type,
      mimeType: block.mime_type,
      url: block.url,
      metadata: block.metadata
    };
  if (isBase64ContentBlock(block))
    return {
      type: block.type,
      mimeType: block.mime_type ?? "application/octet-stream",
      data: block.data,
      metadata: block.metadata
    };
  if (isIDContentBlock(block))
    return {
      type: block.type,
      mimeType: block.mime_type,
      fileId: block.id,
      metadata: block.metadata
    };
  return block;
}
function convertToV1FromDataContent(content) {
  return content.map(convertToV1FromDataContentBlock);
}
function isOpenAIDataBlock(block) {
  if (_isContentBlock(block, "image_url") && _isObject(block.image_url))
    return true;
  if (_isContentBlock(block, "input_audio") && _isObject(block.input_audio))
    return true;
  if (_isContentBlock(block, "file") && _isObject(block.file))
    return true;
  return false;
}
function convertToV1FromOpenAIDataBlock(block) {
  if (_isContentBlock(block, "image_url") && _isObject(block.image_url) && _isString(block.image_url.url)) {
    const parsed = parseBase64DataUrl({ dataUrl: block.image_url.url });
    if (parsed)
      return {
        type: "image",
        mimeType: parsed.mime_type,
        data: parsed.data
      };
    else
      return {
        type: "image",
        url: block.image_url.url
      };
  } else if (_isContentBlock(block, "input_audio") && _isObject(block.input_audio) && _isString(block.input_audio.data) && _isString(block.input_audio.format))
    return {
      type: "audio",
      data: block.input_audio.data,
      mimeType: `audio/${block.input_audio.format}`
    };
  else if (_isContentBlock(block, "file") && _isObject(block.file) && _isString(block.file.data)) {
    const parsed = parseBase64DataUrl({ dataUrl: block.file.data });
    if (parsed)
      return {
        type: "file",
        data: parsed.data,
        mimeType: parsed.mime_type
      };
    else if (_isString(block.file.file_id))
      return {
        type: "file",
        fileId: block.file.file_id
      };
  }
  return block;
}

// ../../node_modules/@langchain/core/dist/messages/block_translators/openai.js
function convertToV1FromChatCompletions(message) {
  const blocks = [];
  if (typeof message.content === "string") {
    if (message.content.length > 0)
      blocks.push({
        type: "text",
        text: message.content
      });
  } else
    blocks.push(...convertToV1FromChatCompletionsInput(message.content));
  for (const toolCall of message.tool_calls ?? [])
    blocks.push({
      type: "tool_call",
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args
    });
  return blocks;
}
function convertToV1FromChatCompletionsChunk(message) {
  const blocks = [];
  if (typeof message.content === "string") {
    if (message.content.length > 0)
      blocks.push({
        type: "text",
        text: message.content
      });
  } else
    blocks.push(...convertToV1FromChatCompletionsInput(message.content));
  for (const toolCall of message.tool_calls ?? [])
    blocks.push({
      type: "tool_call",
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args
    });
  return blocks;
}
function convertToV1FromChatCompletionsInput(blocks) {
  const convertedBlocks = [];
  for (const block of blocks)
    if (isOpenAIDataBlock(block))
      convertedBlocks.push(convertToV1FromOpenAIDataBlock(block));
    else
      convertedBlocks.push(block);
  return convertedBlocks;
}
function convertResponsesAnnotation(annotation) {
  if (annotation.type === "url_citation") {
    const { url, title, start_index, end_index } = annotation;
    return {
      type: "citation",
      url,
      title,
      startIndex: start_index,
      endIndex: end_index
    };
  }
  if (annotation.type === "file_citation") {
    const { file_id, filename, index } = annotation;
    return {
      type: "citation",
      title: filename,
      startIndex: index,
      endIndex: index,
      fileId: file_id
    };
  }
  return annotation;
}
function convertToV1FromResponses(message) {
  function* iterateContent() {
    if (_isObject(message.additional_kwargs?.reasoning) && _isArray(message.additional_kwargs.reasoning.summary))
      yield {
        type: "reasoning",
        reasoning: message.additional_kwargs.reasoning.summary.reduce((acc, item) => {
          if (_isObject(item) && _isString(item.text))
            return `${acc}${item.text}`;
          return acc;
        }, "")
      };
    const content = typeof message.content === "string" ? [{
      type: "text",
      text: message.content
    }] : message.content;
    for (const block of content)
      if (_isContentBlock(block, "text")) {
        const { text, annotations, phase, extras: existingExtras, ...rest } = block;
        const extras = _isObject(existingExtras) ? { ...existingExtras } : {};
        if (_isString(phase))
          extras.phase = phase;
        const extrasSpread = Object.keys(extras).length > 0 ? { extras } : {};
        if (Array.isArray(annotations))
          yield {
            ...rest,
            ...extrasSpread,
            type: "text",
            text: String(text),
            annotations: annotations.map(convertResponsesAnnotation)
          };
        else
          yield {
            ...rest,
            ...extrasSpread,
            type: "text",
            text: String(text)
          };
      }
    for (const toolCall of message.tool_calls ?? [])
      yield {
        type: "tool_call",
        id: toolCall.id,
        name: toolCall.name,
        args: toolCall.args
      };
    if (_isObject(message.additional_kwargs) && _isArray(message.additional_kwargs.tool_outputs))
      for (const toolOutput of message.additional_kwargs.tool_outputs) {
        if (_isContentBlock(toolOutput, "web_search_call")) {
          const webSearchArgs = {};
          if (_isObject(toolOutput.action) && _isString(toolOutput.action.query))
            webSearchArgs.query = toolOutput.action.query;
          yield {
            id: toolOutput.id,
            type: "server_tool_call",
            name: "web_search",
            args: webSearchArgs
          };
          if (toolOutput.status === "completed" || toolOutput.status === "failed") {
            const output = {};
            if (_isObject(toolOutput.action))
              output.action = toolOutput.action;
            yield {
              type: "server_tool_call_result",
              toolCallId: _isString(toolOutput.id) ? toolOutput.id : "",
              status: toolOutput.status === "completed" ? "success" : "error",
              output
            };
          }
          continue;
        } else if (_isContentBlock(toolOutput, "file_search_call")) {
          yield {
            id: toolOutput.id,
            type: "server_tool_call",
            name: "file_search",
            args: { queries: _isArray(toolOutput.queries) ? toolOutput.queries : [] }
          };
          if (toolOutput.status === "completed" || toolOutput.status === "failed")
            yield {
              type: "server_tool_call_result",
              toolCallId: _isString(toolOutput.id) ? toolOutput.id : "",
              status: toolOutput.status === "completed" ? "success" : "error",
              output: _isArray(toolOutput.results) ? { results: toolOutput.results } : {}
            };
          continue;
        } else if (_isContentBlock(toolOutput, "computer_call")) {
          yield {
            type: "non_standard",
            value: toolOutput
          };
          continue;
        } else if (_isContentBlock(toolOutput, "code_interpreter_call")) {
          if (_isString(toolOutput.code))
            yield {
              id: toolOutput.id,
              type: "server_tool_call",
              name: "code_interpreter",
              args: { code: toolOutput.code }
            };
          if (_isArray(toolOutput.outputs)) {
            const returnCode = iife(() => {
              if (toolOutput.status === "in_progress")
                return void 0;
              if (toolOutput.status === "completed")
                return 0;
              if (toolOutput.status === "incomplete")
                return 127;
              if (toolOutput.status === "interpreting")
                return void 0;
              if (toolOutput.status === "failed")
                return 1;
            });
            for (const output of toolOutput.outputs)
              if (_isContentBlock(output, "logs")) {
                yield {
                  type: "server_tool_call_result",
                  toolCallId: toolOutput.id ?? "",
                  status: "success",
                  output: {
                    type: "code_interpreter_output",
                    returnCode: returnCode ?? 0,
                    stderr: [0, void 0].includes(returnCode) ? void 0 : String(output.logs),
                    stdout: [0, void 0].includes(returnCode) ? String(output.logs) : void 0
                  }
                };
                continue;
              }
          }
          continue;
        } else if (_isContentBlock(toolOutput, "mcp_call")) {
          yield {
            id: toolOutput.id,
            type: "server_tool_call",
            name: "mcp_call",
            args: toolOutput.input
          };
          continue;
        } else if (_isContentBlock(toolOutput, "mcp_list_tools")) {
          yield {
            id: toolOutput.id,
            type: "server_tool_call",
            name: "mcp_list_tools",
            args: toolOutput.input
          };
          continue;
        } else if (_isContentBlock(toolOutput, "mcp_approval_request")) {
          yield {
            type: "non_standard",
            value: toolOutput
          };
          continue;
        } else if (_isContentBlock(toolOutput, "tool_search_call")) {
          const toolSearchArgs = {};
          if (_isObject(toolOutput.arguments))
            Object.assign(toolSearchArgs, toolOutput.arguments);
          const toolSearchCallExtras = {};
          if (_isString(toolOutput.execution))
            toolSearchCallExtras.execution = toolOutput.execution;
          if (_isString(toolOutput.status))
            toolSearchCallExtras.status = toolOutput.status;
          if (_isString(toolOutput.call_id))
            toolSearchCallExtras.call_id = toolOutput.call_id;
          yield {
            id: _isString(toolOutput.id) ? toolOutput.id : "",
            type: "server_tool_call",
            name: "tool_search",
            args: toolSearchArgs,
            ...Object.keys(toolSearchCallExtras).length > 0 ? { extras: toolSearchCallExtras } : {}
          };
          continue;
        } else if (_isContentBlock(toolOutput, "tool_search_output")) {
          const toolSearchOutputExtras = { name: "tool_search" };
          if (_isString(toolOutput.execution))
            toolSearchOutputExtras.execution = toolOutput.execution;
          yield {
            type: "server_tool_call_result",
            toolCallId: _isString(toolOutput.id) ? toolOutput.id : "",
            status: toolOutput.status === "completed" ? "success" : toolOutput.status === "failed" ? "error" : "success",
            output: { tools: _isArray(toolOutput.tools) ? toolOutput.tools : [] },
            extras: toolSearchOutputExtras
          };
          continue;
        } else if (_isContentBlock(toolOutput, "image_generation_call")) {
          if (_isString(toolOutput.result))
            yield {
              type: "image",
              mimeType: "image/png",
              data: toolOutput.result,
              id: _isString(toolOutput.id) ? toolOutput.id : void 0,
              metadata: { status: _isString(toolOutput.status) ? toolOutput.status : void 0 }
            };
          yield {
            type: "non_standard",
            value: toolOutput
          };
          continue;
        }
        if (_isObject(toolOutput))
          yield {
            type: "non_standard",
            value: toolOutput
          };
      }
  }
  return Array.from(iterateContent());
}
function convertToV1FromResponsesChunk(message) {
  function* iterateContent() {
    yield* convertToV1FromResponses(message);
    for (const toolCallChunk of message.tool_call_chunks ?? [])
      yield {
        type: "tool_call_chunk",
        id: toolCallChunk.id,
        name: toolCallChunk.name,
        args: toolCallChunk.args
      };
  }
  return Array.from(iterateContent());
}
var ChatOpenAITranslator = {
  translateContent: (message) => {
    if (typeof message.content === "string")
      return convertToV1FromChatCompletions(message);
    return convertToV1FromResponses(message);
  },
  translateContentChunk: (message) => {
    if (typeof message.content === "string")
      return convertToV1FromChatCompletionsChunk(message);
    return convertToV1FromResponsesChunk(message);
  }
};

// ../../node_modules/@langchain/core/dist/messages/message.js
function isMessage(message) {
  return typeof message === "object" && message !== null && "type" in message && "content" in message && (typeof message.content === "string" || Array.isArray(message.content));
}

// ../../node_modules/@langchain/core/dist/messages/format.js
function convertToFormattedString(message, format2 = "pretty") {
  if (format2 === "pretty")
    return convertToPrettyString(message);
  return JSON.stringify(message);
}
function convertToPrettyString(message) {
  const lines = [];
  const title = ` ${message.type.charAt(0).toUpperCase() + message.type.slice(1)} Message `;
  const sepLen = Math.floor((80 - title.length) / 2);
  const sep = "=".repeat(sepLen);
  const secondSep = title.length % 2 === 0 ? sep : `${sep}=`;
  lines.push(`${sep}${title}${secondSep}`);
  if (message.type === "ai") {
    const aiMessage = message;
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      lines.push("Tool Calls:");
      for (const tc of aiMessage.tool_calls) {
        lines.push(`  ${tc.name} (${tc.id})`);
        lines.push(` Call ID: ${tc.id}`);
        lines.push("  Args:");
        for (const [key, value] of Object.entries(tc.args))
          lines.push(`    ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
      }
    }
  }
  if (message.type === "tool") {
    const toolMessage = message;
    if (toolMessage.name)
      lines.push(`Name: ${toolMessage.name}`);
  }
  if (typeof message.content === "string" && message.content.trim()) {
    if (lines.length > 1)
      lines.push("");
    lines.push(message.content);
  }
  return lines.join("\n");
}

// ../../node_modules/@langchain/core/dist/messages/base.js
var MESSAGE_SYMBOL = Symbol.for("langchain.message");
function contentBlocksFromNonStringFirst(firstContent) {
  if (Array.isArray(firstContent))
    return firstContent;
  if (typeof firstContent === "string")
    return firstContent === "" ? [] : [{
      type: "text",
      text: firstContent
    }];
  if (firstContent == null)
    return [];
  return [firstContent];
}
function mergeContent(firstContent, secondContent) {
  if (typeof firstContent === "string") {
    if (firstContent === "")
      return secondContent;
    if (typeof secondContent === "string")
      return firstContent + secondContent;
    else if (Array.isArray(secondContent) && secondContent.length === 0)
      return firstContent;
    else if (Array.isArray(secondContent) && secondContent.some((c) => isDataContentBlock(c)))
      return [{
        type: "text",
        source_type: "text",
        text: firstContent
      }, ...secondContent];
    else
      return [{
        type: "text",
        text: firstContent
      }, ...secondContent];
  } else if (Array.isArray(secondContent)) {
    const left = contentBlocksFromNonStringFirst(firstContent);
    return _mergeLists(left, secondContent) ?? [...left, ...secondContent];
  } else if (secondContent === "")
    return firstContent;
  else if (Array.isArray(firstContent) && firstContent.some((c) => isDataContentBlock(c)))
    return [...firstContent, {
      type: "file",
      source_type: "text",
      text: secondContent
    }];
  else
    return [...contentBlocksFromNonStringFirst(firstContent), {
      type: "text",
      text: secondContent
    }];
}
function stringifyWithDepthLimit(obj, depthLimit) {
  function helper(obj2, currentDepth) {
    if (typeof obj2 !== "object" || obj2 === null || obj2 === void 0)
      return obj2;
    if (currentDepth >= depthLimit) {
      if (Array.isArray(obj2))
        return "[Array]";
      return "[Object]";
    }
    if (Array.isArray(obj2))
      return obj2.map((item) => helper(item, currentDepth + 1));
    const result = {};
    for (const key of Object.keys(obj2))
      result[key] = helper(obj2[key], currentDepth + 1);
    return result;
  }
  return JSON.stringify(helper(obj, 0), null, 2);
}
var BaseMessage = class extends Serializable {
  lc_namespace = ["langchain_core", "messages"];
  lc_serializable = true;
  get lc_aliases() {
    return {
      additional_kwargs: "additional_kwargs",
      response_metadata: "response_metadata"
    };
  }
  [MESSAGE_SYMBOL] = true;
  id;
  /** @inheritdoc */
  name;
  content;
  additional_kwargs;
  response_metadata;
  /**
  * @deprecated Use .getType() instead or import the proper typeguard.
  * For example:
  *
  * ```ts
  * import { isAIMessage } from "@langchain/core/messages";
  *
  * const message = new AIMessage("Hello!");
  * isAIMessage(message); // true
  * ```
  */
  _getType() {
    return this.type;
  }
  /**
  * @deprecated Use .type instead
  * The type of the message.
  */
  getType() {
    return this._getType();
  }
  constructor(arg) {
    const fields = typeof arg === "string" || Array.isArray(arg) ? { content: arg } : arg;
    if (!fields.additional_kwargs)
      fields.additional_kwargs = {};
    if (!fields.response_metadata)
      fields.response_metadata = {};
    super(fields);
    this.name = fields.name;
    if (fields.content === void 0 && fields.contentBlocks !== void 0) {
      this.content = fields.contentBlocks;
      this.response_metadata = {
        output_version: "v1",
        ...fields.response_metadata
      };
    } else if (fields.content !== void 0) {
      this.content = fields.content ?? [];
      this.response_metadata = fields.response_metadata;
    } else {
      this.content = [];
      this.response_metadata = fields.response_metadata;
    }
    this.additional_kwargs = fields.additional_kwargs;
    this.id = fields.id;
  }
  /** Get text content of the message. */
  get text() {
    if (typeof this.content === "string")
      return this.content;
    if (!Array.isArray(this.content))
      return "";
    return this.content.map((c) => {
      if (typeof c === "string")
        return c;
      if (c.type === "text")
        return c.text;
      return "";
    }).join("");
  }
  get contentBlocks() {
    const blocks = typeof this.content === "string" ? [{
      type: "text",
      text: this.content
    }] : this.content;
    return [
      convertToV1FromDataContent,
      convertToV1FromChatCompletionsInput,
      convertToV1FromAnthropicInput
    ].reduce((blocks2, step) => step(blocks2), blocks);
  }
  toDict() {
    return {
      type: this.getType(),
      data: this.toJSON().kwargs
    };
  }
  static lc_name() {
    return "BaseMessage";
  }
  get _printableFields() {
    return {
      id: this.id,
      content: this.content,
      name: this.name,
      additional_kwargs: this.additional_kwargs,
      response_metadata: this.response_metadata
    };
  }
  static isInstance(obj) {
    return typeof obj === "object" && obj !== null && MESSAGE_SYMBOL in obj && obj[MESSAGE_SYMBOL] === true && isMessage(obj);
  }
  _updateId(value) {
    this.id = value;
    this.lc_kwargs.id = value;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.lc_name();
  }
  [Symbol.for("nodejs.util.inspect.custom")](depth) {
    if (depth === null)
      return this;
    const printable = stringifyWithDepthLimit(this._printableFields, Math.max(4, depth));
    return `${this.constructor.lc_name()} ${printable}`;
  }
  toFormattedString(format2 = "pretty") {
    return convertToFormattedString(this, format2);
  }
};
var DEFAULT_MERGE_IGNORE_KEYS = [
  "index",
  "created",
  "timestamp"
];
function _mergeDicts(left, right, options) {
  const ignoreKeys = options?.ignoreKeys ?? DEFAULT_MERGE_IGNORE_KEYS;
  if (left == null && right == null)
    return;
  if (left == null || right == null)
    return left ?? right;
  const merged = { ...left };
  for (const [key, value] of Object.entries(right))
    if (merged[key] == null)
      merged[key] = value;
    else if (value == null)
      continue;
    else if (typeof merged[key] !== typeof value || Array.isArray(merged[key]) !== Array.isArray(value))
      throw new Error(`field[${key}] already exists in the message chunk, but with a different type.`);
    else if (typeof merged[key] === "string")
      if (key === "type")
        continue;
      else if ([
        "id",
        "name",
        "output_version",
        "model_provider"
      ].includes(key)) {
        if (value)
          merged[key] = value;
      } else if (ignoreKeys.includes(key))
        continue;
      else
        merged[key] += value;
    else if (typeof merged[key] === "number") {
      if (ignoreKeys.includes(key))
        continue;
      merged[key] = merged[key] + value;
    } else if (typeof merged[key] === "object" && !Array.isArray(merged[key]))
      merged[key] = _mergeDicts(merged[key], value, options);
    else if (Array.isArray(merged[key]))
      merged[key] = _mergeLists(merged[key], value, options);
    else if (merged[key] === value)
      continue;
    else
      console.warn(`field[${key}] already exists in this message chunk and value has unsupported type.`);
  return merged;
}
function isMergeableIndex(index) {
  return typeof index === "number" || typeof index === "string";
}
function hasMergeableIndex(value) {
  if (typeof value !== "object" || value === null)
    return false;
  if (!("index" in value))
    return false;
  return isMergeableIndex(value.index);
}
function hasMergeableId(value) {
  if (typeof value !== "object" || value === null)
    return false;
  if (!("id" in value))
    return false;
  const id = value.id;
  return id != null && id !== "";
}
function getMergeableTypeBase(type) {
  return type.endsWith("_delta") ? type.slice(0, -6) : type;
}
function hasMismatchedMergeableType(left, right) {
  if (typeof left !== "object" || left === null)
    return false;
  if (typeof right !== "object" || right === null)
    return false;
  if (!("type" in left) || !("type" in right))
    return false;
  return typeof left.type === "string" && typeof right.type === "string" && getMergeableTypeBase(left.type) !== getMergeableTypeBase(right.type);
}
function _findMergeTarget(merged, item) {
  const itemHasIndex = hasMergeableIndex(item);
  const itemHasId = hasMergeableId(item);
  if (!itemHasIndex && !itemHasId)
    return -1;
  return merged.findIndex((leftItem) => {
    const leftHasIndex = hasMergeableIndex(leftItem);
    const leftHasId = hasMergeableId(leftItem);
    if (itemHasIndex && leftHasIndex) {
      if (!(leftItem.index === item.index))
        return false;
      if (hasMismatchedMergeableType(leftItem, item))
        return false;
      if (leftHasId && itemHasId)
        return leftItem.id === item.id;
      return true;
    }
    if (!itemHasIndex && !leftHasIndex && itemHasId && leftHasId)
      return leftItem.id === item.id;
    return false;
  });
}
function _mergeLists(left, right, options) {
  if (left == null && right == null)
    return;
  else if (left == null || right == null)
    return left || right;
  else {
    const merged = [...left];
    for (const item of right) {
      const toMerge = _findMergeTarget(merged, item);
      if (toMerge !== -1)
        merged[toMerge] = _mergeDicts(merged[toMerge], item, options);
      else if (typeof item === "object" && item !== null && "text" in item && item.text === "")
        continue;
      else
        merged.push(item);
    }
    return merged;
  }
}
var BaseMessageChunk = class BaseMessageChunk2 extends BaseMessage {
  static isInstance(obj) {
    if (!super.isInstance(obj))
      return false;
    let proto = Object.getPrototypeOf(obj);
    while (proto !== null) {
      if (proto === BaseMessageChunk2.prototype)
        return true;
      proto = Object.getPrototypeOf(proto);
    }
    return false;
  }
};

// ../../node_modules/@langchain/core/dist/messages/tool.js
function defaultToolCallParser(rawToolCalls) {
  const toolCalls = [];
  const invalidToolCalls = [];
  for (const toolCall of rawToolCalls)
    if (!toolCall.function)
      continue;
    else {
      const functionName = toolCall.function.name;
      try {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        toolCalls.push({
          name: functionName || "",
          args: functionArgs || {},
          id: toolCall.id
        });
      } catch {
        invalidToolCalls.push({
          name: functionName,
          args: toolCall.function.arguments,
          id: toolCall.id,
          error: "Malformed args."
        });
      }
    }
  return [toolCalls, invalidToolCalls];
}

// ../../node_modules/@langchain/core/dist/messages/block_translators/bedrock_converse.js
function convertFileFormatToMimeType(format2) {
  switch (format2) {
    case "csv":
      return "text/csv";
    case "doc":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "html":
      return "text/html";
    case "md":
      return "text/markdown";
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "gif":
      return "image/gif";
    case "jpeg":
      return "image/jpeg";
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "flv":
      return "video/flv";
    case "mkv":
      return "video/mkv";
    case "mov":
      return "video/mov";
    case "mp4":
      return "video/mp4";
    case "mpeg":
      return "video/mpeg";
    case "mpg":
      return "video/mpg";
    case "three_gp":
      return "video/three_gp";
    case "webm":
      return "video/webm";
    case "wmv":
      return "video/wmv";
    default:
      return "application/octet-stream";
  }
}
function convertConverseDocumentBlock(block) {
  if (_isObject(block.document) && _isObject(block.document.source)) {
    const mimeType = convertFileFormatToMimeType(_isObject(block.document) && _isString(block.document.format) ? block.document.format : "");
    if (_isObject(block.document.source)) {
      if (_isObject(block.document.source.s3Location) && _isString(block.document.source.s3Location.uri))
        return {
          type: "file",
          mimeType,
          fileId: block.document.source.s3Location.uri
        };
      if (_isBytesArray(block.document.source.bytes))
        return {
          type: "file",
          mimeType,
          data: block.document.source.bytes
        };
      if (_isString(block.document.source.text))
        return {
          type: "file",
          mimeType,
          data: Buffer.from(block.document.source.text).toString("base64")
        };
      if (_isArray(block.document.source.content))
        return {
          type: "file",
          mimeType,
          data: block.document.source.content.reduce((acc, item) => {
            if (_isObject(item) && _isString(item.text))
              return acc + item.text;
            return acc;
          }, "")
        };
    }
  }
  return {
    type: "non_standard",
    value: block
  };
}
function convertConverseImageBlock(block) {
  if (_isContentBlock(block, "image") && _isObject(block.image)) {
    const mimeType = convertFileFormatToMimeType(_isObject(block.image) && _isString(block.image.format) ? block.image.format : "");
    if (_isObject(block.image.source)) {
      if (_isObject(block.image.source.s3Location) && _isString(block.image.source.s3Location.uri))
        return {
          type: "image",
          mimeType,
          fileId: block.image.source.s3Location.uri
        };
      if (_isBytesArray(block.image.source.bytes))
        return {
          type: "image",
          mimeType,
          data: block.image.source.bytes
        };
    }
  }
  return {
    type: "non_standard",
    value: block
  };
}
function convertConverseVideoBlock(block) {
  if (_isContentBlock(block, "video") && _isObject(block.video)) {
    const mimeType = convertFileFormatToMimeType(_isObject(block.video) && _isString(block.video.format) ? block.video.format : "");
    if (_isObject(block.video.source)) {
      if (_isObject(block.video.source.s3Location) && _isString(block.video.source.s3Location.uri))
        return {
          type: "video",
          mimeType,
          fileId: block.video.source.s3Location.uri
        };
      if (_isBytesArray(block.video.source.bytes))
        return {
          type: "video",
          mimeType,
          data: block.video.source.bytes
        };
    }
  }
  return {
    type: "non_standard",
    value: block
  };
}
function convertToV1FromChatBedrockConverseMessage(message) {
  function* iterateContent() {
    const content = typeof message.content === "string" ? [{
      type: "text",
      text: message.content
    }] : message.content;
    for (const block of content) {
      if (_isContentBlock(block, "cache_point")) {
        yield {
          type: "non_standard",
          value: block
        };
        continue;
      } else if (_isContentBlock(block, "citations_content") && _isObject(block.citationsContent)) {
        yield {
          type: "text",
          text: _isArray(block.citationsContent.content) ? block.citationsContent.content.reduce((acc, item) => {
            if (_isObject(item) && _isString(item.text))
              return acc + item.text;
            return acc;
          }, "") : "",
          annotations: _isArray(block.citationsContent.citations) ? block.citationsContent.citations.reduce((acc, item) => {
            if (_isObject(item)) {
              const citedText = _isArray(item.sourceContent) ? item.sourceContent.reduce((acc2, item2) => {
                if (_isObject(item2) && _isString(item2.text))
                  return acc2 + item2.text;
                return acc2;
              }, "") : "";
              const properties = iife(() => {
                if (_isObject(item.location)) {
                  const location2 = item.location.documentChar || item.location.documentPage || item.location.documentChunk;
                  if (_isObject(location2))
                    return {
                      source: _isNumber(location2.documentIndex) ? location2.documentIndex.toString() : void 0,
                      startIndex: _isNumber(location2.start) ? location2.start : void 0,
                      endIndex: _isNumber(location2.end) ? location2.end : void 0
                    };
                }
                return {};
              });
              acc.push({
                type: "citation",
                citedText,
                ...properties
              });
            }
            return acc;
          }, []) : []
        };
        continue;
      } else if (_isContentBlock(block, "document") && _isObject(block.document)) {
        yield convertConverseDocumentBlock(block);
        continue;
      } else if (_isContentBlock(block, "guard_content")) {
        yield {
          type: "non_standard",
          value: block
        };
        continue;
      } else if (_isContentBlock(block, "image") && _isObject(block.image)) {
        yield convertConverseImageBlock(block);
        continue;
      } else if (_isContentBlock(block, "reasoning_content") && _isString(block.reasoningText)) {
        yield {
          type: "reasoning",
          reasoning: block.reasoningText
        };
        continue;
      } else if (_isContentBlock(block, "text") && _isString(block.text)) {
        yield {
          type: "text",
          text: block.text
        };
        continue;
      } else if (_isContentBlock(block, "tool_result")) {
        yield {
          type: "non_standard",
          value: block
        };
        continue;
      } else if (_isContentBlock(block, "tool_call"))
        continue;
      else if (_isContentBlock(block, "video") && _isObject(block.video)) {
        yield convertConverseVideoBlock(block);
        continue;
      }
      yield {
        type: "non_standard",
        value: block
      };
    }
  }
  return Array.from(iterateContent());
}
var ChatBedrockConverseTranslator = {
  translateContent: convertToV1FromChatBedrockConverseMessage,
  translateContentChunk: convertToV1FromChatBedrockConverseMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/deepseek.js
function convertToV1FromDeepSeekMessage(message) {
  const blocks = [];
  const reasoningContent = message.additional_kwargs?.reasoning_content;
  if (_isString(reasoningContent) && reasoningContent.length > 0)
    blocks.push({
      type: "reasoning",
      reasoning: reasoningContent
    });
  if (typeof message.content === "string") {
    if (message.content.length > 0)
      blocks.push({
        type: "text",
        text: message.content
      });
  } else
    for (const block of message.content)
      if (typeof block === "object" && "type" in block && block.type === "text" && "text" in block && _isString(block.text))
        blocks.push({
          type: "text",
          text: block.text
        });
  for (const toolCall of message.tool_calls ?? [])
    blocks.push({
      type: "tool_call",
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args
    });
  return blocks;
}
var ChatDeepSeekTranslator = {
  translateContent: convertToV1FromDeepSeekMessage,
  translateContentChunk: convertToV1FromDeepSeekMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/google_genai.js
function convertToV1FromChatGoogleMessage(message) {
  function* iterateContent() {
    const content = typeof message.content === "string" ? [{
      type: "text",
      text: message.content
    }] : message.content;
    for (const block of content) {
      if (_isContentBlock(block, "text") && _isString(block.text)) {
        yield {
          type: "text",
          text: block.text
        };
        continue;
      } else if (_isContentBlock(block, "thinking") && _isString(block.thinking)) {
        yield {
          type: "reasoning",
          reasoning: block.thinking,
          ...block.signature ? { signature: block.signature } : {}
        };
        continue;
      } else if (_isContentBlock(block, "inlineData") && _isObject(block.inlineData) && _isString(block.inlineData.mimeType) && _isString(block.inlineData.data)) {
        yield {
          type: "file",
          mimeType: block.inlineData.mimeType,
          data: block.inlineData.data
        };
        continue;
      } else if (_isContentBlock(block, "functionCall") && _isObject(block.functionCall) && _isString(block.functionCall.name) && _isObject(block.functionCall.args)) {
        yield {
          type: "tool_call",
          id: message.id,
          name: block.functionCall.name,
          args: block.functionCall.args
        };
        continue;
      } else if (_isContentBlock(block, "functionResponse")) {
        yield {
          type: "non_standard",
          value: block
        };
        continue;
      } else if (_isContentBlock(block, "fileData") && _isObject(block.fileData) && _isString(block.fileData.mimeType) && _isString(block.fileData.fileUri)) {
        yield {
          type: "file",
          mimeType: block.fileData.mimeType,
          fileId: block.fileData.fileUri
        };
        continue;
      } else if (_isContentBlock(block, "executableCode")) {
        yield {
          type: "non_standard",
          value: block
        };
        continue;
      } else if (_isContentBlock(block, "codeExecutionResult")) {
        yield {
          type: "non_standard",
          value: block
        };
        continue;
      }
      yield {
        type: "non_standard",
        value: block
      };
    }
  }
  return Array.from(iterateContent());
}
var ChatGoogleGenAITranslator = {
  translateContent: convertToV1FromChatGoogleMessage,
  translateContentChunk: convertToV1FromChatGoogleMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/google_vertexai.js
function convertToV1FromChatVertexMessage(message) {
  function* iterateContent() {
    const content = typeof message.content === "string" ? [{
      type: "text",
      text: message.content
    }] : message.content;
    for (const block of content) {
      if (_isContentBlock(block, "reasoning") && _isString(block.reasoning)) {
        const signature = iife(() => {
          const reasoningIndex = content.indexOf(block);
          if (_isArray(message.additional_kwargs?.signatures) && reasoningIndex >= 0)
            return message.additional_kwargs.signatures.at(reasoningIndex);
        });
        if (_isString(signature))
          yield {
            type: "reasoning",
            reasoning: block.reasoning,
            signature
          };
        else
          yield {
            type: "reasoning",
            reasoning: block.reasoning
          };
        continue;
      } else if (_isContentBlock(block, "thinking") && _isString(block.thinking)) {
        yield {
          type: "reasoning",
          reasoning: block.thinking,
          ...block.signature ? { signature: block.signature } : {}
        };
        continue;
      } else if (_isContentBlock(block, "text") && _isString(block.text)) {
        yield {
          type: "text",
          text: block.text
        };
        continue;
      } else if (_isContentBlock(block, "image_url")) {
        if (_isString(block.image_url))
          if (block.image_url.startsWith("data:")) {
            const match = block.image_url.match(/^data:([^;]+);base64,(.+)$/);
            if (match)
              yield {
                type: "image",
                data: match[2],
                mimeType: match[1]
              };
            else
              yield {
                type: "image",
                url: block.image_url
              };
          } else
            yield {
              type: "image",
              url: block.image_url
            };
        continue;
      } else if (_isContentBlock(block, "media") && _isString(block.mimeType) && _isString(block.data)) {
        yield {
          type: "file",
          mimeType: block.mimeType,
          data: block.data
        };
        continue;
      }
      yield {
        type: "non_standard",
        value: block
      };
    }
  }
  return Array.from(iterateContent());
}
var ChatVertexTranslator = {
  translateContent: convertToV1FromChatVertexMessage,
  translateContentChunk: convertToV1FromChatVertexMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/groq.js
function convertToV1FromGroqMessage(message) {
  const blocks = [];
  const parsedReasoning = message.additional_kwargs?.reasoning;
  if (_isString(parsedReasoning) && parsedReasoning.length > 0)
    blocks.push({
      type: "reasoning",
      reasoning: parsedReasoning
    });
  if (typeof message.content === "string") {
    let textContent = message.content;
    const thinkMatch = textContent.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      const thinkingContent = thinkMatch[1].trim();
      if (thinkingContent.length > 0)
        blocks.push({
          type: "reasoning",
          reasoning: thinkingContent
        });
      textContent = textContent.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    }
    if (textContent.length > 0)
      blocks.push({
        type: "text",
        text: textContent
      });
  } else
    for (const block of message.content)
      if (typeof block === "object" && "type" in block && block.type === "text" && "text" in block && _isString(block.text)) {
        let textContent = block.text;
        const thinkMatch = textContent.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          const thinkingContent = thinkMatch[1].trim();
          if (thinkingContent.length > 0)
            blocks.push({
              type: "reasoning",
              reasoning: thinkingContent
            });
          textContent = textContent.replace(/<think>[\s\S]*?<\/think>/, "").trim();
        }
        if (textContent.length > 0)
          blocks.push({
            type: "text",
            text: textContent
          });
      }
  for (const toolCall of message.tool_calls ?? [])
    blocks.push({
      type: "tool_call",
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args
    });
  return blocks;
}
var ChatGroqTranslator = {
  translateContent: convertToV1FromGroqMessage,
  translateContentChunk: convertToV1FromGroqMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/ollama.js
function convertToV1FromOllamaMessage(message) {
  const blocks = [];
  const reasoningContent = message.additional_kwargs?.reasoning_content;
  if (_isString(reasoningContent) && reasoningContent.length > 0)
    blocks.push({
      type: "reasoning",
      reasoning: reasoningContent
    });
  if (typeof message.content === "string") {
    if (message.content.length > 0)
      blocks.push({
        type: "text",
        text: message.content
      });
  } else
    for (const block of message.content)
      if (typeof block === "object" && "type" in block && block.type === "text" && "text" in block && _isString(block.text))
        blocks.push({
          type: "text",
          text: block.text
        });
  for (const toolCall of message.tool_calls ?? [])
    blocks.push({
      type: "tool_call",
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args
    });
  return blocks;
}
var ChatOllamaTranslator = {
  translateContent: convertToV1FromOllamaMessage,
  translateContentChunk: convertToV1FromOllamaMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/openrouter.js
function convertToV1FromOpenRouterMessage(message) {
  const blocks = [];
  const reasoningDetails = message.additional_kwargs?.reasoning_details;
  let hasVisibleReasoningFromDetails = false;
  if (Array.isArray(reasoningDetails) && reasoningDetails.length > 0)
    for (const detail of reasoningDetails) {
      if (detail == null || typeof detail !== "object")
        continue;
      const type = detail.type;
      if (type === "reasoning.summary") {
        const summary = detail.summary;
        if (_isString(summary) && summary.length > 0) {
          blocks.push({
            type: "reasoning",
            reasoning: summary
          });
          hasVisibleReasoningFromDetails = true;
        }
      } else if (type === "reasoning.text") {
        const text = detail.text;
        if (_isString(text) && text.length > 0) {
          blocks.push({
            type: "reasoning",
            reasoning: text
          });
          hasVisibleReasoningFromDetails = true;
        }
      }
    }
  if (!hasVisibleReasoningFromDetails) {
    const reasoningContent = message.additional_kwargs?.reasoning_content;
    if (_isString(reasoningContent) && reasoningContent.length > 0)
      blocks.push({
        type: "reasoning",
        reasoning: reasoningContent
      });
  }
  if (typeof message.content === "string") {
    if (message.content.length > 0)
      blocks.push({
        type: "text",
        text: message.content
      });
  } else
    for (const block of message.content)
      if (typeof block === "object" && "type" in block && block.type === "text" && "text" in block && _isString(block.text))
        blocks.push({
          type: "text",
          text: block.text
        });
  for (const toolCall of message.tool_calls ?? [])
    blocks.push({
      type: "tool_call",
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args
    });
  return blocks;
}
var ChatOpenRouterTranslator = {
  translateContent: convertToV1FromOpenRouterMessage,
  translateContentChunk: convertToV1FromOpenRouterMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/xai.js
function convertToV1FromXAIMessage(message) {
  const blocks = [];
  if (_isObject(message.additional_kwargs?.reasoning)) {
    const reasoning = message.additional_kwargs.reasoning;
    if (_isArray(reasoning.summary)) {
      const summaryText = reasoning.summary.reduce((acc, item) => {
        if (_isObject(item) && _isString(item.text))
          return `${acc}${item.text}`;
        return acc;
      }, "");
      if (summaryText.length > 0)
        blocks.push({
          type: "reasoning",
          reasoning: summaryText
        });
    }
  }
  const reasoningContent = message.additional_kwargs?.reasoning_content;
  if (_isString(reasoningContent) && reasoningContent.length > 0)
    blocks.push({
      type: "reasoning",
      reasoning: reasoningContent
    });
  if (typeof message.content === "string") {
    if (message.content.length > 0)
      blocks.push({
        type: "text",
        text: message.content
      });
  } else
    for (const block of message.content)
      if (typeof block === "object" && "type" in block && block.type === "text" && "text" in block && _isString(block.text))
        blocks.push({
          type: "text",
          text: block.text
        });
  for (const toolCall of message.tool_calls ?? [])
    blocks.push({
      type: "tool_call",
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args
    });
  return blocks;
}
var ChatXAITranslator = {
  translateContent: convertToV1FromXAIMessage,
  translateContentChunk: convertToV1FromXAIMessage
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/google.js
function convertToV1FromChatGoogleMessage2(message) {
  function* iterateContent() {
    const content = iife(() => {
      if (typeof message.content === "string")
        if (message.additional_kwargs.originalTextContentBlock)
          return [{
            ...message.additional_kwargs.originalTextContentBlock,
            type: "text"
          }];
        else
          return [{
            type: "text",
            text: message.content
          }];
      else {
        const originalBlock = message.additional_kwargs?.originalTextContentBlock;
        if (originalBlock?.thoughtSignature) {
          if (!message.content.some((b) => "thoughtSignature" in b)) {
            const result = [...message.content];
            for (let i = result.length - 1; i >= 0; i--) {
              const block = result[i];
              if (block.type === "text" && !block.thought) {
                block.thoughtSignature = originalBlock.thoughtSignature;
                return result;
              }
            }
          }
        }
        return message.content;
      }
    });
    for (const block of content) {
      const contentBlockBase = iife(() => {
        if (_isContentBlock(block, "text") && _isString(block.text))
          return {
            type: "text",
            text: block.text
          };
        else if (_isContentBlock(block, "inlineData") && _isObject(block.inlineData) && _isString(block.inlineData.mimeType) && _isString(block.inlineData.data))
          return {
            type: "file",
            mimeType: block.inlineData.mimeType,
            data: block.inlineData.data
          };
        else if (_isContentBlock(block, "functionCall") && _isObject(block.functionCall) && _isString(block.functionCall.name) && _isObject(block.functionCall.args))
          return {
            type: "tool_call",
            id: message.id,
            name: block.functionCall.name,
            args: block.functionCall.args
          };
        else if (_isContentBlock(block, "functionResponse"))
          return {
            type: "non_standard",
            value: block
          };
        else if (_isContentBlock(block, "fileData") && _isObject(block.fileData) && _isString(block.fileData.mimeType) && _isString(block.fileData.fileUri))
          return {
            type: "file",
            mimeType: block.fileData.mimeType,
            fileId: block.fileData.fileUri
          };
        else if (_isContentBlock(block, "executableCode"))
          return {
            type: "non_standard",
            value: block
          };
        else if (_isContentBlock(block, "codeExecutionResult"))
          return {
            type: "non_standard",
            value: block
          };
        return {
          type: "non_standard",
          value: block
        };
      });
      const contentBlock = iife(() => {
        if ("thought" in block && block.thought)
          return {
            type: "reasoning",
            reasoning: contentBlockBase.type === "text" ? contentBlockBase.text : "",
            reasoningContentBlock: contentBlockBase
          };
        else
          return contentBlockBase;
      });
      const ret = {
        thought: block.thought,
        thoughtSignature: block.thoughtSignature,
        partMetadata: block.partMetadata,
        ...contentBlock
      };
      for (const attribute in ret)
        if (ret[attribute] === void 0)
          delete ret[attribute];
      yield ret;
    }
  }
  return Array.from(iterateContent());
}
var ChatGoogleTranslator = {
  translateContent: convertToV1FromChatGoogleMessage2,
  translateContentChunk: convertToV1FromChatGoogleMessage2
};

// ../../node_modules/@langchain/core/dist/messages/block_translators/index.js
globalThis.lc_block_translators_registry ??= /* @__PURE__ */ new Map([
  ["anthropic", ChatAnthropicTranslator],
  ["bedrock-converse", ChatBedrockConverseTranslator],
  ["deepseek", ChatDeepSeekTranslator],
  ["google", ChatGoogleTranslator],
  ["google-genai", ChatGoogleGenAITranslator],
  ["google-vertexai", ChatVertexTranslator],
  ["groq", ChatGroqTranslator],
  ["ollama", ChatOllamaTranslator],
  ["openai", ChatOpenAITranslator],
  ["openrouter", ChatOpenRouterTranslator],
  ["xai", ChatXAITranslator]
]);
function getTranslator(modelProvider) {
  return globalThis.lc_block_translators_registry.get(modelProvider);
}

// ../../node_modules/@langchain/core/dist/messages/metadata.js
function mergeResponseMetadata(a, b) {
  return _mergeDicts(a, b) ?? {};
}
function mergeModalitiesTokenDetails(a, b) {
  const output = {};
  if (a?.audio !== void 0 || b?.audio !== void 0)
    output.audio = (a?.audio ?? 0) + (b?.audio ?? 0);
  if (a?.image !== void 0 || b?.image !== void 0)
    output.image = (a?.image ?? 0) + (b?.image ?? 0);
  if (a?.video !== void 0 || b?.video !== void 0)
    output.video = (a?.video ?? 0) + (b?.video ?? 0);
  if (a?.document !== void 0 || b?.document !== void 0)
    output.document = (a?.document ?? 0) + (b?.document ?? 0);
  if (a?.text !== void 0 || b?.text !== void 0)
    output.text = (a?.text ?? 0) + (b?.text ?? 0);
  return output;
}
function mergeInputTokenDetails(a, b) {
  const output = { ...mergeModalitiesTokenDetails(a, b) };
  if (a?.cache_read !== void 0 || b?.cache_read !== void 0)
    output.cache_read = (a?.cache_read ?? 0) + (b?.cache_read ?? 0);
  if (a?.cache_creation !== void 0 || b?.cache_creation !== void 0)
    output.cache_creation = (a?.cache_creation ?? 0) + (b?.cache_creation ?? 0);
  return output;
}
function mergeOutputTokenDetails(a, b) {
  const output = { ...mergeModalitiesTokenDetails(a, b) };
  if (a?.reasoning !== void 0 || b?.reasoning !== void 0)
    output.reasoning = (a?.reasoning ?? 0) + (b?.reasoning ?? 0);
  return output;
}
function mergeUsageMetadata(a, b) {
  return {
    input_tokens: (a?.input_tokens ?? 0) + (b?.input_tokens ?? 0),
    output_tokens: (a?.output_tokens ?? 0) + (b?.output_tokens ?? 0),
    total_tokens: (a?.total_tokens ?? 0) + (b?.total_tokens ?? 0),
    input_token_details: mergeInputTokenDetails(a?.input_token_details, b?.input_token_details),
    output_token_details: mergeOutputTokenDetails(a?.output_token_details, b?.output_token_details)
  };
}

// ../../node_modules/@langchain/core/dist/messages/ai.js
var AIMessage = class extends BaseMessage {
  type = "ai";
  tool_calls = [];
  invalid_tool_calls = [];
  usage_metadata;
  get lc_aliases() {
    return {
      ...super.lc_aliases,
      tool_calls: "tool_calls",
      invalid_tool_calls: "invalid_tool_calls",
      usage_metadata: "usage_metadata"
    };
  }
  constructor(fields) {
    let initParams;
    if (typeof fields === "string" || Array.isArray(fields))
      initParams = {
        content: fields,
        tool_calls: [],
        invalid_tool_calls: [],
        additional_kwargs: {}
      };
    else {
      initParams = fields;
      const rawToolCalls = initParams.additional_kwargs?.tool_calls;
      const toolCalls = initParams.tool_calls;
      if (!(rawToolCalls == null) && rawToolCalls.length > 0 && (toolCalls === void 0 || toolCalls.length === 0))
        console.warn([
          "New LangChain packages are available that more efficiently handle",
          "tool calling.\n\nPlease upgrade your packages to versions that set",
          "message tool calls. e.g., `pnpm install @langchain/anthropic`,",
          "pnpm install @langchain/openai`, etc."
        ].join(" "));
      try {
        if (!(rawToolCalls == null) && toolCalls === void 0) {
          const [parsedToolCalls, invalidToolCalls] = defaultToolCallParser(rawToolCalls);
          initParams.tool_calls = parsedToolCalls ?? [];
          initParams.invalid_tool_calls = invalidToolCalls ?? [];
        } else {
          initParams.tool_calls = initParams.tool_calls ?? [];
          initParams.invalid_tool_calls = initParams.invalid_tool_calls ?? [];
        }
      } catch {
        initParams.tool_calls = [];
        initParams.invalid_tool_calls = [];
      }
      if (initParams.response_metadata !== void 0 && "output_version" in initParams.response_metadata && initParams.response_metadata.output_version === "v1") {
        initParams.contentBlocks = initParams.content;
        initParams.content = void 0;
      }
      if (initParams.contentBlocks !== void 0) {
        if (initParams.tool_calls) {
          const missingContentBlockToolCalls = initParams.tool_calls.filter((toolCall) => !initParams.contentBlocks?.some((block) => block.type === "tool_call" && block.id === toolCall.id && block.name === toolCall.name));
          initParams.contentBlocks.push(...missingContentBlockToolCalls.map((toolCall) => ({
            type: "tool_call",
            id: toolCall.id,
            name: toolCall.name,
            args: toolCall.args
          })));
        }
        const missingToolCalls = initParams.contentBlocks.filter((block) => block.type === "tool_call").filter((block) => !initParams.tool_calls?.some((toolCall) => toolCall.id === block.id && toolCall.name === block.name));
        if (missingToolCalls.length > 0)
          initParams.tool_calls = [...initParams.tool_calls ?? [], ...missingToolCalls.map((block) => ({
            type: "tool_call",
            id: block.id,
            name: block.name,
            args: block.args
          }))];
      }
    }
    super(initParams);
    if (typeof initParams !== "string") {
      this.tool_calls = initParams.tool_calls ?? this.tool_calls;
      this.invalid_tool_calls = initParams.invalid_tool_calls ?? this.invalid_tool_calls;
    }
    this.usage_metadata = initParams.usage_metadata;
  }
  static lc_name() {
    return "AIMessage";
  }
  get contentBlocks() {
    if (this.response_metadata && "output_version" in this.response_metadata && this.response_metadata.output_version === "v1")
      return this.content;
    if (this.response_metadata && "model_provider" in this.response_metadata && typeof this.response_metadata.model_provider === "string") {
      const translator = getTranslator(this.response_metadata.model_provider);
      if (translator)
        return translator.translateContent(this);
    }
    const blocks = super.contentBlocks;
    if (this.tool_calls) {
      const missingToolCalls = this.tool_calls.filter((block) => !blocks.some((b) => b.id === block.id && b.name === block.name));
      blocks.push(...missingToolCalls.map((block) => ({
        type: "tool_call",
        id: block.id,
        name: block.name,
        args: block.args
      })));
    }
    return blocks;
  }
  get _printableFields() {
    return {
      ...super._printableFields,
      tool_calls: this.tool_calls,
      invalid_tool_calls: this.invalid_tool_calls,
      usage_metadata: this.usage_metadata
    };
  }
  static isInstance(obj) {
    return super.isInstance(obj) && obj.type === "ai";
  }
};
var AIMessageChunk = class extends BaseMessageChunk {
  type = "ai";
  tool_calls = [];
  invalid_tool_calls = [];
  tool_call_chunks = [];
  usage_metadata;
  constructor(fields) {
    let initParams;
    if (typeof fields === "string" || Array.isArray(fields))
      initParams = {
        content: fields,
        tool_calls: [],
        invalid_tool_calls: [],
        tool_call_chunks: []
      };
    else if (fields.tool_call_chunks === void 0 || fields.tool_call_chunks.length === 0)
      initParams = {
        ...fields,
        tool_calls: fields.tool_calls ?? [],
        invalid_tool_calls: [],
        tool_call_chunks: [],
        usage_metadata: fields.usage_metadata !== void 0 ? fields.usage_metadata : void 0
      };
    else {
      const collapsed = collapseToolCallChunks(fields.tool_call_chunks ?? []);
      initParams = {
        ...fields,
        tool_call_chunks: collapsed.tool_call_chunks,
        tool_calls: collapsed.tool_calls,
        invalid_tool_calls: collapsed.invalid_tool_calls,
        usage_metadata: fields.usage_metadata !== void 0 ? fields.usage_metadata : void 0
      };
    }
    super(initParams);
    this.tool_call_chunks = initParams.tool_call_chunks ?? this.tool_call_chunks;
    this.tool_calls = initParams.tool_calls ?? this.tool_calls;
    this.invalid_tool_calls = initParams.invalid_tool_calls ?? this.invalid_tool_calls;
    this.usage_metadata = initParams.usage_metadata;
  }
  get lc_aliases() {
    return {
      ...super.lc_aliases,
      tool_calls: "tool_calls",
      invalid_tool_calls: "invalid_tool_calls",
      tool_call_chunks: "tool_call_chunks",
      usage_metadata: "usage_metadata"
    };
  }
  static lc_name() {
    return "AIMessageChunk";
  }
  get contentBlocks() {
    if (this.response_metadata && "output_version" in this.response_metadata && this.response_metadata.output_version === "v1")
      return this.content;
    if (this.response_metadata && "model_provider" in this.response_metadata && typeof this.response_metadata.model_provider === "string") {
      const translator = getTranslator(this.response_metadata.model_provider);
      if (translator)
        return translator.translateContent(this);
    }
    const blocks = super.contentBlocks;
    if (this.tool_calls) {
      if (typeof this.content !== "string") {
        const contentToolCalls = this.content.filter((block) => block.type === "tool_call").map((block) => block.id);
        for (const toolCall of this.tool_calls)
          if (toolCall.id && !contentToolCalls.includes(toolCall.id))
            blocks.push({
              ...toolCall,
              type: "tool_call",
              id: toolCall.id,
              name: toolCall.name,
              args: toolCall.args
            });
      }
    }
    return blocks;
  }
  get _printableFields() {
    return {
      ...super._printableFields,
      tool_calls: this.tool_calls,
      tool_call_chunks: this.tool_call_chunks,
      invalid_tool_calls: this.invalid_tool_calls,
      usage_metadata: this.usage_metadata
    };
  }
  concat(chunk) {
    const combinedFields = {
      content: mergeContent(this.content, chunk.content),
      additional_kwargs: _mergeDicts(this.additional_kwargs, chunk.additional_kwargs),
      response_metadata: mergeResponseMetadata(this.response_metadata, chunk.response_metadata),
      tool_call_chunks: [],
      tool_calls: [],
      id: this.id ?? chunk.id
    };
    if (this.tool_call_chunks !== void 0 || chunk.tool_call_chunks !== void 0) {
      const rawToolCalls = _mergeLists(this.tool_call_chunks, chunk.tool_call_chunks);
      if (rawToolCalls !== void 0 && rawToolCalls.length > 0)
        combinedFields.tool_call_chunks = rawToolCalls;
    }
    if (this.tool_calls !== void 0 || chunk.tool_calls !== void 0) {
      const rawToolCalls = _mergeLists(this.tool_calls, chunk.tool_calls);
      if (rawToolCalls !== void 0 && rawToolCalls.length > 0)
        combinedFields.tool_calls = rawToolCalls;
    }
    if (this.usage_metadata !== void 0 || chunk.usage_metadata !== void 0)
      combinedFields.usage_metadata = mergeUsageMetadata(this.usage_metadata, chunk.usage_metadata);
    const Cls = this.constructor;
    return new Cls(combinedFields);
  }
  static isInstance(obj) {
    return super.isInstance(obj) && obj.type === "ai";
  }
};

// ../../node_modules/@langchain/core/dist/messages/utils.js
function chunkUsesRawInputArgs(chunk) {
  return chunk.isCustomTool === true;
}
function _contentBlockToString(block) {
  if (typeof block === "string")
    return block;
  switch (block.type) {
    case "text":
      return block.text ?? "";
    case "text-plain":
      return block.text ?? "[text-plain file]";
    case "image":
    case "image_url":
      return "[image]";
    case "audio":
    case "input_audio":
      return "[audio]";
    case "video":
      return "[video]";
    case "file":
      return "[file]";
    case "reasoning":
    case "tool_call":
    case "tool_call_chunk":
    case "invalid_tool_call":
    case "server_tool_call":
    case "server_tool_call_chunk":
    case "server_tool_call_result":
    case "non_standard":
      return "";
    default:
      return block.type ? `[${block.type}]` : "";
  }
}
function getBufferString(messages, humanPrefix = "Human", aiPrefix = "AI") {
  const string_messages = [];
  for (const m of messages) {
    let role;
    if (m.type === "human")
      role = humanPrefix;
    else if (m.type === "ai")
      role = aiPrefix;
    else if (m.type === "system")
      role = "System";
    else if (m.type === "tool")
      role = "Tool";
    else if (m.type === "generic")
      role = m.role;
    else
      throw new Error(`Got unsupported message type: ${m.type}`);
    const nameStr = m.name ? `${m.name}, ` : "";
    const readableContent = typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.map(_contentBlockToString).filter(Boolean).join("") : "";
    let message = `${role}: ${nameStr}${readableContent}`;
    if (m.type === "ai") {
      const aiMessage = m;
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0)
        message += JSON.stringify(aiMessage.tool_calls);
      else if (aiMessage.additional_kwargs && "function_call" in aiMessage.additional_kwargs)
        message += JSON.stringify(aiMessage.additional_kwargs.function_call);
    }
    string_messages.push(message);
  }
  return string_messages.join("\n");
}
function collapseToolCallChunks(chunks) {
  const groupedToolCallChunks = chunks.reduce((acc, chunk) => {
    const matchedChunkIndex = acc.findIndex(([match]) => {
      if ("id" in chunk && chunk.id && "index" in chunk && chunk.index !== void 0)
        return chunk.id === match.id && chunk.index === match.index;
      if ("id" in chunk && chunk.id)
        return chunk.id === match.id;
      if ("index" in chunk && chunk.index !== void 0)
        return chunk.index === match.index;
      return false;
    });
    if (matchedChunkIndex !== -1)
      acc[matchedChunkIndex].push(chunk);
    else
      acc.push([chunk]);
    return acc;
  }, []);
  const toolCalls = [];
  const invalidToolCalls = [];
  for (const chunks2 of groupedToolCallChunks) {
    let parsedArgs = null;
    const usesRawInputArgs = chunks2.some(chunkUsesRawInputArgs);
    const name = chunks2[0]?.name ?? "";
    const joinedArgsRaw = chunks2.map((c) => c.args || "").join("");
    const joinedArgs = usesRawInputArgs ? joinedArgsRaw : joinedArgsRaw.trim();
    const argsStr = joinedArgs.length ? joinedArgs : "{}";
    const id = chunks2.find((c) => c.id)?.id ?? chunks2[0]?.id;
    if (usesRawInputArgs && id) {
      toolCalls.push({
        name,
        args: { input: joinedArgs },
        id,
        type: "tool_call"
      });
      continue;
    }
    try {
      parsedArgs = parsePartialJson(argsStr);
      if (!id || parsedArgs === null || typeof parsedArgs !== "object" || Array.isArray(parsedArgs))
        throw new Error("Malformed tool call chunk args.");
      toolCalls.push({
        name,
        args: parsedArgs,
        id,
        type: "tool_call"
      });
    } catch {
      invalidToolCalls.push({
        name,
        args: argsStr,
        id,
        error: "Malformed args.",
        type: "invalid_tool_call"
      });
    }
  }
  return {
    tool_call_chunks: chunks,
    tool_calls: toolCalls,
    invalid_tool_calls: invalidToolCalls
  };
}

// ../../node_modules/@langchain/core/dist/utils/env.js
var isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
var isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
var isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");
var isDeno = () => typeof Deno !== "undefined";
var isNode = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno();
var getEnv = () => {
  let env;
  if (isBrowser())
    env = "browser";
  else if (isNode())
    env = "node";
  else if (isWebWorker())
    env = "webworker";
  else if (isJsDom())
    env = "jsdom";
  else if (isDeno())
    env = "deno";
  else
    env = "other";
  return env;
};
var runtimeEnvironment;
function getRuntimeEnvironment() {
  if (runtimeEnvironment === void 0)
    runtimeEnvironment = {
      library: "langchain-js",
      runtime: getEnv()
    };
  return runtimeEnvironment;
}
function getEnvironmentVariable(name) {
  try {
    if (typeof process !== "undefined")
      return process.env?.[name];
    else if (isDeno())
      return Deno?.env.get(name);
    else
      return;
  } catch {
    return;
  }
}

// ../../node_modules/@langchain/core/dist/callbacks/base.js
var BaseCallbackHandlerMethodsClass = class {
};
var BaseCallbackHandler = class extends BaseCallbackHandlerMethodsClass {
  lc_serializable = false;
  get lc_namespace() {
    return [
      "langchain_core",
      "callbacks",
      this.name
    ];
  }
  get lc_secrets() {
  }
  get lc_attributes() {
  }
  get lc_aliases() {
  }
  get lc_serializable_keys() {
  }
  /**
  * The name of the serializable. Override to provide an alias or
  * to preserve the serialized module name in minified environments.
  *
  * Implemented as a static method to support loading logic.
  */
  static lc_name() {
    return this.name;
  }
  /**
  * The final serialized identifier for the module.
  */
  get lc_id() {
    return [...this.lc_namespace, get_lc_unique_name(this.constructor)];
  }
  lc_kwargs;
  ignoreLLM = false;
  ignoreChain = false;
  ignoreAgent = false;
  ignoreRetriever = false;
  ignoreCustomEvent = false;
  raiseError = false;
  awaitHandlers = getEnvironmentVariable("LANGCHAIN_CALLBACKS_BACKGROUND") === "false";
  constructor(input) {
    super();
    this.lc_kwargs = input || {};
    if (input) {
      this.ignoreLLM = input.ignoreLLM ?? this.ignoreLLM;
      this.ignoreChain = input.ignoreChain ?? this.ignoreChain;
      this.ignoreAgent = input.ignoreAgent ?? this.ignoreAgent;
      this.ignoreRetriever = input.ignoreRetriever ?? this.ignoreRetriever;
      this.ignoreCustomEvent = input.ignoreCustomEvent ?? this.ignoreCustomEvent;
      this.raiseError = input.raiseError ?? this.raiseError;
      this.awaitHandlers = this.raiseError || (input._awaitHandler ?? this.awaitHandlers);
    }
  }
  copy() {
    return new this.constructor(this);
  }
  toJSON() {
    return Serializable.prototype.toJSON.call(this);
  }
  toJSONNotImplemented() {
    return Serializable.prototype.toJSONNotImplemented.call(this);
  }
  static fromMethods(methods) {
    class Handler extends BaseCallbackHandler {
      name = v72();
      constructor() {
        super();
        Object.assign(this, methods);
      }
    }
    return new Handler();
  }
};
var isBaseCallbackHandler = (x) => {
  const callbackHandler = x;
  return callbackHandler !== void 0 && typeof callbackHandler.copy === "function" && typeof callbackHandler.name === "string" && typeof callbackHandler.awaitHandlers === "boolean";
};

// ../../node_modules/langsmith/dist/utils/uuid/src/regex.js
var regex_default2 = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

// ../../node_modules/langsmith/dist/utils/uuid/src/validate.js
function validate3(uuid2) {
  return typeof uuid2 === "string" && regex_default2.test(uuid2);
}
var validate_default = validate3;

// ../../node_modules/langsmith/dist/utils/uuid/src/parse.js
function parse2(uuid2) {
  if (!validate_default(uuid2)) {
    throw TypeError("Invalid UUID");
  }
  let v;
  return Uint8Array.of(
    (v = parseInt(uuid2.slice(0, 8), 16)) >>> 24,
    v >>> 16 & 255,
    v >>> 8 & 255,
    v & 255,
    // Parse ........-####-....-....-............
    (v = parseInt(uuid2.slice(9, 13), 16)) >>> 8,
    v & 255,
    // Parse ........-....-####-....-............
    (v = parseInt(uuid2.slice(14, 18), 16)) >>> 8,
    v & 255,
    // Parse ........-....-....-####-............
    (v = parseInt(uuid2.slice(19, 23), 16)) >>> 8,
    v & 255,
    // Parse ........-....-....-....-############
    // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)
    (v = parseInt(uuid2.slice(24, 36), 16)) / 1099511627776 & 255,
    v / 4294967296 & 255,
    v >>> 24 & 255,
    v >>> 16 & 255,
    v >>> 8 & 255,
    v & 255
  );
}
var parse_default = parse2;

// ../../node_modules/langsmith/dist/utils/uuid/src/stringify.js
var byteToHex2 = [];
for (let i = 0; i < 256; ++i) {
  byteToHex2.push((i + 256).toString(16).slice(1));
}
function unsafeStringify2(arr2, offset = 0) {
  return (byteToHex2[arr2[offset + 0]] + byteToHex2[arr2[offset + 1]] + byteToHex2[arr2[offset + 2]] + byteToHex2[arr2[offset + 3]] + "-" + byteToHex2[arr2[offset + 4]] + byteToHex2[arr2[offset + 5]] + "-" + byteToHex2[arr2[offset + 6]] + byteToHex2[arr2[offset + 7]] + "-" + byteToHex2[arr2[offset + 8]] + byteToHex2[arr2[offset + 9]] + "-" + byteToHex2[arr2[offset + 10]] + byteToHex2[arr2[offset + 11]] + byteToHex2[arr2[offset + 12]] + byteToHex2[arr2[offset + 13]] + byteToHex2[arr2[offset + 14]] + byteToHex2[arr2[offset + 15]]).toLowerCase();
}

// ../../node_modules/langsmith/dist/utils/uuid/src/rng.js
var rnds82 = new Uint8Array(16);
function rng2() {
  return crypto.getRandomValues(rnds82);
}

// ../../node_modules/langsmith/dist/utils/uuid/src/v4.js
function v43(options, buf, offset) {
  if (!buf && !options && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return _v42(options, buf, offset);
}
function _v42(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng2();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify2(rnds);
}
var v4_default = v43;

// ../../node_modules/langsmith/dist/utils/uuid/src/sha1.js
function f2(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;
    case 1:
      return x ^ y ^ z;
    case 2:
      return x & y ^ x & z ^ y & z;
    case 3:
      return x ^ y ^ z;
  }
}
function ROTL2(x, n2) {
  return x << n2 | x >>> 32 - n2;
}
function sha12(bytes) {
  const K = [1518500249, 1859775393, 2400959708, 3395469782];
  const H = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
  const newBytes = new Uint8Array(bytes.length + 1);
  newBytes.set(bytes);
  newBytes[bytes.length] = 128;
  bytes = newBytes;
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);
  for (let i = 0; i < N; ++i) {
    const arr2 = new Uint32Array(16);
    for (let j = 0; j < 16; ++j) {
      arr2[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }
    M[i] = arr2;
  }
  M[N - 1][14] = (bytes.length - 1) * 8 / 2 ** 32;
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 4294967295;
  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);
    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }
    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL2(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL2(a, 5) + f2(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL2(b, 30) >>> 0;
      b = a;
      a = T;
    }
    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }
  return Uint8Array.of(H[0] >> 24, H[0] >> 16, H[0] >> 8, H[0], H[1] >> 24, H[1] >> 16, H[1] >> 8, H[1], H[2] >> 24, H[2] >> 16, H[2] >> 8, H[2], H[3] >> 24, H[3] >> 16, H[3] >> 8, H[3], H[4] >> 24, H[4] >> 16, H[4] >> 8, H[4]);
}
var sha1_default = sha12;

// ../../node_modules/langsmith/dist/utils/uuid/src/v35.js
function stringToBytes2(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
var DNS2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
var URL3 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
function v352(version3, hash, value, namespace, buf, offset) {
  const valueBytes = typeof value === "string" ? stringToBytes2(value) : value;
  const namespaceBytes = typeof namespace === "string" ? parse_default(namespace) : namespace;
  if (typeof namespace === "string") {
    namespace = parse_default(namespace);
  }
  if (namespace?.length !== 16) {
    throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
  }
  let bytes = new Uint8Array(16 + valueBytes.length);
  bytes.set(namespaceBytes);
  bytes.set(valueBytes, namespaceBytes.length);
  bytes = hash(bytes);
  bytes[6] = bytes[6] & 15 | version3;
  bytes[8] = bytes[8] & 63 | 128;
  if (buf) {
    offset ??= 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = bytes[i];
    }
    return buf;
  }
  return unsafeStringify2(bytes);
}

// ../../node_modules/langsmith/dist/utils/uuid/src/v5.js
function v52(value, namespace, buf, offset) {
  return v352(80, sha1_default, value, namespace, buf, offset);
}
v52.DNS = DNS2;
v52.URL = URL3;
var v5_default = v52;

// ../../node_modules/langsmith/dist/utils/uuid/src/v7.js
var _state2 = {};
function v73(options, buf, offset) {
  let bytes;
  if (options) {
    bytes = v7Bytes2(options.random ?? options.rng?.() ?? rng2(), options.msecs, options.seq, buf, offset);
  } else {
    const now = Date.now();
    const rnds = rng2();
    updateV7State2(_state2, now, rnds);
    bytes = v7Bytes2(rnds, _state2.msecs, _state2.seq, buf, offset);
  }
  return buf ?? unsafeStringify2(bytes);
}
function updateV7State2(state, now, rnds) {
  state.msecs ??= -Infinity;
  state.seq ??= 0;
  if (now > state.msecs) {
    state.seq = rnds[6] << 23 | rnds[7] << 16 | rnds[8] << 8 | rnds[9];
    state.msecs = now;
  } else {
    state.seq = state.seq + 1 | 0;
    if (state.seq === 0) {
      state.msecs++;
    }
  }
  return state;
}
function v7Bytes2(rnds, msecs, seq, buf, offset = 0) {
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  if (!buf) {
    buf = new Uint8Array(16);
    offset = 0;
  } else {
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
  }
  msecs ??= Date.now();
  seq ??= rnds[6] * 127 << 24 | rnds[7] << 16 | rnds[8] << 8 | rnds[9];
  buf[offset++] = msecs / 1099511627776 & 255;
  buf[offset++] = msecs / 4294967296 & 255;
  buf[offset++] = msecs / 16777216 & 255;
  buf[offset++] = msecs / 65536 & 255;
  buf[offset++] = msecs / 256 & 255;
  buf[offset++] = msecs & 255;
  buf[offset++] = 112 | seq >>> 28 & 15;
  buf[offset++] = seq >>> 20 & 255;
  buf[offset++] = 128 | seq >>> 14 & 63;
  buf[offset++] = seq >>> 6 & 255;
  buf[offset++] = seq << 2 & 255 | rnds[10] & 3;
  buf[offset++] = rnds[11];
  buf[offset++] = rnds[12];
  buf[offset++] = rnds[13];
  buf[offset++] = rnds[14];
  buf[offset++] = rnds[15];
  return buf;
}
var v7_default = v73;

// ../../node_modules/langsmith/dist/experimental/otel/constants.js
var GEN_AI_OPERATION_NAME = "gen_ai.operation.name";
var GEN_AI_SYSTEM = "gen_ai.system";
var GEN_AI_REQUEST_MODEL = "gen_ai.request.model";
var GEN_AI_RESPONSE_MODEL = "gen_ai.response.model";
var GEN_AI_USAGE_INPUT_TOKENS = "gen_ai.usage.input_tokens";
var GEN_AI_USAGE_OUTPUT_TOKENS = "gen_ai.usage.output_tokens";
var GEN_AI_USAGE_TOTAL_TOKENS = "gen_ai.usage.total_tokens";
var GEN_AI_REQUEST_MAX_TOKENS = "gen_ai.request.max_tokens";
var GEN_AI_REQUEST_TEMPERATURE = "gen_ai.request.temperature";
var GEN_AI_REQUEST_TOP_P = "gen_ai.request.top_p";
var GEN_AI_REQUEST_FREQUENCY_PENALTY = "gen_ai.request.frequency_penalty";
var GEN_AI_REQUEST_PRESENCE_PENALTY = "gen_ai.request.presence_penalty";
var GEN_AI_RESPONSE_FINISH_REASONS = "gen_ai.response.finish_reasons";
var GENAI_PROMPT = "gen_ai.prompt";
var GENAI_COMPLETION = "gen_ai.completion";
var GEN_AI_REQUEST_EXTRA_QUERY = "gen_ai.request.extra_query";
var GEN_AI_REQUEST_EXTRA_BODY = "gen_ai.request.extra_body";
var GEN_AI_SERIALIZED_NAME = "gen_ai.serialized.name";
var GEN_AI_SERIALIZED_SIGNATURE = "gen_ai.serialized.signature";
var GEN_AI_SERIALIZED_DOC = "gen_ai.serialized.doc";
var GEN_AI_RESPONSE_ID = "gen_ai.response.id";
var GEN_AI_RESPONSE_SERVICE_TIER = "gen_ai.response.service_tier";
var GEN_AI_RESPONSE_SYSTEM_FINGERPRINT = "gen_ai.response.system_fingerprint";
var GEN_AI_USAGE_INPUT_TOKEN_DETAILS = "gen_ai.usage.input_token_details";
var GEN_AI_USAGE_OUTPUT_TOKEN_DETAILS = "gen_ai.usage.output_token_details";
var LANGSMITH_SESSION_ID = "langsmith.trace.session_id";
var LANGSMITH_SESSION_NAME = "langsmith.trace.session_name";
var LANGSMITH_RUN_TYPE = "langsmith.span.kind";
var LANGSMITH_NAME = "langsmith.trace.name";
var LANGSMITH_METADATA = "langsmith.metadata";
var LANGSMITH_TAGS = "langsmith.span.tags";
var LANGSMITH_REQUEST_STREAMING = "langsmith.request.streaming";
var LANGSMITH_REQUEST_HEADERS = "langsmith.request.headers";
var LANGSMITH_USAGE_METADATA = "langsmith.usage_metadata";

// ../../node_modules/langsmith/dist/singletons/fetch.js
var DEFAULT_FETCH_IMPLEMENTATION = (...args) => fetch(...args);
var globalFetchSupportsWebStreaming = void 0;
var LANGSMITH_FETCH_IMPLEMENTATION_KEY = Symbol.for("ls:fetch_implementation");
var _shouldStreamForGlobalFetchImplementation = () => {
  const overriddenFetchImpl = globalThis[LANGSMITH_FETCH_IMPLEMENTATION_KEY];
  if (overriddenFetchImpl === void 0) {
    return true;
  }
  return globalFetchSupportsWebStreaming ?? false;
};
var _getFetchImplementation = (debug) => {
  return async (...args) => {
    if (debug || getLangSmithEnvironmentVariable("DEBUG") === "true") {
      const [url, options] = args;
      console.log(`\u2192 ${options?.method || "GET"} ${url}`);
    }
    const res = await (globalThis[LANGSMITH_FETCH_IMPLEMENTATION_KEY] ?? DEFAULT_FETCH_IMPLEMENTATION)(...args);
    if (debug || getLangSmithEnvironmentVariable("DEBUG") === "true") {
      console.log(`\u2190 ${res.status} ${res.statusText} ${res.url}`);
    }
    return res;
  };
};

// ../../node_modules/langsmith/dist/utils/project.js
var getDefaultProjectName = () => {
  return getLangSmithEnvironmentVariable("PROJECT") ?? getEnvironmentVariable2("LANGCHAIN_SESSION") ?? // TODO: Deprecate
  "default";
};

// ../../node_modules/langsmith/dist/utils/warn.js
var warnedMessages = {};
function warnOnce(message) {
  if (!warnedMessages[message]) {
    console.warn(message);
    warnedMessages[message] = true;
  }
}

// ../../node_modules/langsmith/dist/utils/xxhash/xxhash.js
var n = (n2) => BigInt(n2);
var PRIME32_1 = n("0x9E3779B1");
var PRIME32_2 = n("0x85EBCA77");
var PRIME32_3 = n("0xC2B2AE3D");
var PRIME64_1 = n("0x9E3779B185EBCA87");
var PRIME64_2 = n("0xC2B2AE3D27D4EB4F");
var PRIME64_3 = n("0x165667B19E3779F9");
var PRIME64_4 = n("0x85EBCA77C2B2AE63");
var PRIME64_5 = n("0x27D4EB2F165667C5");
var PRIME_MX1 = n("0x165667919E3779F9");
var PRIME_MX2 = n("0x9FB21C651E98DF25");
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
var kkey = hexToBytes("b8fe6c3923a44bbe7c01812cf721ad1cded46de9839097db7240a4a4b7b3671fcb79e64eccc0e578825ad07dccff7221b8084674f743248ee03590e6813a264c3c2852bb91c300cb88d0658b1b532ea371644897a20df94e3819ef46a9deacd8a8fa763fe39c343ff9dcbbc7c70b4f1d8a51e04bcdb45931c89f7ec9d9787364eac5ac8334d3ebc3c581a0fffa1363eb170ddd51b7f0da49d316552629d4689e2b16be587d47a1fc8ff8b8d17ad031ce45cb3a8f95160428afd7fbcabb4b407e");
var mask128 = (n(1) << n(128)) - n(1);
var mask64 = (n(1) << n(64)) - n(1);
var mask32 = (n(1) << n(32)) - n(1);
var STRIPE_LEN = 64;
var ACC_NB = STRIPE_LEN / 8;
var _U64 = 8;
var _U32 = 4;
function getView(buf, offset = 0) {
  return new Uint8Array(buf.buffer, buf.byteOffset + offset, buf.length - offset);
}
function readBigUInt64LE(buf, offset = 0) {
  const view = new DataView(buf.buffer, buf.byteOffset + offset);
  return view.getBigUint64(0, true);
}
function readUInt32LE(buf, offset = 0) {
  const view = new DataView(buf.buffer, buf.byteOffset + offset);
  return view.getUint32(0, true);
}
function readUInt8(buf, offset = 0) {
  return buf[offset];
}
var bswap64 = (a) => {
  return (a & n(255)) << n(56) | (a & n(65280)) << n(40) | (a & n(16711680)) << n(24) | (a & n(4278190080)) << n(8) | (a & n(1095216660480)) >> n(8) | (a & n(280375465082880)) >> n(24) | (a & n(71776119061217280)) >> n(40) | (a & n(18374686479671624e3)) >> n(56);
};
var bswap32 = (a) => {
  a = (a & n(65535)) << n(16) | (a & n(4294901760)) >> n(16);
  a = (a & n(16711935)) << n(8) | (a & n(4278255360)) >> n(8);
  return a;
};
var XXH_mult32to64 = (a, b) => (a & mask32) * (b & mask32) & mask64;
var assert = (a) => {
  if (!a)
    throw new Error("Assert failed");
};
function rotl32(a, b) {
  return (a << b | a >> n(32) - b) & mask32;
}
function XXH3_accumulate_512(acc, data, key) {
  for (let i = 0; i < ACC_NB; i++) {
    const data_val = readBigUInt64LE(data, i * 8);
    const data_key = data_val ^ readBigUInt64LE(key, i * 8);
    acc[i ^ 1] += data_val;
    acc[i] += XXH_mult32to64(data_key, data_key >> n(32));
  }
  return acc;
}
function XXH3_accumulate(acc, data, key, nbStripes) {
  for (let n2 = 0; n2 < nbStripes; n2++) {
    XXH3_accumulate_512(acc, getView(data, n2 * STRIPE_LEN), getView(key, n2 * 8));
  }
  return acc;
}
function XXH3_scrambleAcc(acc, key) {
  for (let i = 0; i < ACC_NB; i++) {
    const key64 = readBigUInt64LE(key, i * 8);
    let acc64 = acc[i];
    acc64 = xorshift64(acc64, n(47));
    acc64 ^= key64;
    acc64 *= PRIME32_1;
    acc[i] = acc64 & mask64;
  }
  return acc;
}
function XXH3_mix2Accs(acc, key) {
  return XXH3_mul128_fold64(acc[0] ^ readBigUInt64LE(key, 0), acc[1] ^ readBigUInt64LE(key, _U64));
}
function XXH3_mergeAccs(acc, key, start) {
  let result64 = start;
  result64 += XXH3_mix2Accs(acc.slice(0), getView(key, 0 * _U32));
  result64 += XXH3_mix2Accs(acc.slice(2), getView(key, 4 * _U32));
  result64 += XXH3_mix2Accs(acc.slice(4), getView(key, 8 * _U32));
  result64 += XXH3_mix2Accs(acc.slice(6), getView(key, 12 * _U32));
  return XXH3_avalanche(result64 & mask64);
}
function XXH3_hashLong(acc, data, secret, f_acc, f_scramble) {
  const nbStripesPerBlock = Math.floor((secret.byteLength - STRIPE_LEN) / 8);
  const block_len = STRIPE_LEN * nbStripesPerBlock;
  const nb_blocks = Math.floor((data.byteLength - 1) / block_len);
  for (let n2 = 0; n2 < nb_blocks; n2++) {
    acc = XXH3_accumulate(acc, getView(data, n2 * block_len), secret, nbStripesPerBlock);
    acc = f_scramble(acc, getView(secret, secret.byteLength - STRIPE_LEN));
  }
  {
    const nbStripes = Math.floor((data.byteLength - 1 - block_len * nb_blocks) / STRIPE_LEN);
    acc = XXH3_accumulate(acc, getView(data, nb_blocks * block_len), secret, nbStripes);
    acc = f_acc(acc, getView(data, data.byteLength - STRIPE_LEN), getView(secret, secret.byteLength - STRIPE_LEN - 7));
  }
  return acc;
}
function XXH3_hashLong_128b(data, secret, seed) {
  let acc = new BigUint64Array([
    PRIME32_3,
    PRIME64_1,
    PRIME64_2,
    PRIME64_3,
    PRIME64_4,
    PRIME32_2,
    PRIME64_5,
    PRIME32_1
  ]);
  assert(data.length > 128);
  acc = XXH3_hashLong(acc, data, secret, XXH3_accumulate_512, XXH3_scrambleAcc);
  assert(acc.length * 8 == 64);
  {
    const low64 = XXH3_mergeAccs(acc, getView(secret, 11), n(data.byteLength) * PRIME64_1 & mask64);
    const high64 = XXH3_mergeAccs(acc, getView(secret, secret.byteLength - STRIPE_LEN - 11), ~(n(data.byteLength) * PRIME64_2) & mask64);
    return high64 << n(64) | low64;
  }
}
function XXH3_mul128_fold64(a, b) {
  const lll = a * b & mask128;
  return lll & mask64 ^ lll >> n(64);
}
function XXH3_mix16B(data, key, seed) {
  return XXH3_mul128_fold64((readBigUInt64LE(data, 0) ^ readBigUInt64LE(key, 0) + seed) & mask64, (readBigUInt64LE(data, 8) ^ readBigUInt64LE(key, 8) - seed) & mask64);
}
function XXH3_mix32B(acc, data1, data2, key, seed) {
  let accl = acc & mask64;
  let acch = acc >> n(64) & mask64;
  accl += XXH3_mix16B(data1, key, seed);
  accl ^= readBigUInt64LE(data2, 0) + readBigUInt64LE(data2, 8);
  accl &= mask64;
  acch += XXH3_mix16B(data2, getView(key, 16), seed);
  acch ^= readBigUInt64LE(data1, 0) + readBigUInt64LE(data1, 8);
  acch &= mask64;
  return acch << n(64) | accl;
}
function XXH3_avalanche(h64) {
  h64 ^= h64 >> n(37);
  h64 *= PRIME_MX1;
  h64 &= mask64;
  h64 ^= h64 >> n(32);
  return h64;
}
function XXH3_avalanche64(h64) {
  h64 ^= h64 >> n(33);
  h64 *= PRIME64_2;
  h64 &= mask64;
  h64 ^= h64 >> n(29);
  h64 *= PRIME64_3;
  h64 &= mask64;
  h64 ^= h64 >> n(32);
  return h64;
}
function XXH3_len_1to3_128b(data, key32, seed) {
  const len = data.byteLength;
  assert(len > 0 && len <= 3);
  const combined = n(readUInt8(data, len - 1)) | n(len << 8) | n(readUInt8(data, 0) << 16) | n(readUInt8(data, len >> 1) << 24);
  const blow = (n(readUInt32LE(key32, 0)) ^ n(readUInt32LE(key32, 4))) + seed;
  const low = (combined ^ blow) & mask64;
  const bhigh = (n(readUInt32LE(key32, 8)) ^ n(readUInt32LE(key32, 12))) - seed;
  const high = (rotl32(bswap32(combined), n(13)) ^ bhigh) & mask64;
  return (XXH3_avalanche64(high) & mask64) << n(64) | XXH3_avalanche64(low);
}
function xorshift64(b, shift) {
  return b ^ b >> shift;
}
function XXH3_len_4to8_128b(data, key32, seed) {
  const len = data.byteLength;
  assert(len >= 4 && len <= 8);
  {
    const l1 = readUInt32LE(data, 0);
    const l2 = readUInt32LE(data, len - 4);
    const l64 = n(l1) | n(l2) << n(32);
    const bitflip = (readBigUInt64LE(key32, 16) ^ readBigUInt64LE(key32, 24)) + seed & mask64;
    const keyed = l64 ^ bitflip;
    let m128 = keyed * (PRIME64_1 + (n(len) << n(2))) & mask128;
    m128 += (m128 & mask64) << n(65);
    m128 &= mask128;
    m128 ^= m128 >> n(67);
    return xorshift64(xorshift64(m128 & mask64, n(35)) * PRIME_MX2 & mask64, n(28)) | XXH3_avalanche(m128 >> n(64)) << n(64);
  }
}
function XXH3_len_9to16_128b(data, key64, seed) {
  const len = data.byteLength;
  assert(len >= 9 && len <= 16);
  {
    const bitflipl = (readBigUInt64LE(key64, 32) ^ readBigUInt64LE(key64, 40)) + seed & mask64;
    const bitfliph = (readBigUInt64LE(key64, 48) ^ readBigUInt64LE(key64, 56)) - seed & mask64;
    const ll1 = readBigUInt64LE(data);
    let ll2 = readBigUInt64LE(data, len - 8);
    let m128 = (ll1 ^ ll2 ^ bitflipl) * PRIME64_1;
    const m128_l = (m128 & mask64) + (n(len - 1) << n(54));
    m128 = m128 & (mask128 ^ mask64) | m128_l;
    ll2 ^= bitfliph;
    m128 += ll2 + (ll2 & mask32) * (PRIME32_2 - n(1)) << n(64);
    m128 &= mask128;
    m128 ^= bswap64(m128 >> n(64));
    let h128 = (m128 & mask64) * PRIME64_2;
    h128 += (m128 >> n(64)) * PRIME64_2 << n(64);
    h128 &= mask128;
    return XXH3_avalanche(h128 & mask64) | XXH3_avalanche(h128 >> n(64)) << n(64);
  }
}
function XXH3_len_0to16_128b(data, seed) {
  const len = data.byteLength;
  assert(len <= 16);
  if (len > 8)
    return XXH3_len_9to16_128b(data, kkey, seed);
  if (len >= 4)
    return XXH3_len_4to8_128b(data, kkey, seed);
  if (len > 0)
    return XXH3_len_1to3_128b(data, kkey, seed);
  return XXH3_avalanche64(seed ^ readBigUInt64LE(kkey, 64) ^ readBigUInt64LE(kkey, 72)) | XXH3_avalanche64(seed ^ readBigUInt64LE(kkey, 80) ^ readBigUInt64LE(kkey, 88)) << n(64);
}
function inv64(x) {
  return ~x + n(1) & mask64;
}
function XXH3_len_17to128_128b(data, secret, seed) {
  let acc = n(data.byteLength) * PRIME64_1 & mask64;
  let i = n(data.byteLength - 1) / n(32);
  while (i >= 0) {
    const ni = Number(i);
    acc = XXH3_mix32B(acc, getView(data, 16 * ni), getView(data, data.byteLength - 16 * (ni + 1)), getView(secret, 32 * ni), seed);
    i--;
  }
  let h128l = acc + (acc >> n(64)) & mask64;
  h128l = XXH3_avalanche(h128l);
  let h128h = (acc & mask64) * PRIME64_1 + (acc >> n(64)) * PRIME64_4 + (n(data.byteLength) - seed & mask64) * PRIME64_2;
  h128h &= mask64;
  h128h = inv64(XXH3_avalanche(h128h));
  return h128l | h128h << n(64);
}
function XXH3_len_129to240_128b(data, secret, seed) {
  let acc = n(data.byteLength) * PRIME64_1 & mask64;
  for (let i = 32; i < 160; i += 32) {
    acc = XXH3_mix32B(acc, getView(data, i - 32), getView(data, i - 16), getView(secret, i - 32), seed);
  }
  acc = XXH3_avalanche(acc & mask64) | XXH3_avalanche(acc >> n(64)) << n(64);
  for (let i = 160; i <= data.byteLength; i += 32) {
    acc = XXH3_mix32B(acc, getView(data, i - 32), getView(data, i - 16), getView(secret, 3 + i - 160), seed);
  }
  acc = XXH3_mix32B(acc, getView(data, data.byteLength - 16), getView(data, data.byteLength - 32), getView(secret, 136 - 17 - 16), inv64(seed));
  let h128l = acc + (acc >> n(64)) & mask64;
  h128l = XXH3_avalanche(h128l);
  let h128h = (acc & mask64) * PRIME64_1 + (acc >> n(64)) * PRIME64_4 + (n(data.byteLength) - seed & mask64) * PRIME64_2;
  h128h &= mask64;
  h128h = inv64(XXH3_avalanche(h128h));
  return h128l | h128h << n(64);
}
function XXH3_128(data, seed = n(0)) {
  const len = data.byteLength;
  if (len <= 16)
    return XXH3_len_0to16_128b(data, seed);
  if (len <= 128)
    return XXH3_len_17to128_128b(data, kkey, seed);
  if (len <= 240)
    return XXH3_len_129to240_128b(data, kkey, seed);
  return XXH3_hashLong_128b(data, kkey, seed);
}
function xxh128ToBytes(hash128) {
  const result = new Uint8Array(16);
  const view = new DataView(result.buffer);
  const low64 = hash128 & mask64;
  const high64 = hash128 >> n(64);
  view.setBigUint64(0, high64, false);
  view.setBigUint64(8, low64, false);
  return result;
}

// ../../node_modules/langsmith/dist/utils/_uuid.js
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUuid(str, which) {
  if (!UUID_REGEX.test(str)) {
    const msg = which !== void 0 ? `Invalid UUID for ${which}: ${str}` : `Invalid UUID: ${str}`;
    throw new Error(msg);
  }
  return str;
}
function uuid7FromTime(timestamp) {
  const msecs = typeof timestamp === "string" ? Date.parse(timestamp) : timestamp;
  return v7_default({ msecs, seq: 0 });
}
function getUuidVersion(uuidStr) {
  if (!UUID_REGEX.test(uuidStr)) {
    return null;
  }
  const versionChar = uuidStr[14];
  return parseInt(versionChar, 16);
}
function uuidToBytes(uuidStr) {
  const hex = uuidStr.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
function bytesToUuid(bytes) {
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
var _textEncoder = new TextEncoder();
function _fastHash128(str) {
  const data = _textEncoder.encode(str);
  const hash128 = XXH3_128(data);
  return xxh128ToBytes(hash128);
}
function nonCryptographicUuid7Deterministic(originalId, key) {
  const hashInput = `${originalId}:${key}`;
  const h = _fastHash128(hashInput);
  const b = new Uint8Array(16);
  const version3 = getUuidVersion(originalId);
  if (version3 === 7) {
    const originalBytes = uuidToBytes(originalId);
    b.set(originalBytes.slice(0, 6), 0);
  } else {
    const msecs = Date.now();
    b[0] = msecs / 1099511627776 & 255;
    b[1] = msecs / 4294967296 & 255;
    b[2] = msecs / 16777216 & 255;
    b[3] = msecs / 65536 & 255;
    b[4] = msecs / 256 & 255;
    b[5] = msecs & 255;
  }
  b[6] = 112 | h[0] & 15;
  b[7] = h[1];
  b[8] = 128 | h[2] & 63;
  b.set(h.slice(3, 10), 9);
  return bytesToUuid(b);
}

// ../../node_modules/langsmith/dist/utils/fs.js
import * as nodeFs from "fs";
import * as nodeFsPromises from "fs/promises";
import * as nodePath from "path";
var path = nodePath;
async function mkdir2(dir) {
  await nodeFsPromises.mkdir(dir, { recursive: true });
}
async function writeFileAtomic(filePath, content) {
  const tempPath = `${filePath}.tmp`;
  await nodeFsPromises.writeFile(tempPath, content, {
    encoding: "utf8",
    mode: 384
  });
  await nodeFsPromises.rename(tempPath, filePath);
}
async function readdir2(dir) {
  return nodeFsPromises.readdir(dir);
}
async function stat2(filePath) {
  return nodeFsPromises.stat(filePath);
}
function existsSync2(p) {
  return nodeFs.existsSync(p);
}
function mkdirSync2(dir) {
  nodeFs.mkdirSync(dir, { recursive: true });
}
function writeFileSync2(filePath, content) {
  nodeFs.writeFileSync(filePath, content);
}
function renameSync2(oldPath, newPath) {
  nodeFs.renameSync(oldPath, newPath);
}
function unlinkSync2(filePath) {
  nodeFs.unlinkSync(filePath);
}
function readFileSync2(filePath) {
  return nodeFs.readFileSync(filePath, "utf-8");
}

// ../../node_modules/langsmith/dist/utils/prompt_cache/index.js
function isStale(entry, ttlSeconds) {
  if (ttlSeconds === null) {
    return false;
  }
  const ageMs = Date.now() - entry.createdAt;
  return ageMs > ttlSeconds * 1e3;
}
var PromptCache = class {
  constructor(config2 = {}) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "ttlSeconds", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "refreshIntervalSeconds", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "refreshTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_metrics", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {
        hits: 0,
        misses: 0,
        refreshes: 0,
        refreshErrors: 0
      }
    });
    this.configure(config2);
  }
  /**
   * Get cache performance metrics.
   */
  get metrics() {
    return { ...this._metrics };
  }
  /**
   * Get total cache requests (hits + misses).
   */
  get totalRequests() {
    return this._metrics.hits + this._metrics.misses;
  }
  /**
   * Get cache hit rate (0.0 to 1.0).
   */
  get hitRate() {
    const total = this.totalRequests;
    return total > 0 ? this._metrics.hits / total : 0;
  }
  /**
   * Reset all metrics to zero.
   */
  resetMetrics() {
    this._metrics = {
      hits: 0,
      misses: 0,
      refreshes: 0,
      refreshErrors: 0
    };
  }
  /**
   * Get a value from cache.
   *
   * Returns the cached value or undefined if not found.
   * Stale entries are still returned (background refresh handles updates).
   */
  get(key, refreshFunc) {
    if (this.maxSize === 0) {
      return void 0;
    }
    const entry = this.cache.get(key);
    if (!entry) {
      this._metrics.misses += 1;
      return void 0;
    }
    this.cache.delete(key);
    this.cache.set(key, { ...entry, refreshFunc });
    this._metrics.hits += 1;
    return entry.value;
  }
  /**
   * Set a value in the cache.
   */
  set(key, value, refreshFunc) {
    if (this.maxSize === 0) {
      return;
    }
    if (this.refreshTimer === void 0) {
      this.startRefreshLoop();
    }
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== void 0) {
        this.cache.delete(oldestKey);
      }
    }
    const entry = {
      value,
      createdAt: Date.now(),
      refreshFunc
    };
    this.cache.delete(key);
    this.cache.set(key, entry);
  }
  /**
   * Remove a specific entry from cache.
   */
  invalidate(key) {
    this.cache.delete(key);
  }
  /**
   * Clear all cache entries.
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get the number of entries in the cache.
   */
  get size() {
    return this.cache.size;
  }
  /**
   * Stop background refresh.
   * Should be called when the client is being cleaned up.
   */
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = void 0;
    }
  }
  /**
   * Dump cache contents to a JSON file for offline use.
   */
  dump(filePath) {
    const entries = {};
    for (const [key, entry] of this.cache.entries()) {
      entries[key] = entry.value;
    }
    const dir = path.dirname(filePath);
    if (!existsSync2(dir)) {
      mkdirSync2(dir);
    }
    const tempPath = `${filePath}.tmp`;
    try {
      writeFileSync2(tempPath, JSON.stringify({ entries }, null, 2));
      renameSync2(tempPath, filePath);
    } catch (e) {
      if (existsSync2(tempPath)) {
        unlinkSync2(tempPath);
      }
      throw e;
    }
  }
  /**
   * Load cache contents from a JSON file.
   *
   * Loaded entries get a fresh TTL starting from load time.
   *
   * @returns Number of entries loaded.
   */
  load(filePath) {
    if (!existsSync2(filePath)) {
      return 0;
    }
    let entries;
    try {
      const content = readFileSync2(filePath);
      const data = JSON.parse(content);
      entries = data.entries ?? null;
    } catch {
      return 0;
    }
    if (!entries) {
      return 0;
    }
    let loaded = 0;
    const now = Date.now();
    for (const [key, value] of Object.entries(entries)) {
      if (this.cache.size >= this.maxSize) {
        break;
      }
      const entry = {
        value,
        createdAt: now
        // Fresh TTL from load time
      };
      this.cache.set(key, entry);
      loaded += 1;
    }
    return loaded;
  }
  /**
   * Start the background refresh loop.
   */
  startRefreshLoop() {
    this.stop();
    if (this.ttlSeconds !== null) {
      this.refreshTimer = setInterval(() => {
        this.refreshStaleEntries().catch((e) => {
          console.warn("Unexpected error in cache refresh loop:", e);
        });
      }, this.refreshIntervalSeconds * 1e3);
      if (this.refreshTimer.unref) {
        this.refreshTimer.unref();
      }
    }
  }
  /**
   * Get list of stale cache keys.
   */
  getStaleEntries() {
    const staleEntries = [];
    for (const [key, value] of this.cache.entries()) {
      if (isStale(value, this.ttlSeconds)) {
        staleEntries.push([key, value]);
      }
    }
    return staleEntries;
  }
  /**
   * Check for stale entries and refresh them.
   */
  async refreshStaleEntries() {
    const staleEntries = this.getStaleEntries();
    if (staleEntries.length === 0) {
      return;
    }
    for (const [key, value] of staleEntries) {
      if (value.refreshFunc !== void 0) {
        try {
          const newValue = await value.refreshFunc();
          this.set(key, newValue, value.refreshFunc);
          this._metrics.refreshes += 1;
        } catch (e) {
          this._metrics.refreshErrors += 1;
          console.warn(`Failed to refresh cache entry ${key}:`, e);
        }
      }
    }
  }
  configure(config2) {
    this.stop();
    this.refreshIntervalSeconds = config2.refreshIntervalSeconds ?? 60;
    this.maxSize = config2.maxSize ?? 100;
    this.ttlSeconds = config2.ttlSeconds ?? 5 * 60;
  }
};
var promptCacheSingleton = new PromptCache();

// ../../node_modules/langsmith/dist/index.js
var __version__ = "0.7.5";

// ../../node_modules/langsmith/dist/utils/env.js
var globalEnv;
var isBrowser2 = () => typeof window !== "undefined" && typeof window.document !== "undefined";
var isWebWorker2 = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
var isJsDom2 = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");
var isDeno2 = () => typeof Deno !== "undefined";
var isNode2 = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno2();
var getEnv2 = () => {
  if (globalEnv) {
    return globalEnv;
  }
  if (typeof Bun !== "undefined") {
    globalEnv = "bun";
  } else if (isBrowser2()) {
    globalEnv = "browser";
  } else if (isNode2()) {
    globalEnv = "node";
  } else if (isWebWorker2()) {
    globalEnv = "webworker";
  } else if (isJsDom2()) {
    globalEnv = "jsdom";
  } else if (isDeno2()) {
    globalEnv = "deno";
  } else {
    globalEnv = "other";
  }
  return globalEnv;
};
var runtimeEnvironment2;
function getRuntimeEnvironment2() {
  if (runtimeEnvironment2 === void 0) {
    const env = getEnv2();
    const releaseEnv = getShas();
    runtimeEnvironment2 = {
      library: "langsmith",
      runtime: env,
      sdk: "langsmith-js",
      sdk_version: __version__,
      ...releaseEnv
    };
  }
  return runtimeEnvironment2;
}
function getLangSmithEnvVarsMetadata() {
  const allEnvVars = getLangSmithEnvironmentVariables();
  const envVars = {};
  const excluded = [
    "LANGCHAIN_API_KEY",
    "LANGCHAIN_ENDPOINT",
    "LANGCHAIN_TRACING_V2",
    "LANGCHAIN_PROJECT",
    "LANGCHAIN_SESSION",
    "LANGSMITH_API_KEY",
    "LANGSMITH_ENDPOINT",
    "LANGSMITH_TRACING_V2",
    "LANGSMITH_CONFIG_FILE",
    "LANGSMITH_PROJECT",
    "LANGSMITH_SESSION"
  ];
  for (const [key, value] of Object.entries(allEnvVars)) {
    if (typeof value === "string" && !excluded.includes(key) && !key.toLowerCase().includes("key") && !key.toLowerCase().includes("secret") && !key.toLowerCase().includes("token")) {
      if (key === "LANGCHAIN_REVISION_ID") {
        envVars["revision_id"] = value;
      } else {
        envVars[key] = value;
      }
    }
  }
  return envVars;
}
function getLangSmithEnvironmentVariables() {
  const envVars = {};
  try {
    if (typeof process !== "undefined" && process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if ((key.startsWith("LANGCHAIN_") || key.startsWith("LANGSMITH_")) && value != null) {
          if ((key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("token")) && typeof value === "string") {
            envVars[key] = value.slice(0, 2) + "*".repeat(value.length - 4) + value.slice(-2);
          } else {
            envVars[key] = value;
          }
        }
      }
    }
  } catch (_e) {
  }
  return envVars;
}
function getEnvironmentVariable2(name) {
  try {
    return typeof process !== "undefined" ? (
      // eslint-disable-next-line no-process-env
      process.env?.[name]
    ) : void 0;
  } catch (_e) {
    return void 0;
  }
}
function getLangSmithEnvironmentVariable(name) {
  return getEnvironmentVariable2(`LANGSMITH_${name}`) || getEnvironmentVariable2(`LANGCHAIN_${name}`);
}
var cachedCommitSHAs;
function getShas() {
  if (cachedCommitSHAs !== void 0) {
    return cachedCommitSHAs;
  }
  const common_release_envs = [
    "VERCEL_GIT_COMMIT_SHA",
    "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA",
    "COMMIT_REF",
    "RENDER_GIT_COMMIT",
    "CI_COMMIT_SHA",
    "CIRCLE_SHA1",
    "CF_PAGES_COMMIT_SHA",
    "REACT_APP_GIT_SHA",
    "SOURCE_VERSION",
    "GITHUB_SHA",
    "TRAVIS_COMMIT",
    "GIT_COMMIT",
    "BUILD_VCS_NUMBER",
    "bamboo_planRepository_revision",
    "Build.SourceVersion",
    "BITBUCKET_COMMIT",
    "DRONE_COMMIT_SHA",
    "SEMAPHORE_GIT_SHA",
    "BUILDKITE_COMMIT"
  ];
  const shas = {};
  for (const env of common_release_envs) {
    const envVar = getEnvironmentVariable2(env);
    if (envVar !== void 0) {
      shas[env] = envVar;
    }
  }
  cachedCommitSHAs = shas;
  return shas;
}
function getOtelEnabled() {
  return getEnvironmentVariable2("OTEL_ENABLED") === "true" || getLangSmithEnvironmentVariable("OTEL_ENABLED") === "true";
}
var _VALID_TRACING_MODES = /* @__PURE__ */ new Set(["langsmith", "otel"]);
function resolveTracingMode(configValue) {
  if (configValue !== void 0) {
    return configValue;
  }
  const envMode = getLangSmithEnvironmentVariable("TRACING_MODE");
  if (envMode !== void 0 && envMode !== "") {
    const lower = envMode.toLowerCase();
    if (!_VALID_TRACING_MODES.has(lower)) {
      throw new Error(`Invalid LANGSMITH_TRACING_MODE=${JSON.stringify(envMode)}. Must be one of: ${[..._VALID_TRACING_MODES].sort().join(", ")}`);
    }
    if (getOtelEnabled()) {
      console.warn("Both LANGSMITH_TRACING_MODE and the legacy OTEL_ENABLED / LANGSMITH_OTEL_ENABLED env vars are set. LANGSMITH_TRACING_MODE takes precedence.");
    }
    return lower;
  }
  if (getOtelEnabled()) {
    return "otel";
  }
  return "langsmith";
}

// ../../node_modules/langsmith/dist/singletons/otel.js
var MockTracer = class {
  constructor() {
    Object.defineProperty(this, "hasWarned", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
  }
  startActiveSpan(_name, ...args) {
    if (!this.hasWarned && resolveTracingMode() === "otel") {
      console.warn('OTel tracing mode is active (via LANGSMITH_TRACING_MODE, OTEL_ENABLED, or LANGSMITH_OTEL_ENABLED), but the required OTEL instances have not been initialized. Please add:\n```\nimport { initializeOTEL } from "langsmith/experimental/otel/setup";\ninitializeOTEL();\n```\nat the beginning of your code.');
      this.hasWarned = true;
    }
    let fn;
    if (args.length === 1 && typeof args[0] === "function") {
      fn = args[0];
    } else if (args.length === 2 && typeof args[1] === "function") {
      fn = args[1];
    } else if (args.length === 3 && typeof args[2] === "function") {
      fn = args[2];
    }
    if (typeof fn === "function") {
      return fn();
    }
    return void 0;
  }
};
var MockOTELTrace = class {
  constructor() {
    Object.defineProperty(this, "mockTracer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new MockTracer()
    });
  }
  getTracer(_name, _version) {
    return this.mockTracer;
  }
  getActiveSpan() {
    return void 0;
  }
  setSpan(context, _span) {
    return context;
  }
  getSpan(_context) {
    return void 0;
  }
  setSpanContext(context, _spanContext) {
    return context;
  }
  getTracerProvider() {
    return void 0;
  }
  setGlobalTracerProvider(_tracerProvider) {
    return false;
  }
};
var MockOTELContext = class {
  active() {
    return {};
  }
  with(_context, fn) {
    return fn();
  }
};
var OTEL_TRACE_KEY = Symbol.for("ls:otel_trace");
var OTEL_CONTEXT_KEY = Symbol.for("ls:otel_context");
var OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY = Symbol.for("ls:otel_get_default_otlp_tracer_provider");
var mockOTELTrace = new MockOTELTrace();
var mockOTELContext = new MockOTELContext();
var OTELProvider = class {
  getTraceInstance() {
    return globalThis[OTEL_TRACE_KEY] ?? mockOTELTrace;
  }
  getContextInstance() {
    return globalThis[OTEL_CONTEXT_KEY] ?? mockOTELContext;
  }
  initializeGlobalInstances(otel) {
    if (globalThis[OTEL_TRACE_KEY] === void 0) {
      globalThis[OTEL_TRACE_KEY] = otel.trace;
    }
    if (globalThis[OTEL_CONTEXT_KEY] === void 0) {
      globalThis[OTEL_CONTEXT_KEY] = otel.context;
    }
  }
  setDefaultOTLPTracerComponents(components) {
    globalThis[OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY] = components;
  }
  getDefaultOTLPTracerComponents() {
    return globalThis[OTEL_GET_DEFAULT_OTLP_TRACER_PROVIDER_KEY] ?? void 0;
  }
};
var OTELProviderSingleton = new OTELProvider();
function getOTELTrace() {
  return OTELProviderSingleton.getTraceInstance();
}
function getOTELContext() {
  return OTELProviderSingleton.getContextInstance();
}
function getDefaultOTLPTracerComponents() {
  return OTELProviderSingleton.getDefaultOTLPTracerComponents();
}

// ../../node_modules/langsmith/dist/experimental/otel/translator.js
var WELL_KNOWN_OPERATION_NAMES = {
  llm: "chat",
  tool: "execute_tool",
  retriever: "embeddings",
  embedding: "embeddings",
  prompt: "chat"
};
function getOperationName(runType) {
  return WELL_KNOWN_OPERATION_NAMES[runType] || runType;
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
var LangSmithToOTELTranslator = class {
  constructor() {
    Object.defineProperty(this, "spans", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
  }
  exportBatch(operations, otelContextMap) {
    for (const op of operations) {
      try {
        if (!op.run) {
          continue;
        }
        if (op.operation === "post") {
          const span = this.createSpanForRun(op, op.run, otelContextMap.get(op.id));
          if (span && !op.run.end_time) {
            this.spans.set(op.id, span);
          }
        } else {
          this.updateSpanForRun(op, op.run);
        }
      } catch (e) {
        console.error(`Error processing operation ${op.id}:`, e);
      }
    }
  }
  createSpanForRun(op, runInfo, otelContext) {
    const activeSpan = otelContext && getOTELTrace().getSpan(otelContext);
    if (!activeSpan) {
      return;
    }
    try {
      return this.finishSpanSetup(activeSpan, runInfo, op);
    } catch (e) {
      console.error(`Failed to create span for run ${op.id}:`, e);
      return void 0;
    }
  }
  finishSpanSetup(span, runInfo, op) {
    this.setSpanAttributes(span, runInfo, op);
    if (runInfo.error) {
      span.setStatus({ code: 2 });
      span.recordException(new Error(runInfo.error));
    } else {
      span.setStatus({ code: 1 });
    }
    if (runInfo.end_time) {
      span.end(new Date(runInfo.end_time));
    }
    return span;
  }
  updateSpanForRun(op, runInfo) {
    try {
      const span = this.spans.get(op.id);
      if (!span) {
        console.debug(`No span found for run ${op.id} during update`);
        return;
      }
      this.setSpanAttributes(span, runInfo, op);
      if (runInfo.error) {
        span.setStatus({ code: 2 });
        span.recordException(new Error(runInfo.error));
      } else {
        span.setStatus({ code: 1 });
      }
      const endTime = runInfo.end_time;
      if (endTime) {
        span.end(new Date(endTime));
        this.spans.delete(op.id);
      }
    } catch (e) {
      console.error(`Failed to update span for run ${op.id}:`, e);
    }
  }
  extractModelName(runInfo) {
    if (runInfo.extra?.metadata) {
      const metadata = runInfo.extra.metadata;
      if (metadata.ls_model_name) {
        return metadata.ls_model_name;
      }
      if (metadata.invocation_params) {
        const invocationParams = metadata.invocation_params;
        if (invocationParams.model) {
          return invocationParams.model;
        } else if (invocationParams.model_name) {
          return invocationParams.model_name;
        }
      }
    }
    return;
  }
  setSpanAttributes(span, runInfo, op) {
    if ("run_type" in runInfo && runInfo.run_type) {
      span.setAttribute(LANGSMITH_RUN_TYPE, runInfo.run_type);
      const operationName = getOperationName(runInfo.run_type || "chain");
      span.setAttribute(GEN_AI_OPERATION_NAME, operationName);
    }
    if ("name" in runInfo && runInfo.name) {
      span.setAttribute(LANGSMITH_NAME, runInfo.name);
    }
    if ("session_id" in runInfo && runInfo.session_id) {
      span.setAttribute(LANGSMITH_SESSION_ID, runInfo.session_id);
    }
    if ("session_name" in runInfo && runInfo.session_name) {
      span.setAttribute(LANGSMITH_SESSION_NAME, runInfo.session_name);
    }
    this.setGenAiSystem(span, runInfo);
    const modelName = this.extractModelName(runInfo);
    if (modelName) {
      span.setAttribute(GEN_AI_REQUEST_MODEL, modelName);
    }
    if (runInfo.extra?.metadata?.usage_metadata && typeof runInfo.extra.metadata.usage_metadata === "object") {
      span.setAttribute(LANGSMITH_USAGE_METADATA, JSON.stringify(runInfo.extra.metadata.usage_metadata));
    }
    if ("prompt_tokens" in runInfo && typeof runInfo.prompt_tokens === "number") {
      span.setAttribute(GEN_AI_USAGE_INPUT_TOKENS, runInfo.prompt_tokens);
    }
    if ("completion_tokens" in runInfo && typeof runInfo.completion_tokens === "number") {
      span.setAttribute(GEN_AI_USAGE_OUTPUT_TOKENS, runInfo.completion_tokens);
    }
    if ("total_tokens" in runInfo && typeof runInfo.total_tokens === "number") {
      span.setAttribute(GEN_AI_USAGE_TOTAL_TOKENS, runInfo.total_tokens);
    }
    this.setInvocationParameters(span, runInfo);
    const metadata = runInfo.extra?.metadata || {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== null && value !== void 0) {
        span.setAttribute(`${LANGSMITH_METADATA}.${key}`, isPrimitive(value) ? String(value) : JSON.stringify(value));
      }
    }
    const tags = runInfo.tags;
    if (tags && Array.isArray(tags)) {
      span.setAttribute(LANGSMITH_TAGS, tags.join(", "));
    } else if (tags) {
      span.setAttribute(LANGSMITH_TAGS, String(tags));
    }
    if ("serialized" in runInfo && typeof runInfo.serialized === "object") {
      const serialized = runInfo.serialized;
      if (serialized.name) {
        span.setAttribute(GEN_AI_SERIALIZED_NAME, String(serialized.name));
      }
      if (serialized.signature) {
        span.setAttribute(GEN_AI_SERIALIZED_SIGNATURE, String(serialized.signature));
      }
      if (serialized.doc) {
        span.setAttribute(GEN_AI_SERIALIZED_DOC, String(serialized.doc));
      }
    }
    this.setIOAttributes(span, op);
  }
  setGenAiSystem(span, runInfo) {
    let system = "langchain";
    const modelName = this.extractModelName(runInfo);
    if (modelName) {
      const modelLower = modelName.toLowerCase();
      if (modelLower.includes("anthropic") || modelLower.startsWith("claude")) {
        system = "anthropic";
      } else if (modelLower.includes("bedrock")) {
        system = "aws.bedrock";
      } else if (modelLower.includes("azure") && modelLower.includes("openai")) {
        system = "az.ai.openai";
      } else if (modelLower.includes("azure") && modelLower.includes("inference")) {
        system = "az.ai.inference";
      } else if (modelLower.includes("cohere")) {
        system = "cohere";
      } else if (modelLower.includes("deepseek")) {
        system = "deepseek";
      } else if (modelLower.includes("gemini")) {
        system = "gemini";
      } else if (modelLower.includes("groq")) {
        system = "groq";
      } else if (modelLower.includes("watson") || modelLower.includes("ibm")) {
        system = "ibm.watsonx.ai";
      } else if (modelLower.includes("mistral")) {
        system = "mistral_ai";
      } else if (modelLower.includes("gpt") || modelLower.includes("openai")) {
        system = "openai";
      } else if (modelLower.includes("perplexity") || modelLower.includes("sonar")) {
        system = "perplexity";
      } else if (modelLower.includes("vertex")) {
        system = "vertex_ai";
      } else if (modelLower.includes("xai") || modelLower.includes("grok")) {
        system = "xai";
      }
    }
    span.setAttribute(GEN_AI_SYSTEM, system);
  }
  setInvocationParameters(span, runInfo) {
    if (!runInfo.extra?.metadata?.invocation_params) {
      return;
    }
    const invocationParams = runInfo.extra.metadata.invocation_params;
    if (invocationParams.max_tokens !== void 0) {
      span.setAttribute(GEN_AI_REQUEST_MAX_TOKENS, invocationParams.max_tokens);
    }
    if (invocationParams.temperature !== void 0) {
      span.setAttribute(GEN_AI_REQUEST_TEMPERATURE, invocationParams.temperature);
    }
    if (invocationParams.top_p !== void 0) {
      span.setAttribute(GEN_AI_REQUEST_TOP_P, invocationParams.top_p);
    }
    if (invocationParams.frequency_penalty !== void 0) {
      span.setAttribute(GEN_AI_REQUEST_FREQUENCY_PENALTY, invocationParams.frequency_penalty);
    }
    if (invocationParams.presence_penalty !== void 0) {
      span.setAttribute(GEN_AI_REQUEST_PRESENCE_PENALTY, invocationParams.presence_penalty);
    }
  }
  setIOAttributes(span, op) {
    if (op.run.inputs) {
      try {
        const inputs = op.run.inputs;
        if (typeof inputs === "object" && inputs !== null) {
          if (inputs.model && Array.isArray(inputs.messages)) {
            span.setAttribute(GEN_AI_REQUEST_MODEL, inputs.model);
          }
          if (inputs.stream !== void 0) {
            span.setAttribute(LANGSMITH_REQUEST_STREAMING, inputs.stream);
          }
          if (inputs.extra_headers) {
            span.setAttribute(LANGSMITH_REQUEST_HEADERS, JSON.stringify(inputs.extra_headers));
          }
          if (inputs.extra_query) {
            span.setAttribute(GEN_AI_REQUEST_EXTRA_QUERY, JSON.stringify(inputs.extra_query));
          }
          if (inputs.extra_body) {
            span.setAttribute(GEN_AI_REQUEST_EXTRA_BODY, JSON.stringify(inputs.extra_body));
          }
        }
        span.setAttribute(GENAI_PROMPT, JSON.stringify(inputs));
      } catch (e) {
        console.debug(`Failed to process inputs for run ${op.id}`, e);
      }
    }
    if (op.run.outputs) {
      try {
        const outputs = op.run.outputs;
        const tokenUsage = this.getUnifiedRunTokens(outputs);
        if (tokenUsage) {
          span.setAttribute(GEN_AI_USAGE_INPUT_TOKENS, tokenUsage[0]);
          span.setAttribute(GEN_AI_USAGE_OUTPUT_TOKENS, tokenUsage[1]);
          span.setAttribute(GEN_AI_USAGE_TOTAL_TOKENS, tokenUsage[0] + tokenUsage[1]);
        }
        if (outputs && typeof outputs === "object") {
          if (outputs.model) {
            span.setAttribute(GEN_AI_RESPONSE_MODEL, String(outputs.model));
          }
          if (outputs.id) {
            span.setAttribute(GEN_AI_RESPONSE_ID, outputs.id);
          }
          if (outputs.choices && Array.isArray(outputs.choices)) {
            const finishReasons = outputs.choices.map((choice) => choice.finish_reason).filter((reason) => reason).map(String);
            if (finishReasons.length > 0) {
              span.setAttribute(GEN_AI_RESPONSE_FINISH_REASONS, finishReasons.join(", "));
            }
          }
          if (outputs.service_tier) {
            span.setAttribute(GEN_AI_RESPONSE_SERVICE_TIER, outputs.service_tier);
          }
          if (outputs.system_fingerprint) {
            span.setAttribute(GEN_AI_RESPONSE_SYSTEM_FINGERPRINT, outputs.system_fingerprint);
          }
          if (outputs.usage_metadata && typeof outputs.usage_metadata === "object") {
            const usageMetadata = outputs.usage_metadata;
            span.setAttribute(LANGSMITH_USAGE_METADATA, JSON.stringify(usageMetadata));
            if (usageMetadata.input_token_details) {
              span.setAttribute(GEN_AI_USAGE_INPUT_TOKEN_DETAILS, JSON.stringify(usageMetadata.input_token_details));
            }
            if (usageMetadata.output_token_details) {
              span.setAttribute(GEN_AI_USAGE_OUTPUT_TOKEN_DETAILS, JSON.stringify(usageMetadata.output_token_details));
            }
          }
        }
        span.setAttribute(GENAI_COMPLETION, JSON.stringify(outputs));
      } catch (e) {
        console.debug(`Failed to process outputs for run ${op.id}`, e);
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUnifiedRunTokens(outputs) {
    if (!outputs) {
      return null;
    }
    let tokenUsage = this.extractUnifiedRunTokens(outputs.usage_metadata);
    if (tokenUsage) {
      return tokenUsage;
    }
    const keys = Object.keys(outputs);
    for (const key of keys) {
      const haystack = outputs[key];
      if (!haystack || typeof haystack !== "object") {
        continue;
      }
      tokenUsage = this.extractUnifiedRunTokens(haystack.usage_metadata);
      if (tokenUsage) {
        return tokenUsage;
      }
      if (haystack.lc === 1 && haystack.kwargs && typeof haystack.kwargs === "object") {
        tokenUsage = this.extractUnifiedRunTokens(haystack.kwargs.usage_metadata);
        if (tokenUsage) {
          return tokenUsage;
        }
      }
    }
    const generations = outputs.generations || [];
    if (!Array.isArray(generations)) {
      return null;
    }
    const flatGenerations = Array.isArray(generations[0]) ? generations.flat() : generations;
    for (const generation of flatGenerations) {
      if (typeof generation === "object" && generation.message && typeof generation.message === "object" && generation.message.kwargs && typeof generation.message.kwargs === "object") {
        tokenUsage = this.extractUnifiedRunTokens(generation.message.kwargs.usage_metadata);
        if (tokenUsage) {
          return tokenUsage;
        }
      }
    }
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractUnifiedRunTokens(outputs) {
    if (!outputs || typeof outputs !== "object") {
      return null;
    }
    if (typeof outputs.input_tokens !== "number" || typeof outputs.output_tokens !== "number") {
      return null;
    }
    return [outputs.input_tokens, outputs.output_tokens];
  }
};

// ../../node_modules/langsmith/dist/utils/is-network-error/index.js
var objectToString = Object.prototype.toString;
var isError = (value) => objectToString.call(value) === "[object Error]";
var errorMessages = /* @__PURE__ */ new Set([
  "network error",
  // Chrome
  "Failed to fetch",
  // Chrome
  "NetworkError when attempting to fetch resource.",
  // Firefox
  "The Internet connection appears to be offline.",
  // Safari 16
  "Network request failed",
  // `cross-fetch`
  "fetch failed",
  // Undici (Node.js)
  "terminated",
  // Undici (Node.js)
  " A network error occurred.",
  // Bun (WebKit)
  "Network connection lost"
  // Cloudflare Workers (fetch)
]);
function isNetworkError(error) {
  const isValid2 = error && isError(error) && error.name === "TypeError" && typeof error.message === "string";
  if (!isValid2) {
    return false;
  }
  const { message, stack } = error;
  if (message === "Load failed") {
    return stack === void 0 || // Sentry adds its own stack trace to the fetch error, so also check for that
    "__sentry_captured__" in error;
  }
  if (message.startsWith("error sending request for url")) {
    return true;
  }
  return errorMessages.has(message);
}

// ../../node_modules/langsmith/dist/utils/p-retry/index.js
function validateRetries(retries) {
  if (typeof retries === "number") {
    if (retries < 0) {
      throw new TypeError("Expected `retries` to be a non-negative number.");
    }
    if (Number.isNaN(retries)) {
      throw new TypeError("Expected `retries` to be a valid number or Infinity, got NaN.");
    }
  } else if (retries !== void 0) {
    throw new TypeError("Expected `retries` to be a number or Infinity.");
  }
}
function validateNumberOption(name, value, { min = 0, allowInfinity = false } = {}) {
  if (value === void 0) {
    return;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError(`Expected \`${name}\` to be a number${allowInfinity ? " or Infinity" : ""}.`);
  }
  if (!allowInfinity && !Number.isFinite(value)) {
    throw new TypeError(`Expected \`${name}\` to be a finite number.`);
  }
  if (value < min) {
    throw new TypeError(`Expected \`${name}\` to be \u2265 ${min}.`);
  }
}
var AbortError = class extends Error {
  constructor(message) {
    super();
    if (message instanceof Error) {
      this.originalError = message;
      ({ message } = message);
    } else {
      this.originalError = new Error(message);
      this.originalError.stack = this.stack;
    }
    this.name = "AbortError";
    this.message = message;
  }
};
function calculateDelay(retriesConsumed, options) {
  const attempt = Math.max(1, retriesConsumed + 1);
  const random = options.randomize ? Math.random() + 1 : 1;
  let timeout = Math.round(random * options.minTimeout * options.factor ** (attempt - 1));
  timeout = Math.min(timeout, options.maxTimeout);
  return timeout;
}
function calculateRemainingTime(start, max) {
  if (!Number.isFinite(max)) {
    return max;
  }
  return max - (performance.now() - start);
}
async function onAttemptFailure({ error, attemptNumber, retriesConsumed, startTime, options }) {
  const normalizedError = error instanceof Error ? error : new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`);
  if (normalizedError instanceof AbortError) {
    throw normalizedError.originalError;
  }
  const retriesLeft = Number.isFinite(options.retries) ? Math.max(0, options.retries - retriesConsumed) : options.retries;
  const maxRetryTime = options.maxRetryTime ?? Number.POSITIVE_INFINITY;
  const context = Object.freeze({
    error: normalizedError,
    attemptNumber,
    retriesLeft,
    retriesConsumed
  });
  await options.onFailedAttempt(context);
  if (calculateRemainingTime(startTime, maxRetryTime) <= 0) {
    throw normalizedError;
  }
  const consumeRetry = await options.shouldConsumeRetry(context);
  const remainingTime = calculateRemainingTime(startTime, maxRetryTime);
  if (remainingTime <= 0 || retriesLeft <= 0) {
    throw normalizedError;
  }
  if (normalizedError instanceof TypeError && !isNetworkError(normalizedError)) {
    if (consumeRetry) {
      throw normalizedError;
    }
    options.signal?.throwIfAborted();
    return false;
  }
  if (!await options.shouldRetry(context)) {
    throw normalizedError;
  }
  if (!consumeRetry) {
    options.signal?.throwIfAborted();
    return false;
  }
  const delayTime = calculateDelay(retriesConsumed, options);
  const finalDelay = Math.min(delayTime, remainingTime);
  if (finalDelay > 0) {
    await new Promise((resolve3, reject) => {
      const onAbort = () => {
        clearTimeout(timeoutToken);
        options.signal?.removeEventListener("abort", onAbort);
        reject(options.signal.reason);
      };
      const timeoutToken = setTimeout(() => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve3();
      }, finalDelay);
      if (options.unref) {
        timeoutToken.unref?.();
      }
      options.signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
  options.signal?.throwIfAborted();
  return true;
}
async function pRetry(input, options = {}) {
  options = { ...options };
  validateRetries(options.retries);
  if (Object.hasOwn(options, "forever")) {
    throw new Error("The `forever` option is no longer supported. For many use-cases, you can set `retries: Infinity` instead.");
  }
  options.retries ??= 10;
  options.factor ??= 2;
  options.minTimeout ??= 1e3;
  options.maxTimeout ??= Number.POSITIVE_INFINITY;
  options.maxRetryTime ??= Number.POSITIVE_INFINITY;
  options.randomize ??= false;
  options.onFailedAttempt ??= () => {
  };
  options.shouldRetry ??= () => true;
  options.shouldConsumeRetry ??= () => true;
  validateNumberOption("factor", options.factor, {
    min: 0,
    allowInfinity: false
  });
  validateNumberOption("minTimeout", options.minTimeout, {
    min: 0,
    allowInfinity: false
  });
  validateNumberOption("maxTimeout", options.maxTimeout, {
    min: 0,
    allowInfinity: true
  });
  validateNumberOption("maxRetryTime", options.maxRetryTime, {
    min: 0,
    allowInfinity: true
  });
  if (!(options.factor > 0)) {
    options.factor = 1;
  }
  options.signal?.throwIfAborted();
  let attemptNumber = 0;
  let retriesConsumed = 0;
  const startTime = performance.now();
  while (Number.isFinite(options.retries) ? retriesConsumed <= options.retries : true) {
    attemptNumber++;
    try {
      options.signal?.throwIfAborted();
      const result = await input(attemptNumber);
      options.signal?.throwIfAborted();
      return result;
    } catch (error) {
      if (await onAttemptFailure({
        error,
        attemptNumber,
        retriesConsumed,
        startTime,
        options
      })) {
        retriesConsumed++;
      }
    }
  }
  throw new Error("Retry attempts exhausted without throwing an error.");
}

// ../../node_modules/langsmith/dist/utils/p-queue.js
var import_p_queue = __toESM(require_dist(), 1);
var PQueue = "default" in import_p_queue.default ? import_p_queue.default.default : import_p_queue.default;

// ../../node_modules/langsmith/dist/utils/async_caller.js
var STATUS_RETRYABLE = [
  408,
  // Request Timeout
  425,
  // Too Early
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
];
var AsyncCaller = class {
  constructor(params) {
    Object.defineProperty(this, "maxConcurrency", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxRetries", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxQueueSizeBytes", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "queue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "onFailedResponseHook", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "queueSizeBytes", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    this.maxConcurrency = params.maxConcurrency ?? Infinity;
    this.maxRetries = params.maxRetries ?? 6;
    this.maxQueueSizeBytes = params.maxQueueSizeBytes;
    this.queue = new PQueue({ concurrency: this.maxConcurrency });
    this.onFailedResponseHook = params?.onFailedResponseHook;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call(callable, ...args) {
    return this.callWithOptions({}, callable, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callWithOptions(options, callable, ...args) {
    const sizeBytes = options.sizeBytes ?? 0;
    if (this.maxQueueSizeBytes !== void 0 && sizeBytes > 0 && this.queueSizeBytes + sizeBytes > this.maxQueueSizeBytes) {
      return Promise.reject(new Error(`Queue size limit (${this.maxQueueSizeBytes} bytes) exceeded. Current queue size: ${this.queueSizeBytes} bytes, attempted addition: ${sizeBytes} bytes.`));
    }
    if (sizeBytes > 0) {
      this.queueSizeBytes += sizeBytes;
    }
    const onFailedResponseHook = this.onFailedResponseHook;
    let promise = this.queue.add(() => pRetry(() => callable(...args).catch((error) => {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(error);
      }
    }), {
      async onFailedAttempt({ error }) {
        if (typeof error !== "object" || error == null)
          throw error;
        const errorMessage = "message" in error && typeof error.message === "string" ? error.message : void 0;
        if (errorMessage?.startsWith("Cancel") || errorMessage?.startsWith("TimeoutError") || errorMessage?.startsWith("AbortError")) {
          throw error;
        }
        if ("name" in error && error.name === "TimeoutError") {
          throw error;
        }
        if ("code" in error && error.code === "ECONNABORTED") {
          throw error;
        }
        const response = "response" in error ? error.response : void 0;
        if (onFailedResponseHook) {
          const handled = await onFailedResponseHook(response);
          if (handled)
            return;
        }
        const status = response?.status ?? ("status" in error ? error.status : void 0);
        if (status != null && (typeof status === "number" || typeof status === "string") && !STATUS_RETRYABLE.includes(+status)) {
          throw error;
        }
      },
      retries: this.maxRetries,
      randomize: true
    }), { throwOnTimeout: true });
    if (sizeBytes > 0) {
      promise = promise.finally(() => {
        this.queueSizeBytes -= sizeBytes;
      });
    }
    if (options.signal) {
      return Promise.race([
        promise,
        new Promise((_, reject) => {
          options.signal?.addEventListener("abort", () => {
            reject(new Error("AbortError"));
          });
        })
      ]);
    }
    return promise;
  }
};

// ../../node_modules/langsmith/dist/utils/messages.js
function isLangChainMessage(message) {
  return typeof message?._getType === "function";
}
function convertLangChainMessageToExample(message) {
  const converted = {
    type: message._getType(),
    data: { content: message.content }
  };
  if (message?.additional_kwargs && Object.keys(message.additional_kwargs).length > 0) {
    converted.data.additional_kwargs = { ...message.additional_kwargs };
  }
  return converted;
}

// ../../node_modules/langsmith/dist/utils/error.js
function getInvalidPromptIdentifierMsg(identifier) {
  return `Invalid prompt identifier format: "${identifier}". Expected one of:
  - "prompt-name" (for private prompts)
  - "owner/prompt-name" (for prompts with explicit owner)
  - "prompt-name:commit-hash" (with commit reference)
  - "owner/prompt-name:commit-hash" (with owner and commit)`;
}
var LangSmithConflictError = class extends Error {
  constructor(message) {
    super(message);
    Object.defineProperty(this, "status", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.name = "LangSmithConflictError";
    this.status = 409;
  }
};
var LangSmithNotFoundError = class extends Error {
  constructor(message) {
    super(message);
    Object.defineProperty(this, "status", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.name = "LangSmithNotFoundError";
    this.status = 404;
  }
};
function isLangSmithNotFoundError(error) {
  return error != null && typeof error === "object" && "name" in error && error?.name === "LangSmithNotFoundError";
}
function isLangSmithConflictError(error) {
  return error != null && typeof error === "object" && "name" in error && error?.name === "LangSmithConflictError";
}
async function raiseForStatus(response, context, consumeOnSuccess) {
  let errorBody;
  if (response.ok) {
    if (consumeOnSuccess) {
      errorBody = await response.text();
    }
    return;
  }
  if (response.status === 403) {
    try {
      const errorData = await response.json();
      const errorCode = errorData?.error;
      if (errorCode === "org_scoped_key_requires_workspace") {
        errorBody = "This API key is org-scoped and requires workspace specification. Please provide 'workspaceId' parameter, or set LANGSMITH_WORKSPACE_ID environment variable.";
      }
    } catch (_e) {
      const errorWithStatus = new Error(`${response.status} ${response.statusText}`);
      errorWithStatus.status = response?.status;
      throw errorWithStatus;
    }
  }
  if (errorBody === void 0) {
    try {
      errorBody = await response.text();
    } catch (_e) {
      errorBody = "";
    }
  }
  const fullMessage = `Failed to ${context}. Received status [${response.status}]: ${response.statusText}. Message: ${errorBody}`;
  if (response.status === 404) {
    throw new LangSmithNotFoundError(fullMessage);
  }
  if (response.status === 409) {
    throw new LangSmithConflictError(fullMessage);
  }
  const err = new Error(fullMessage);
  err.status = response.status;
  throw err;
}
var ERR_CONFLICTING_ENDPOINTS = "ERR_CONFLICTING_ENDPOINTS";
var ConflictingEndpointsError = class extends Error {
  constructor() {
    super("You cannot provide both LANGSMITH_ENDPOINT / LANGCHAIN_ENDPOINT and LANGSMITH_RUNS_ENDPOINTS.");
    Object.defineProperty(this, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: ERR_CONFLICTING_ENDPOINTS
    });
    this.name = "ConflictingEndpointsError";
  }
};
function isConflictingEndpointsError(err) {
  return typeof err === "object" && err !== null && err.code === ERR_CONFLICTING_ENDPOINTS;
}

// ../../node_modules/langsmith/dist/utils/prompts.js
function parseHubIdentifier(identifier) {
  if (!identifier || identifier.split("/").length > 2 || identifier.startsWith("/") || identifier.endsWith("/") || identifier.split(":").length > 2) {
    throw new Error(getInvalidPromptIdentifierMsg(identifier));
  }
  const [ownerNamePart, commitPart] = identifier.split(":");
  const commit = commitPart || "latest";
  if (ownerNamePart.includes("/")) {
    const [owner, name] = ownerNamePart.split("/", 2);
    if (!owner || !name) {
      throw new Error(getInvalidPromptIdentifierMsg(identifier));
    }
    return [owner, name, commit];
  } else {
    if (!ownerNamePart) {
      throw new Error(getInvalidPromptIdentifierMsg(identifier));
    }
    return ["-", ownerNamePart, commit];
  }
}

// ../../node_modules/langsmith/dist/utils/profiles.js
var DEFAULT_API_URL = "https://api.smith.langchain.com";
var OAUTH_CLIENT_ID = "langsmith-cli";
var TOKEN_REFRESH_LEEWAY_MS = 6e4;
var TOKEN_REFRESH_TIMEOUT_MS = 1e4;
function isBrowserLikeRuntime() {
  const env = getEnv2();
  return env === "browser" || env === "webworker";
}
function getProfileConfigPath() {
  const explicitPath = getEnvironmentVariable2("LANGSMITH_CONFIG_FILE");
  if (explicitPath) {
    return explicitPath;
  }
  const home = getEnvironmentVariable2("HOME") ?? getEnvironmentVariable2("USERPROFILE");
  if (!home) {
    return void 0;
  }
  return path.join(home, ".langsmith", "config.json");
}
function resolveProfileName(config2) {
  const envProfile = getEnvironmentVariable2("LANGSMITH_PROFILE");
  if (envProfile) {
    return envProfile;
  }
  if (config2.current_profile) {
    return config2.current_profile;
  }
  if (config2.profiles?.default) {
    return "default";
  }
  return void 0;
}
function loadProfileState() {
  if (isBrowserLikeRuntime()) {
    return void 0;
  }
  const configPath = getProfileConfigPath();
  if (!configPath || !existsSync2(configPath)) {
    return void 0;
  }
  try {
    const config2 = JSON.parse(readFileSync2(configPath));
    const profileName = resolveProfileName(config2);
    const profile = profileName ? config2.profiles?.[profileName] : void 0;
    if (!profileName || !profile) {
      return void 0;
    }
    return { configPath, config: config2, profileName, profile };
  } catch {
    return void 0;
  }
}
function hasValue(value) {
  return value !== void 0 && value !== null && value.trim() !== "";
}
function trimConfigValue(value) {
  return value?.trim().replace(/^["']|["']$/g, "");
}
function shouldRefreshProfileToken(profile) {
  const oauth = profile.oauth;
  if (!oauth?.refresh_token) {
    return false;
  }
  if (!oauth.access_token) {
    return true;
  }
  if (!oauth.expires_at) {
    return false;
  }
  const expiresAt = Date.parse(oauth.expires_at);
  if (Number.isNaN(expiresAt)) {
    return false;
  }
  return expiresAt <= Date.now() + TOKEN_REFRESH_LEEWAY_MS;
}
function normalizeConfigUrl(apiUrl) {
  let normalized = apiUrl;
  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  const apiV1Suffix = "/api/v1";
  return normalized.endsWith(apiV1Suffix) ? normalized.slice(0, -apiV1Suffix.length) : normalized;
}
function applyTokenResponse(profile, token) {
  profile.oauth ??= {};
  if (token.access_token) {
    profile.oauth.access_token = token.access_token;
  }
  if (token.refresh_token) {
    profile.oauth.refresh_token = token.refresh_token;
  }
  if (typeof token.expires_in === "number" && token.expires_in > 0) {
    profile.oauth.expires_at = new Date(Date.now() + token.expires_in * 1e3).toISOString();
  }
}
function getAbortReason(signal) {
  return signal.reason ?? new Error("The operation was aborted.");
}
async function waitForAbortSignal(promise, signal) {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    throw getAbortReason(signal);
  }
  let cleanup;
  const abortPromise = new Promise((_, reject) => {
    const onAbort = () => {
      reject(getAbortReason(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    cleanup = () => {
      signal.removeEventListener("abort", onAbort);
    };
  });
  try {
    return await Promise.race([promise, abortPromise]);
  } finally {
    cleanup?.();
  }
}
function loadProfileClientConfig() {
  const state = loadProfileState();
  const profile = state?.profile;
  if (!state || !profile) {
    return {};
  }
  const apiKey = trimConfigValue(profile.api_key);
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  const oauthRefreshToken = trimConfigValue(profile.oauth?.refresh_token);
  return {
    apiUrl: profile.api_url,
    apiKey,
    workspaceId: profile.workspace_id,
    oauthAccessToken,
    oauthRefreshToken,
    profileAuth: apiKey || oauthAccessToken || oauthRefreshToken ? new ProfileAuth(state) : void 0
  };
}
var ProfileAuth = class {
  constructor(state) {
    Object.defineProperty(this, "state", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: state
    });
    Object.defineProperty(this, "refreshPromise", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "managedAuthorizationValue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.rememberProfileAuthHeader(this.currentAuthHeader());
  }
  currentAuthHeader() {
    const header = currentAuthHeaderFromProfile(this.state.profile);
    this.rememberProfileAuthHeader(header);
    return header;
  }
  async getAuthHeader(fetchImplementation, signal) {
    if (shouldRefreshProfileToken(this.state.profile)) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshOAuthToken(fetchImplementation).finally(() => {
          this.refreshPromise = void 0;
        });
      }
      await waitForAbortSignal(this.refreshPromise, signal);
    }
    const header = authHeaderFromProfile(this.state.profile);
    this.rememberProfileAuthHeader(header);
    return header;
  }
  isProfileAuthorizationHeader(value) {
    return value === this.managedAuthorizationValue;
  }
  async refreshOAuthToken(fetchImplementation) {
    const refreshToken = this.state.profile.oauth?.refresh_token;
    if (!refreshToken) {
      return;
    }
    const refreshApiUrl = trimConfigValue(this.state.profile.api_url) ?? DEFAULT_API_URL;
    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: OAUTH_CLIENT_ID,
        refresh_token: refreshToken
      });
      const response = await fetchImplementation(`${normalizeConfigUrl(refreshApiUrl)}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString(),
        signal: AbortSignal.timeout(TOKEN_REFRESH_TIMEOUT_MS)
      });
      if (!response.ok) {
        return;
      }
      const token = await response.json();
      if (!token.access_token) {
        return;
      }
      applyTokenResponse(this.state.profile, token);
      this.state.config.profiles ??= {};
      this.state.config.profiles[this.state.profileName] = this.state.profile;
      await writeFileAtomic(this.state.configPath, `${JSON.stringify(this.state.config, null, 2)}
`);
    } catch {
      return;
    }
  }
  rememberProfileAuthHeader(header) {
    this.managedAuthorizationValue = header?.name === "Authorization" ? header.value : void 0;
  }
};
function currentAuthHeaderFromProfile(profile) {
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  if (oauthAccessToken) {
    return { name: "Authorization", value: `Bearer ${oauthAccessToken}` };
  }
  if (trimConfigValue(profile.oauth?.refresh_token)) {
    return void 0;
  }
  return authHeaderFromProfile(profile);
}
function authHeaderFromProfile(profile) {
  const oauthAccessToken = trimConfigValue(profile.oauth?.access_token);
  if (oauthAccessToken) {
    return { name: "Authorization", value: `Bearer ${oauthAccessToken}` };
  }
  const apiKey = trimConfigValue(profile.api_key);
  if (apiKey) {
    return { name: "x-api-key", value: apiKey };
  }
  return void 0;
}

// ../../node_modules/langsmith/dist/utils/fast-safe-stringify/index.js
var LIMIT_REPLACE_NODE = "[...]";
var CIRCULAR_REPLACE_NODE = { result: "[Circular]" };
var arr = [];
var replacerStack = [];
var encoder = new TextEncoder();
function defaultOptions() {
  return {
    depthLimit: Number.MAX_SAFE_INTEGER,
    edgesLimit: Number.MAX_SAFE_INTEGER
  };
}
function encodeString(str) {
  return encoder.encode(str);
}
function serializeWellKnownTypes(val) {
  if (val && typeof val === "object" && val !== null) {
    if (val instanceof Map) {
      return Object.fromEntries(val);
    } else if (val instanceof Set) {
      return Array.from(val);
    } else if (val instanceof Date) {
      return val.toISOString();
    } else if (val instanceof RegExp) {
      return val.toString();
    } else if (val instanceof Error) {
      return {
        name: val.name,
        message: val.message
      };
    }
  } else if (typeof val === "bigint") {
    return val.toString();
  }
  return val;
}
function createDefaultReplacer(userReplacer) {
  return function(key, val) {
    if (userReplacer) {
      const userResult = userReplacer.call(this, key, val);
      if (userResult !== void 0) {
        return userResult;
      }
    }
    return serializeWellKnownTypes(val);
  };
}
function estimateSerializedSize(value) {
  try {
    let estimateString2 = function(s) {
      const n2 = byteLen(s);
      if (n2 > maxStringLen)
        maxStringLen = n2;
      return n2 + 2;
    }, estimateByteArrayJson2 = function(byteLength) {
      if (byteLength === 0)
        return 2;
      return 2 + byteLength * 4;
    }, isDropped2 = function(v) {
      return v === void 0 || typeof v === "function" || typeof v === "symbol";
    }, estimateInArray2 = function(v) {
      if (v === void 0 || typeof v === "function" || typeof v === "symbol") {
        return 4;
      }
      return estimate2(v);
    }, estimate2 = function(val) {
      if (val === null)
        return 4;
      if (val === void 0)
        return 0;
      const t = typeof val;
      if (t === "boolean")
        return 5;
      if (t === "number") {
        if (!Number.isFinite(val))
          return 4;
        return val.toString().length;
      }
      if (t === "bigint") {
        return val.toString().length + 2;
      }
      if (t === "string")
        return estimateString2(val);
      if (t === "function" || t === "symbol")
        return 0;
      const obj = val;
      if (obj instanceof Date)
        return 26;
      if (obj instanceof RegExp)
        return byteLen(obj.toString()) + 2;
      if (obj instanceof Error) {
        const name = obj.name ?? "";
        const message = obj.message ?? "";
        return 22 + byteLen(name) + byteLen(message);
      }
      if (typeof Buffer !== "undefined" && obj instanceof Buffer) {
        return 28 + estimateByteArrayJson2(obj.byteLength);
      }
      if (ArrayBuffer.isView(obj)) {
        if (obj instanceof DataView) {
          return 2;
        }
        const len = obj.length ?? 0;
        const isFloat = obj instanceof Float32Array || obj instanceof Float64Array;
        const perElement = isFloat ? 30 : 12;
        return 2 + len * perElement;
      }
      if (obj instanceof ArrayBuffer) {
        return 2;
      }
      if (ancestors.has(obj)) {
        return 24;
      }
      if (typeof obj.toJSON === "function") {
        let projected;
        try {
          projected = obj.toJSON("");
        } catch {
          return 16;
        }
        ancestors.add(obj);
        const size3 = estimate2(projected);
        ancestors.delete(obj);
        return size3;
      }
      ancestors.add(obj);
      let size2;
      if (Array.isArray(obj)) {
        size2 = 2;
        const len = obj.length;
        for (let i = 0; i < len; i++) {
          size2 += estimateInArray2(obj[i]);
          if (i < len - 1)
            size2 += 1;
        }
      } else if (obj instanceof Map) {
        size2 = 2;
        let emitted = 0;
        for (const [k, v] of obj) {
          if (isDropped2(v))
            continue;
          if (emitted > 0)
            size2 += 1;
          const keyStr = typeof k === "string" ? k : String(k);
          size2 += byteLen(keyStr) + 3;
          size2 += estimate2(v);
          emitted++;
        }
      } else if (obj instanceof Set) {
        size2 = 2;
        let emitted = 0;
        for (const v of obj) {
          if (emitted > 0)
            size2 += 1;
          size2 += estimateInArray2(v);
          emitted++;
        }
      } else {
        size2 = 2;
        let emitted = 0;
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const v = obj[key];
          if (isDropped2(v))
            continue;
          if (emitted > 0)
            size2 += 1;
          size2 += byteLen(key) + 3;
          size2 += estimate2(v);
          emitted++;
        }
      }
      ancestors.delete(obj);
      return size2;
    };
    var estimateString = estimateString2, estimateByteArrayJson = estimateByteArrayJson2, isDropped = isDropped2, estimateInArray = estimateInArray2, estimate = estimate2;
    const ancestors = /* @__PURE__ */ new Set();
    let maxStringLen = 0;
    const byteLen = typeof Buffer !== "undefined" && typeof Buffer.byteLength === "function" ? (s) => Buffer.byteLength(s, "utf8") : (s) => s.length;
    const size = estimate2(value);
    return { size, maxStringLen };
  } catch {
    return { size: serialize(value).length, maxStringLen: 0 };
  }
}
function serialize(obj, errorContext, replacer, spacer, options) {
  try {
    const str = JSON.stringify(obj, createDefaultReplacer(replacer), spacer);
    return encodeString(str);
  } catch (e) {
    if (!e.message?.includes("Converting circular structure to JSON")) {
      console.warn(`[WARNING]: LangSmith received unserializable value.${errorContext ? `
Context: ${errorContext}` : ""}`);
      return encodeString("[Unserializable]");
    }
    getLangSmithEnvironmentVariable("SUPPRESS_CIRCULAR_JSON_WARNINGS") !== "true" && console.warn(`[WARNING]: LangSmith received circular JSON. This will decrease tracer performance. ${errorContext ? `
Context: ${errorContext}` : ""}`);
    if (typeof options === "undefined") {
      options = defaultOptions();
    }
    decirc(obj, "", 0, [], void 0, 0, options);
    let res;
    try {
      if (replacerStack.length === 0) {
        res = JSON.stringify(obj, replacer, spacer);
      } else {
        res = JSON.stringify(obj, replaceGetterValues(replacer), spacer);
      }
    } catch (_) {
      return encodeString("[unable to serialize, circular reference is too complex to analyze]");
    } finally {
      while (arr.length !== 0) {
        const part = arr.pop();
        if (part.length === 4) {
          Object.defineProperty(part[0], part[1], part[3]);
        } else {
          part[0][part[1]] = part[2];
        }
      }
    }
    return encodeString(res);
  }
}
function setReplace(replace, val, k, parent) {
  var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k);
  if (propertyDescriptor.get !== void 0) {
    if (propertyDescriptor.configurable) {
      Object.defineProperty(parent, k, { value: replace });
      arr.push([parent, k, val, propertyDescriptor]);
    } else {
      replacerStack.push([val, k, replace]);
    }
  } else {
    parent[k] = replace;
    arr.push([parent, k, val]);
  }
}
function decirc(val, k, edgeIndex, stack, parent, depth, options) {
  depth += 1;
  var i;
  if (typeof val === "object" && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent);
        return;
      }
    }
    if (typeof options.depthLimit !== "undefined" && depth > options.depthLimit) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
      return;
    }
    if (typeof options.edgesLimit !== "undefined" && edgeIndex + 1 > options.edgesLimit) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
      return;
    }
    stack.push(val);
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        decirc(val[i], i, i, stack, val, depth, options);
      }
    } else {
      val = serializeWellKnownTypes(val);
      var keys = Object.keys(val);
      for (i = 0; i < keys.length; i++) {
        var key = keys[i];
        decirc(val[key], key, i, stack, val, depth, options);
      }
    }
    stack.pop();
  }
}
function replaceGetterValues(replacer) {
  replacer = typeof replacer !== "undefined" ? replacer : function(k, v) {
    return v;
  };
  return function(key, val) {
    if (replacerStack.length > 0) {
      for (var i = 0; i < replacerStack.length; i++) {
        var part = replacerStack[i];
        if (part[1] === key && part[0] === val) {
          val = part[2];
          replacerStack.splice(i, 1);
          break;
        }
      }
    }
    return replacer.call(this, key, val);
  };
}

// ../../node_modules/langsmith/dist/utils/worker_threads.js
import { Worker as NodeWorker } from "worker_threads";
var Worker = NodeWorker;
var WORKER_THREADS_AVAILABLE = true;

// ../../node_modules/langsmith/dist/utils/serialize_worker.js
var WORKER_SOURCE = (
  /* js */
  `
const { parentPort } = require("worker_threads");

const CIRCULAR_REPLACE_NODE = { result: "[Circular]" };

function serializeWellKnownTypes(val) {
  if (val && typeof val === "object") {
    if (val instanceof Map) return Object.fromEntries(val);
    if (val instanceof Set) return Array.from(val);
    if (val instanceof Date) return val.toISOString();
    if (val instanceof RegExp) return val.toString();
    if (val instanceof Error) return { name: val.name, message: val.message };
  } else if (typeof val === "bigint") {
    return val.toString();
  }
  return val;
}

function defaultReplacer(_key, val) {
  return serializeWellKnownTypes(val);
}

// Decirculate in-place: replace circular refs with { result: "[Circular]" }
// then restore after stringify. Mirrors fast-safe-stringify's decirc().
const restoreStack = [];
function decirc(val, k, stack, parent) {
  if (typeof val === "object" && val !== null) {
    for (let i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        const orig = parent[k];
        parent[k] = CIRCULAR_REPLACE_NODE;
        restoreStack.push([parent, k, orig]);
        return;
      }
    }
    stack.push(val);
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) decirc(val[i], i, stack, val);
    } else {
      const normalized = serializeWellKnownTypes(val);
      // Only recurse into normalized if it's still an object (arrays/objects),
      // else it was replaced with a primitive (e.g. Date -> string).
      if (normalized === val) {
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) decirc(val[keys[i]], keys[i], stack, val);
      }
    }
    stack.pop();
  }
}

function serialize(obj) {
  try {
    return JSON.stringify(obj, defaultReplacer);
  } catch (e) {
    if (!String(e && e.message).includes("Converting circular structure to JSON")) {
      return "[Unserializable]";
    }
    decirc(obj, "", [], { "": obj });
    try {
      return JSON.stringify(obj, defaultReplacer);
    } catch (_) {
      return "[unable to serialize, circular reference is too complex to analyze]";
    } finally {
      while (restoreStack.length) {
        const [p, k, v] = restoreStack.pop();
        p[k] = v;
      }
    }
  }
}

parentPort.on("message", (msg) => {
  const { id, op, payload } = msg;
  try {
    if (op === "serialize") {
      const str = serialize(payload);
      const buf = Buffer.from(str, "utf8");
      // Slice into its own ArrayBuffer so we can transfer without dragging
      // unrelated bytes from any shared pool buffer.
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      parentPort.postMessage({ id, bytes: ab, length: buf.byteLength }, [ab]);
    } else if (op === "ping") {
      parentPort.postMessage({ id });
    } else {
      parentPort.postMessage({ id, error: "unknown op: " + op });
    }
  } catch (e) {
    parentPort.postMessage({ id, error: String((e && e.message) || e) });
  }
});
`
);
var SerializeWorker = class {
  constructor() {
    Object.defineProperty(this, "worker", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "nextId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 1
    });
    Object.defineProperty(this, "pending", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "disabled", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "startPromise", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
  }
  /**
   * Try to construct the worker. Returns false if the runtime can't support
   * it -- in that case callers must fall back to synchronous serialization.
   * Kept async so callers don't have to branch on runtime -- the promise
   * resolves synchronously on the microtask queue when the worker module
   * is available, which is the common Node CJS/ESM path.
   */
  async ensureStarted() {
    if (this.disabled)
      return false;
    if (this.worker !== null)
      return true;
    if (this.startPromise !== null)
      return this.startPromise;
    this.startPromise = this._start();
    try {
      return await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }
  async _start() {
    if (!WORKER_THREADS_AVAILABLE || Worker === null) {
      this.disabled = true;
      return false;
    }
    try {
      const worker = new Worker(WORKER_SOURCE, { eval: true });
      worker.on("message", (msg) => {
        const p = this.pending.get(msg.id);
        if (!p)
          return;
        this.pending.delete(msg.id);
        if (msg.error) {
          p.reject(new Error(msg.error));
        } else if (msg.bytes && typeof msg.length === "number") {
          p.resolve(new Uint8Array(msg.bytes, 0, msg.length));
        } else {
          p.reject(new Error("worker returned malformed message"));
        }
      });
      worker.on("error", (err) => {
        for (const [, p] of this.pending)
          p.reject(err);
        this.pending.clear();
        this.disabled = true;
        this.worker = null;
      });
      worker.on("exit", (code) => {
        for (const [, p] of this.pending) {
          p.reject(new Error(`worker exited with code ${code}`));
        }
        this.pending.clear();
        this.worker = null;
      });
      worker.unref();
      this.worker = worker;
      return true;
    } catch {
      this.disabled = true;
      return false;
    }
  }
  /**
   * Serialize a payload off-thread. Rejects with DataCloneError (or similar)
   * if the payload contains non-cloneable values -- callers must catch and
   * fall back to synchronous serialize().
   *
   * Resolves with null if the worker subsystem is unavailable entirely,
   * so the caller can fall back without paying try/catch overhead.
   */
  async serialize(payload) {
    const ok = await this.ensureStarted();
    if (!ok)
      return null;
    const id = this.nextId++;
    return new Promise((resolve3, reject) => {
      this.pending.set(id, { resolve: resolve3, reject });
      try {
        this.worker.postMessage({ id, op: "serialize", payload });
      } catch (e) {
        this.pending.delete(id);
        reject(e);
      }
    });
  }
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    for (const [, p] of this.pending) {
      p.reject(new Error("worker terminated"));
    }
    this.pending.clear();
  }
};
var sharedWorker = null;
function getSharedSerializeWorker() {
  if (sharedWorker === null)
    sharedWorker = new SerializeWorker();
  return sharedWorker;
}
var LARGE_STRING_THRESHOLD = 64 * 1024;
var NODE_BUDGET = 2048;
function hasLargeString(value, threshold = LARGE_STRING_THRESHOLD, nodeBudget = NODE_BUDGET) {
  if (value === null || typeof value !== "object") {
    return typeof value === "string" && value.length >= threshold;
  }
  const stack = [value];
  const seen = /* @__PURE__ */ new Set();
  let visited = 0;
  while (stack.length > 0) {
    if (visited++ >= nodeBudget)
      return false;
    const cur = stack.pop();
    if (cur === null || cur === void 0)
      continue;
    const t = typeof cur;
    if (t === "string") {
      if (cur.length >= threshold)
        return true;
      continue;
    }
    if (t !== "object")
      continue;
    const obj = cur;
    if (seen.has(obj))
      continue;
    seen.add(obj);
    if (obj instanceof Date || obj instanceof RegExp || obj instanceof Error || obj instanceof ArrayBuffer || ArrayBuffer.isView(obj)) {
      continue;
    }
    if (Array.isArray(obj)) {
      for (let i = obj.length - 1; i >= 0; i--)
        stack.push(obj[i]);
      continue;
    }
    if (obj instanceof Map) {
      for (const [, v] of obj)
        stack.push(v);
      continue;
    }
    if (obj instanceof Set) {
      for (const v of obj)
        stack.push(v);
      continue;
    }
    const keys = Object.keys(obj);
    for (let i = keys.length - 1; i >= 0; i--) {
      stack.push(obj[keys[i]]);
    }
  }
  return false;
}

// ../../node_modules/langsmith/dist/client.js
function assertPullPublicPromptAllowed(promptIdentifier, dangerouslyPullPublicPrompt) {
  const [owner] = parseHubIdentifier(promptIdentifier);
  if (owner !== "-" && !dangerouslyPullPublicPrompt) {
    throw new Error("Pulling a public prompt by owner/name is disabled by default because prompts may contain untrusted serialized LangChain objects. If you trust this prompt, set `dangerouslyPullPublicPrompt: true` to acknowledge the risk.");
  }
}
function _ensureUTCTimestamp(ts) {
  if (typeof ts === "string" && ts.length > 0 && !ts.includes("Z") && !ts.includes("+") && !ts.includes("-", 10)) {
    return ts + "Z";
  }
  return ts;
}
function _normalizeRunTimestamps(run) {
  return {
    ...run,
    start_time: _ensureUTCTimestamp(run.start_time),
    end_time: _ensureUTCTimestamp(run.end_time)
  };
}
function mergeRuntimeEnvIntoRun(run, cachedEnvVars, omitTracedRuntimeInfo) {
  if (omitTracedRuntimeInfo) {
    return run;
  }
  const runtimeEnv = getRuntimeEnvironment2();
  const envVars = cachedEnvVars ?? getLangSmithEnvVarsMetadata();
  const extra = run.extra ?? {};
  const metadata = extra.metadata;
  run.extra = {
    ...extra,
    runtime: {
      ...runtimeEnv,
      ...extra?.runtime
    },
    metadata: {
      ...envVars,
      ...envVars.revision_id || "revision_id" in run && run.revision_id ? {
        revision_id: ("revision_id" in run ? run.revision_id : void 0) ?? envVars.revision_id
      } : {},
      ...metadata
    }
  };
  return run;
}
var getTracingSamplingRate = (configRate) => {
  const samplingRateStr = configRate?.toString() ?? getLangSmithEnvironmentVariable("TRACING_SAMPLING_RATE");
  if (samplingRateStr === void 0) {
    return void 0;
  }
  const samplingRate = parseFloat(samplingRateStr);
  if (samplingRate < 0 || samplingRate > 1) {
    throw new Error(`LANGSMITH_TRACING_SAMPLING_RATE must be between 0 and 1 if set. Got: ${samplingRate}`);
  }
  return samplingRate;
};
var isLocalhost = (url) => {
  const strippedUrl = url.replace("http://", "").replace("https://", "");
  const hostname = strippedUrl.split("/")[0].split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};
async function toArray(iterable) {
  const result = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}
function trimQuotes(str) {
  if (str === void 0) {
    return void 0;
  }
  return str.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}
var handle429 = async (response) => {
  if (response?.status === 429) {
    const retryAfter = parseInt(response.headers.get("retry-after") ?? "10", 10) * 1e3;
    if (retryAfter > 0) {
      await new Promise((resolve3) => setTimeout(resolve3, retryAfter));
      return true;
    }
  }
  return false;
};
function _formatFeedbackScore(score) {
  if (typeof score === "number") {
    return Number(score.toFixed(4));
  }
  return score;
}
var DEFAULT_UNCOMPRESSED_BATCH_SIZE_LIMIT_BYTES = 24 * 1024 * 1024;
var DEFAULT_MAX_SIZE_BYTES = 1024 * 1024 * 1024;
var SERVER_INFO_REQUEST_TIMEOUT_MS = 1e4;
var DEFAULT_BATCH_SIZE_LIMIT = 100;
var AutoBatchQueue = class {
  constructor(maxSizeBytes) {
    Object.defineProperty(this, "items", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "sizeBytes", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "maxSizeBytes", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxSizeBytes = maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  }
  peek() {
    return this.items[0];
  }
  push(item) {
    let itemPromiseResolve;
    const itemPromise = new Promise((resolve3) => {
      itemPromiseResolve = resolve3;
    });
    const size = estimateSerializedSize(item.item).size;
    if (this.sizeBytes + size > this.maxSizeBytes && this.items.length > 0) {
      console.warn(`AutoBatchQueue size limit (${this.maxSizeBytes} bytes) exceeded. Dropping run with id: ${item.item.id}. Current queue size: ${this.sizeBytes} bytes, attempted addition: ${size} bytes.`);
      itemPromiseResolve();
      return itemPromise;
    }
    this.items.push({
      action: item.action,
      payload: item.item,
      otelContext: item.otelContext,
      apiKey: item.apiKey,
      apiUrl: item.apiUrl,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      itemPromiseResolve,
      itemPromise,
      size
    });
    this.sizeBytes += size;
    return itemPromise;
  }
  pop({ upToSizeBytes, upToSize }) {
    if (upToSizeBytes < 1) {
      throw new Error("Number of bytes to pop off may not be less than 1.");
    }
    const popped = [];
    let poppedSizeBytes = 0;
    while (poppedSizeBytes + (this.peek()?.size ?? 0) < upToSizeBytes && this.items.length > 0 && popped.length < upToSize) {
      const item = this.items.shift();
      if (item) {
        popped.push(item);
        poppedSizeBytes += item.size;
        this.sizeBytes -= item.size;
      }
    }
    if (popped.length === 0 && this.items.length > 0) {
      const item = this.items.shift();
      popped.push(item);
      poppedSizeBytes += item.size;
      this.sizeBytes -= item.size;
    }
    return [
      popped.map((it) => ({
        action: it.action,
        item: it.payload,
        otelContext: it.otelContext,
        apiKey: it.apiKey,
        apiUrl: it.apiUrl,
        size: it.size
      })),
      () => popped.forEach((it) => it.itemPromiseResolve())
    ];
  }
};
var Client = class _Client {
  get tracingMode() {
    return this._tracingMode;
  }
  get _fetch() {
    const fetchImplementation = this.fetchImplementation || _getFetchImplementation(this.debug);
    return async (input, init) => {
      let authHeader;
      const profileManagedAuthorization = this.getProfileManagedAuthorizationHeader(init);
      if (this.apiKey !== void 0) {
        authHeader = { name: "x-api-key", value: `${this.apiKey}` };
      } else if (!this.hasExplicitAuthHeader(init, profileManagedAuthorization)) {
        authHeader = await this.profileAuth?.getAuthHeader(fetchImplementation, init?.signal);
      }
      return fetchImplementation(input, this.applyCurrentAuthHeaders(init, authHeader, profileManagedAuthorization));
    };
  }
  getProfileManagedAuthorizationHeader(init) {
    if (!init?.headers || !this.profileAuth) {
      return void 0;
    }
    const authorization = new Headers(init.headers).get("Authorization");
    if (!hasValue(authorization)) {
      return void 0;
    }
    return this.profileAuth.isProfileAuthorizationHeader(authorization ?? "") ? authorization ?? void 0 : void 0;
  }
  isProfileManagedAuthorizationHeader(value, profileManagedAuthorization) {
    return value === profileManagedAuthorization || this.profileAuth?.isProfileAuthorizationHeader(value) === true;
  }
  hasExplicitAuthHeader(init, profileManagedAuthorization) {
    if (!init?.headers) {
      return false;
    }
    const headers = new Headers(init.headers);
    if (hasValue(headers.get("x-api-key"))) {
      return true;
    }
    const authorization = headers.get("Authorization");
    if (!hasValue(authorization)) {
      return false;
    }
    return !this.isProfileManagedAuthorizationHeader(authorization ?? "", profileManagedAuthorization);
  }
  applyCurrentAuthHeaders(init, authHeader, profileManagedAuthorization) {
    if (!authHeader) {
      return init;
    }
    const applyAuth = (headers2) => {
      if (this.apiKey !== void 0 && authHeader.name === "x-api-key") {
        headers2.delete("Authorization");
        if (!headers2.has("x-api-key")) {
          headers2.set("x-api-key", authHeader.value);
        }
        return headers2;
      }
      if (authHeader.name === "Authorization") {
        if (hasValue(headers2.get("x-api-key"))) {
          return headers2;
        }
        const authorization3 = headers2.get("Authorization");
        if (hasValue(authorization3) && !this.isProfileManagedAuthorizationHeader(authorization3 ?? "", profileManagedAuthorization)) {
          return headers2;
        }
        headers2.set("Authorization", authHeader.value);
        return headers2;
      }
      const authorization2 = headers2.get("Authorization");
      if (hasValue(authorization2) && !this.isProfileManagedAuthorizationHeader(authorization2 ?? "", profileManagedAuthorization)) {
        return headers2;
      }
      if (hasValue(authorization2)) {
        headers2.delete("Authorization");
      }
      if (!headers2.has("x-api-key")) {
        headers2.set("x-api-key", authHeader.value);
      }
      return headers2;
    };
    if (!init) {
      return {
        headers: { [authHeader.name]: authHeader.value }
      };
    }
    if (init.headers instanceof Headers) {
      return { ...init, headers: applyAuth(new Headers(init.headers)) };
    }
    if (Array.isArray(init.headers)) {
      return { ...init, headers: applyAuth(new Headers(init.headers)) };
    }
    const headers = {
      ...init.headers ?? {}
    };
    const getHeaderKey = (name) => Object.keys(headers).find((key) => key.toLowerCase() === name);
    const getHeader = (name) => {
      const key = getHeaderKey(name);
      return key ? headers[key] : void 0;
    };
    const hasApiKey = hasValue(getHeader("x-api-key"));
    const authorization = getHeader("authorization");
    const hasExplicitAuthorization = hasValue(authorization) && !this.isProfileManagedAuthorizationHeader(authorization ?? "", profileManagedAuthorization);
    if (this.apiKey !== void 0 && authHeader.name === "x-api-key") {
      const authorizationKey = getHeaderKey("authorization");
      if (authorizationKey) {
        delete headers[authorizationKey];
      }
      if (!hasApiKey) {
        headers["x-api-key"] = authHeader.value;
      }
      return { ...init, headers };
    }
    if (authHeader.name === "Authorization") {
      if (!hasApiKey && !hasExplicitAuthorization) {
        const authorizationKey = getHeaderKey("authorization");
        if (authorizationKey && authorizationKey !== "Authorization") {
          delete headers[authorizationKey];
        }
        headers.Authorization = authHeader.value;
      }
      return { ...init, headers };
    }
    if (!hasExplicitAuthorization) {
      const authorizationKey = getHeaderKey("authorization");
      if (authorizationKey) {
        delete headers[authorizationKey];
      }
      if (!hasApiKey) {
        headers["x-api-key"] = authHeader.value;
      }
    }
    return { ...init, headers };
  }
  /**
   * Serialize a payload for tracing, optionally offloading the work to a
   * Node worker thread when the runtime supports worker_threads.
   *
   * Falls back to synchronous serialization when:
   *  - manualFlushMode is enabled (serverless: worker boot cost > benefit)
   *  - worker_threads is unavailable (non-Node runtimes)
   *  - the payload contains values that can't be structured-cloned across
   *    threads (functions, non-cloneable class instances, streams, etc.)
   *  - the worker throws for any other reason
   *
   * In all fallback cases the returned bytes are identical to the sync path.
   */
  _trackDrain(promise) {
    this._pendingDrains.add(promise);
    promise.finally(() => {
      this._pendingDrains.delete(promise);
    });
  }
  async _serializeBody(payload, errorContext) {
    if (this.manualFlushMode) {
      return serialize(payload, errorContext);
    }
    if (!hasLargeString(payload)) {
      return serialize(payload, errorContext);
    }
    if (this._serializeWorker === void 0) {
      this._serializeWorker = getSharedSerializeWorker();
    }
    if (this._serializeWorker === null) {
      return serialize(payload, errorContext);
    }
    try {
      const bytes = await this._serializeWorker.serialize(payload);
      if (bytes === null) {
        this._serializeWorker = null;
        return serialize(payload, errorContext);
      }
      return bytes;
    } catch {
      return serialize(payload, errorContext);
    }
  }
  constructor(config2 = {}) {
    Object.defineProperty(this, "apiKey", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "apiUrl", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "webUrl", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "workspaceId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "caller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "batchIngestCaller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "timeout_ms", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_tenantId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "hideInputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "hideOutputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "hideMetadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "omitTracedRuntimeInfo", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tracingSampleRate", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "filteredPostUuids", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
    Object.defineProperty(this, "autoBatchTracing", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "autoBatchQueue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "autoBatchTimeout", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "autoBatchAggregationDelayMs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 250
    });
    Object.defineProperty(this, "batchSizeBytesLimit", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "batchSizeLimit", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "fetchOptions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "settings", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "blockOnRootRunFinalization", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: getEnvironmentVariable2("LANGSMITH_TRACING_BACKGROUND") === "false"
    });
    Object.defineProperty(this, "traceBatchConcurrency", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5
    });
    Object.defineProperty(this, "_serverInfo", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_getServerInfoPromise", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "manualFlushMode", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "_serializeWorker", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_pendingDrains", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
    Object.defineProperty(this, "langSmithToOTELTranslator", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_tracingMode", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "langsmith"
    });
    Object.defineProperty(this, "fetchImplementation", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "cachedLSEnvVarsForMetadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_promptCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "profileAuth", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "multipartStreamingDisabled", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: getLangSmithEnvironmentVariable("DISABLE_MULTIPART_STREAMING") === "true"
    });
    Object.defineProperty(this, "_multipartDisabled", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "_runCompressionDisabled", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: getLangSmithEnvironmentVariable("DISABLE_RUN_COMPRESSION") === "true"
    });
    Object.defineProperty(this, "failedTracesDir", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "failedTracesMaxBytes", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 100 * 1024 * 1024
    });
    Object.defineProperty(this, "_customHeaders", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "debug", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: getEnvironmentVariable2("LANGSMITH_DEBUG") === "true"
    });
    const defaultConfig = _Client.getDefaultClientConfig();
    this.tracingSampleRate = getTracingSamplingRate(config2.tracingSamplingRate);
    this.apiUrl = trimQuotes(config2.apiUrl ?? defaultConfig.apiUrl) ?? "";
    if (this.apiUrl.endsWith("/")) {
      this.apiUrl = this.apiUrl.slice(0, -1);
    }
    const configuredApiKey = trimQuotes(config2.apiKey ?? defaultConfig.apiKey);
    this.apiKey = hasValue(configuredApiKey) ? configuredApiKey : void 0;
    this.profileAuth = this.apiKey !== void 0 ? void 0 : defaultConfig.profileAuth;
    this.webUrl = trimQuotes(config2.webUrl ?? defaultConfig.webUrl);
    if (this.webUrl?.endsWith("/")) {
      this.webUrl = this.webUrl.slice(0, -1);
    }
    this.workspaceId = trimQuotes(config2.workspaceId ?? defaultConfig.workspaceId);
    this.timeout_ms = config2.timeout_ms ?? 9e4;
    this.caller = new AsyncCaller({
      ...config2.callerOptions ?? {},
      maxRetries: 4,
      debug: config2.debug ?? this.debug
    });
    this.traceBatchConcurrency = config2.traceBatchConcurrency ?? this.traceBatchConcurrency;
    if (this.traceBatchConcurrency < 1) {
      throw new Error("Trace batch concurrency must be positive.");
    }
    this.debug = config2.debug ?? this.debug;
    this.fetchImplementation = config2.fetchImplementation;
    this.failedTracesDir = getLangSmithEnvironmentVariable("FAILED_TRACES_DIR") || void 0;
    const failedTracesMb = getLangSmithEnvironmentVariable("FAILED_TRACES_MAX_MB");
    if (failedTracesMb) {
      const n2 = parseInt(failedTracesMb, 10);
      if (Number.isFinite(n2) && n2 > 0) {
        this.failedTracesMaxBytes = n2 * 1024 * 1024;
      }
    }
    const maxMemory = config2.maxIngestMemoryBytes ?? DEFAULT_MAX_SIZE_BYTES;
    this.batchIngestCaller = new AsyncCaller({
      maxRetries: 4,
      maxConcurrency: this.traceBatchConcurrency,
      maxQueueSizeBytes: maxMemory,
      ...config2.callerOptions ?? {},
      onFailedResponseHook: handle429,
      debug: config2.debug ?? this.debug
    });
    this.hideInputs = config2.hideInputs ?? config2.anonymizer ?? defaultConfig.hideInputs;
    this.hideOutputs = config2.hideOutputs ?? config2.anonymizer ?? defaultConfig.hideOutputs;
    this.hideMetadata = config2.hideMetadata ?? defaultConfig.hideMetadata;
    this.omitTracedRuntimeInfo = config2.omitTracedRuntimeInfo ?? false;
    this.autoBatchTracing = config2.autoBatchTracing ?? this.autoBatchTracing;
    this.autoBatchQueue = new AutoBatchQueue(maxMemory);
    this.blockOnRootRunFinalization = config2.blockOnRootRunFinalization ?? this.blockOnRootRunFinalization;
    this.batchSizeBytesLimit = config2.batchSizeBytesLimit;
    this.batchSizeLimit = config2.batchSizeLimit;
    this.fetchOptions = config2.fetchOptions || {};
    this.manualFlushMode = config2.manualFlushMode ?? this.manualFlushMode;
    this._tracingMode = resolveTracingMode(config2.tracingMode);
    if (this._tracingMode === "otel") {
      this.langSmithToOTELTranslator = new LangSmithToOTELTranslator();
    }
    this.cachedLSEnvVarsForMetadata = getLangSmithEnvVarsMetadata();
    if (config2.cache !== void 0 && config2.disablePromptCache) {
      warnOnce("Both 'cache' and 'disablePromptCache' were provided. The 'cache' parameter is deprecated and will be removed in a future version. Using 'cache' parameter value.");
    }
    if (config2.cache !== void 0) {
      warnOnce("The 'cache' parameter is deprecated and will be removed in a future version. Use 'configureGlobalPromptCache()' to configure the global cache, or 'disablePromptCache: true' to disable caching for this client.");
      if (config2.cache === false) {
        this._promptCache = void 0;
      } else if (config2.cache === true) {
        this._promptCache = promptCacheSingleton;
      } else {
        this._promptCache = config2.cache;
      }
    } else if (!config2.disablePromptCache) {
      this._promptCache = promptCacheSingleton;
    }
    this._customHeaders = config2.headers ?? {};
  }
  static getDefaultClientConfig() {
    const profileConfig = loadProfileClientConfig();
    const envApiKey = getLangSmithEnvironmentVariable("API_KEY");
    const envApiUrl = getLangSmithEnvironmentVariable("ENDPOINT");
    const envWorkspaceId = getLangSmithEnvironmentVariable("WORKSPACE_ID");
    const envAuthSet = hasValue(envApiKey);
    const apiUrl = envApiUrl ?? profileConfig.apiUrl ?? DEFAULT_API_URL;
    const workspaceId = envWorkspaceId ?? profileConfig.workspaceId;
    const hideInputs = getLangSmithEnvironmentVariable("HIDE_INPUTS") === "true";
    const hideOutputs = getLangSmithEnvironmentVariable("HIDE_OUTPUTS") === "true";
    const hideMetadata = getLangSmithEnvironmentVariable("HIDE_METADATA") === "true";
    return {
      apiUrl,
      apiKey: envApiKey,
      webUrl: void 0,
      hideInputs,
      hideOutputs,
      hideMetadata,
      workspaceId,
      oauthAccessToken: !envAuthSet ? profileConfig.oauthAccessToken : void 0,
      oauthRefreshToken: !envAuthSet ? profileConfig.oauthRefreshToken : void 0,
      profileAuth: !envAuthSet ? profileConfig.profileAuth : void 0
    };
  }
  getHostUrl() {
    if (this.webUrl) {
      return this.webUrl;
    } else if (isLocalhost(this.apiUrl)) {
      this.webUrl = "http://localhost:3000";
      return this.webUrl;
    } else if (this.apiUrl.endsWith("/api/v1")) {
      this.webUrl = this.apiUrl.replace("/api/v1", "");
      return this.webUrl;
    } else if (this.apiUrl.includes("/api") && !this.apiUrl.split(".", 1)[0].endsWith("api")) {
      this.webUrl = this.apiUrl.replace("/api", "");
      return this.webUrl;
    } else if (this.apiUrl.split(".", 1)[0].includes("dev")) {
      this.webUrl = "https://dev.smith.langchain.com";
      return this.webUrl;
    } else if (this.apiUrl.split(".", 1)[0].includes("eu")) {
      this.webUrl = "https://eu.smith.langchain.com";
      return this.webUrl;
    } else if (this.apiUrl.split(".", 1)[0].includes("aws")) {
      this.webUrl = "https://aws.smith.langchain.com";
      return this.webUrl;
    } else if (this.apiUrl.split(".", 1)[0].includes("apac")) {
      this.webUrl = "https://apac.smith.langchain.com";
      return this.webUrl;
    } else if (this.apiUrl.split(".", 1)[0].includes("beta")) {
      this.webUrl = "https://beta.smith.langchain.com";
      return this.webUrl;
    } else {
      this.webUrl = "https://smith.langchain.com";
      return this.webUrl;
    }
  }
  get _mergedHeaders() {
    const headers = {
      "User-Agent": `langsmith-js/${__version__}`,
      ...this._customHeaders
    };
    if (this.apiKey !== void 0) {
      headers["x-api-key"] = `${this.apiKey}`;
    } else {
      const profileAuthHeader = this.profileAuth?.currentAuthHeader();
      if (profileAuthHeader) {
        headers[profileAuthHeader.name] = profileAuthHeader.value;
      }
    }
    if (this.workspaceId) {
      headers["x-tenant-id"] = this.workspaceId;
    }
    return headers;
  }
  /**
   * Get or set custom headers for the client.
   * Custom headers are merged with default headers (User-Agent, x-api-key, x-tenant-id).
   * Custom headers will not override the default required headers.
   */
  get headers() {
    return this._customHeaders;
  }
  set headers(value) {
    this._customHeaders = value ?? {};
  }
  _getPlatformEndpointPath(path3) {
    const needsV1Prefix = this.apiUrl.slice(-3) !== "/v1" && this.apiUrl.slice(-4) !== "/v1/";
    return needsV1Prefix ? `/v1/platform/${path3}` : `/platform/${path3}`;
  }
  async processInputs(inputs) {
    if (this.hideInputs === false) {
      return inputs;
    }
    if (this.hideInputs === true) {
      return {};
    }
    if (typeof this.hideInputs === "function") {
      return this.hideInputs(inputs);
    }
    return inputs;
  }
  async processOutputs(outputs) {
    if (this.hideOutputs === false) {
      return outputs;
    }
    if (this.hideOutputs === true) {
      return {};
    }
    if (typeof this.hideOutputs === "function") {
      return this.hideOutputs(outputs);
    }
    return outputs;
  }
  async processMetadata(metadata) {
    if (this.hideMetadata === false) {
      return metadata;
    }
    if (this.hideMetadata === true) {
      return {};
    }
    if (typeof this.hideMetadata === "function") {
      return this.hideMetadata(metadata);
    }
    return metadata;
  }
  /**
   * Filter content from new_token events to prevent streaming LLM output
   * from being uploaded via events.
   */
  _filterNewTokenEvents(events) {
    if (!events || events.length === 0) {
      return events;
    }
    return events.map((event) => {
      if (event.name === "new_token") {
        const { kwargs: _, ...rest } = event;
        return rest;
      }
      return event;
    });
  }
  async prepareRunCreateOrUpdateInputs(run) {
    const runParams = { ...run };
    if (runParams.inputs !== void 0) {
      runParams.inputs = await this.processInputs(runParams.inputs);
    }
    if (runParams.outputs !== void 0) {
      runParams.outputs = await this.processOutputs(runParams.outputs);
    }
    if (runParams.extra != null && "metadata" in runParams.extra) {
      runParams.extra = {
        ...runParams.extra,
        metadata: await this.processMetadata(runParams.extra.metadata)
      };
    }
    if (runParams.events !== void 0) {
      runParams.events = this._filterNewTokenEvents(runParams.events);
    }
    return runParams;
  }
  async _getResponse(path3, queryParams) {
    const paramsString = queryParams?.toString() ?? "";
    const url = `${this.apiUrl}${path3}?${paramsString}`;
    const response = await this.caller.call(async () => {
      const res = await this._fetch(url, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `fetch ${path3}`);
      return res;
    });
    return response;
  }
  async _get(path3, queryParams) {
    const response = await this._getResponse(path3, queryParams);
    return response.json();
  }
  async *_getPaginated(path3, queryParams = new URLSearchParams(), transform) {
    let offset = Number(queryParams.get("offset")) || 0;
    const limit = Number(queryParams.get("limit")) || 100;
    while (true) {
      queryParams.set("offset", String(offset));
      queryParams.set("limit", String(limit));
      const url = `${this.apiUrl}${path3}?${queryParams}`;
      const response = await this.caller.call(async () => {
        const res = await this._fetch(url, {
          method: "GET",
          headers: this._mergedHeaders,
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions
        });
        await raiseForStatus(res, `fetch ${path3}`);
        return res;
      });
      const items = transform ? transform(await response.json()) : await response.json();
      if (items.length === 0) {
        break;
      }
      yield items;
      if (items.length < limit) {
        break;
      }
      offset += items.length;
    }
  }
  async *_getCursorPaginatedList(path3, body = null, requestMethod = "POST", dataKey = "runs") {
    const bodyParams = body ? { ...body } : {};
    while (true) {
      const body2 = JSON.stringify(bodyParams);
      const response = await this.caller.call(async () => {
        const res = await this._fetch(`${this.apiUrl}${path3}`, {
          method: requestMethod,
          headers: {
            ...this._mergedHeaders,
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions,
          body: body2
        });
        await raiseForStatus(res, `fetch ${path3}`);
        return res;
      });
      const responseBody = await response.json();
      if (!responseBody) {
        break;
      }
      if (!responseBody[dataKey]) {
        break;
      }
      yield responseBody[dataKey];
      const cursors = responseBody.cursors;
      if (!cursors) {
        break;
      }
      if (!cursors.next) {
        break;
      }
      bodyParams.cursor = cursors.next;
    }
  }
  // Allows mocking for tests
  _shouldSample() {
    if (this.tracingSampleRate === void 0) {
      return true;
    }
    return Math.random() < this.tracingSampleRate;
  }
  _filterForSampling(runs, patch = false) {
    if (this.tracingSampleRate === void 0) {
      return runs;
    }
    if (patch) {
      const sampled = [];
      for (const run of runs) {
        if (!this.filteredPostUuids.has(run.trace_id)) {
          sampled.push(run);
        } else if (run.id === run.trace_id) {
          this.filteredPostUuids.delete(run.trace_id);
        }
      }
      return sampled;
    } else {
      const sampled = [];
      for (const run of runs) {
        const traceId = run.trace_id ?? run.id;
        if (this.filteredPostUuids.has(traceId)) {
          continue;
        }
        if (run.id === traceId) {
          if (this._shouldSample()) {
            sampled.push(run);
          } else {
            this.filteredPostUuids.add(traceId);
          }
        } else {
          sampled.push(run);
        }
      }
      return sampled;
    }
  }
  async _getBatchSizeLimitBytes() {
    const serverInfo = await this._ensureServerInfo();
    return this.batchSizeBytesLimit ?? serverInfo?.batch_ingest_config?.size_limit_bytes ?? DEFAULT_UNCOMPRESSED_BATCH_SIZE_LIMIT_BYTES;
  }
  /**
   * Get the maximum number of operations to batch in a single request.
   */
  async _getBatchSizeLimit() {
    const serverInfo = await this._ensureServerInfo();
    return this.batchSizeLimit ?? serverInfo?.batch_ingest_config?.size_limit ?? DEFAULT_BATCH_SIZE_LIMIT;
  }
  async _getDatasetExamplesMultiPartSupport() {
    const serverInfo = await this._ensureServerInfo();
    return serverInfo.instance_flags?.dataset_examples_multipart_enabled ?? false;
  }
  drainAutoBatchQueue({ batchSizeLimitBytes, batchSizeLimit }) {
    const promises2 = [];
    while (this.autoBatchQueue.items.length > 0) {
      const [batch, done] = this.autoBatchQueue.pop({
        upToSizeBytes: batchSizeLimitBytes,
        upToSize: batchSizeLimit
      });
      if (!batch.length) {
        done();
        break;
      }
      const batchesByDestination = batch.reduce((acc, item) => {
        const apiUrl = item.apiUrl ?? this.apiUrl;
        const apiKey = item.apiKey ?? this.apiKey;
        const isDefault = item.apiKey === this.apiKey && item.apiUrl === this.apiUrl;
        const batchKey = isDefault ? "default" : `${apiUrl}|${apiKey}`;
        if (!acc[batchKey]) {
          acc[batchKey] = [];
        }
        acc[batchKey].push(item);
        return acc;
      }, {});
      const batchPromises = [];
      for (const [batchKey, batch2] of Object.entries(batchesByDestination)) {
        const batchPromise = this._processBatch(batch2, {
          apiUrl: batchKey === "default" ? void 0 : batchKey.split("|")[0],
          apiKey: batchKey === "default" ? void 0 : batchKey.split("|")[1]
        });
        batchPromises.push(batchPromise);
      }
      const allBatchesPromise = Promise.all(batchPromises).finally(done);
      promises2.push(allBatchesPromise);
    }
    return Promise.all(promises2);
  }
  /**
   * Persist a failed trace payload to a local fallback directory.
   *
   * Saves a self-contained JSON file containing the endpoint path, the HTTP
   * headers required for replay, and the base64-encoded request body.
   * Can be replayed later with a simple POST:
   *
   *   POST /<endpoint>
   *   Content-Type: <value from saved headers>
   *   [Content-Encoding: <value from saved headers>]
   *   <decoded body>
   */
  static async _writeTraceToFallbackDir(directory, body, replayHeaders, endpoint, maxBytes) {
    try {
      const bodyBuffer = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
      const envelope = JSON.stringify({
        version: 1,
        endpoint,
        headers: replayHeaders,
        body_base64: bodyBuffer.toString("base64")
      });
      const filename = `trace_${Date.now()}_${v4_default().slice(0, 8)}.json`;
      const filepath = path.join(directory, filename);
      if (!_Client._fallbackDirsCreated.has(directory)) {
        await mkdir2(directory);
        _Client._fallbackDirsCreated.add(directory);
      }
      if (maxBytes !== void 0 && maxBytes > 0) {
        try {
          const entries = await readdir2(directory);
          const traceFiles = entries.filter((f3) => f3.startsWith("trace_") && f3.endsWith(".json"));
          let total = 0;
          for (const name of traceFiles) {
            const { size } = await stat2(path.join(directory, name));
            total += size;
          }
          if (total >= maxBytes) {
            console.warn(`Could not write trace to fallback dir ${directory} as it's already over size limit (${total} bytes >= ${maxBytes} bytes). Increase LANGSMITH_FAILED_TRACES_MAX_MB if possible.`);
            return;
          }
        } catch {
        }
      }
      await writeFileAtomic(filepath, envelope);
      console.warn(`LangSmith trace upload failed; data saved to ${filepath} for later replay.`);
    } catch (writeErr) {
      console.error(`LangSmith tracing error: could not write trace to fallback dir ${directory}:`, writeErr);
    }
  }
  async _processBatch(batch, options) {
    if (!batch.length) {
      return;
    }
    const batchSizeBytes = batch.reduce((sum, item) => sum + (item.size ?? 0), 0);
    try {
      if (this.langSmithToOTELTranslator !== void 0) {
        this._sendBatchToOTELTranslator(batch);
      } else {
        const ingestParams = {
          runCreates: batch.filter((item) => item.action === "create").map((item) => item.item),
          runUpdates: batch.filter((item) => item.action === "update").map((item) => item.item)
        };
        const serverInfo = await this._ensureServerInfo();
        const useMultipart = !this._multipartDisabled && (serverInfo?.batch_ingest_config?.use_multipart_endpoint ?? true);
        if (useMultipart) {
          const useGzip = !this._runCompressionDisabled && serverInfo?.instance_flags?.gzip_body_enabled;
          try {
            await this.multipartIngestRuns(ingestParams, {
              ...options,
              useGzip,
              sizeBytes: batchSizeBytes
            });
          } catch (e) {
            if (isLangSmithNotFoundError(e)) {
              this._multipartDisabled = true;
              await this.batchIngestRuns(ingestParams, {
                ...options,
                sizeBytes: batchSizeBytes
              });
            } else {
              throw e;
            }
          }
        } else {
          await this.batchIngestRuns(ingestParams, {
            ...options,
            sizeBytes: batchSizeBytes
          });
        }
      }
    } catch (e) {
      console.error("Error exporting batch:", e);
    }
  }
  _sendBatchToOTELTranslator(batch) {
    if (this.langSmithToOTELTranslator !== void 0) {
      const otelContextMap = /* @__PURE__ */ new Map();
      const operations = [];
      for (const item of batch) {
        if (item.item.id && item.otelContext) {
          otelContextMap.set(item.item.id, item.otelContext);
          if (item.action === "create") {
            operations.push({
              operation: "post",
              id: item.item.id,
              trace_id: item.item.trace_id ?? item.item.id,
              run: item.item
            });
          } else {
            operations.push({
              operation: "patch",
              id: item.item.id,
              trace_id: item.item.trace_id ?? item.item.id,
              run: item.item
            });
          }
        }
      }
      this.langSmithToOTELTranslator.exportBatch(operations, otelContextMap);
    }
  }
  async processRunOperation(item) {
    clearTimeout(this.autoBatchTimeout);
    this.autoBatchTimeout = void 0;
    item.item = mergeRuntimeEnvIntoRun(item.item, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo);
    const itemPromise = this.autoBatchQueue.push(item);
    if (this.manualFlushMode) {
      return itemPromise;
    }
    const sizeLimitBytes = await this._getBatchSizeLimitBytes();
    const sizeLimit = await this._getBatchSizeLimit();
    if (this.autoBatchQueue.sizeBytes > sizeLimitBytes || this.autoBatchQueue.items.length > sizeLimit) {
      this._trackDrain(this.drainAutoBatchQueue({
        batchSizeLimitBytes: sizeLimitBytes,
        batchSizeLimit: sizeLimit
      }));
    }
    if (this.autoBatchQueue.items.length > 0) {
      this.autoBatchTimeout = setTimeout(() => {
        this.autoBatchTimeout = void 0;
        this._trackDrain(this.drainAutoBatchQueue({
          batchSizeLimitBytes: sizeLimitBytes,
          batchSizeLimit: sizeLimit
        }));
      }, this.autoBatchAggregationDelayMs);
    }
    return itemPromise;
  }
  async _getServerInfo() {
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/info`, {
        method: "GET",
        headers: { ...this._mergedHeaders, Accept: "application/json" },
        signal: AbortSignal.timeout(SERVER_INFO_REQUEST_TIMEOUT_MS),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "get server info");
      return res;
    });
    const json = await response.json();
    if (this.debug) {
      console.log("\n=== LangSmith Server Configuration ===\n" + JSON.stringify(json, null, 2) + "\n");
    }
    return json;
  }
  async _ensureServerInfo() {
    if (this._getServerInfoPromise === void 0) {
      this._getServerInfoPromise = (async () => {
        if (this._serverInfo === void 0) {
          try {
            this._serverInfo = await this._getServerInfo();
          } catch (e) {
            console.warn(`[LANGSMITH]: Failed to fetch info on supported operations. Falling back to batch operations and default limits. Info: ${e.status ?? "Unspecified status code"} ${e.message}`);
          }
        }
        return this._serverInfo ?? {};
      })();
    }
    return this._getServerInfoPromise.then((serverInfo) => {
      if (this._serverInfo === void 0) {
        this._getServerInfoPromise = void 0;
      }
      return serverInfo;
    });
  }
  async _getSettings() {
    if (!this.settings) {
      this.settings = this._get("/settings");
    }
    return await this.settings;
  }
  /**
   * Flushes current queued traces.
   */
  async flush() {
    const sizeLimitBytes = await this._getBatchSizeLimitBytes();
    const sizeLimit = await this._getBatchSizeLimit();
    await this.drainAutoBatchQueue({
      batchSizeLimitBytes: sizeLimitBytes,
      batchSizeLimit: sizeLimit
    });
  }
  _cloneCurrentOTELContext() {
    const otel_trace = getOTELTrace();
    const otel_context = getOTELContext();
    if (this.langSmithToOTELTranslator !== void 0) {
      const currentSpan = otel_trace.getActiveSpan();
      if (currentSpan) {
        return otel_trace.setSpan(otel_context.active(), currentSpan);
      }
    }
    return void 0;
  }
  async createRun(run, options) {
    if (!this._filterForSampling([run]).length) {
      return;
    }
    const headers = {
      ...this._mergedHeaders,
      "Content-Type": "application/json"
    };
    const session_name = run.project_name;
    delete run.project_name;
    const runCreate = await this.prepareRunCreateOrUpdateInputs({
      session_name,
      ...run,
      start_time: run.start_time ?? Date.now()
    });
    if (this.autoBatchTracing && runCreate.trace_id !== void 0 && runCreate.dotted_order !== void 0) {
      const otelContext = this._cloneCurrentOTELContext();
      void this.processRunOperation({
        action: "create",
        item: runCreate,
        otelContext,
        apiKey: options?.apiKey,
        apiUrl: options?.apiUrl
      }).catch(console.error);
      return;
    }
    const mergedRunCreateParam = mergeRuntimeEnvIntoRun(runCreate, this.cachedLSEnvVarsForMetadata, this.omitTracedRuntimeInfo);
    if (options?.apiKey !== void 0) {
      headers["x-api-key"] = options.apiKey;
    }
    if (options?.workspaceId !== void 0) {
      headers["x-tenant-id"] = options.workspaceId;
    }
    const body = serialize(mergedRunCreateParam, `Creating run with id: ${mergedRunCreateParam.id}`);
    await this.caller.call(async () => {
      const res = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "create run", true);
      return res;
    });
  }
  /**
   * Batch ingest/upsert multiple runs in the Langsmith system.
   * @param runs
   */
  async batchIngestRuns({ runCreates, runUpdates }, options) {
    if (runCreates === void 0 && runUpdates === void 0) {
      return;
    }
    let preparedCreateParams = await Promise.all(runCreates?.map((create) => this.prepareRunCreateOrUpdateInputs(create)) ?? []);
    let preparedUpdateParams = await Promise.all(runUpdates?.map((update) => this.prepareRunCreateOrUpdateInputs(update)) ?? []);
    if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
      const createById = preparedCreateParams.reduce((params, run) => {
        if (!run.id) {
          return params;
        }
        params[run.id] = run;
        return params;
      }, {});
      const standaloneUpdates = [];
      for (const updateParam of preparedUpdateParams) {
        if (updateParam.id !== void 0 && createById[updateParam.id]) {
          createById[updateParam.id] = {
            ...createById[updateParam.id],
            ...updateParam
          };
        } else {
          standaloneUpdates.push(updateParam);
        }
      }
      preparedCreateParams = Object.values(createById);
      preparedUpdateParams = standaloneUpdates;
    }
    const rawBatch = {
      post: preparedCreateParams,
      patch: preparedUpdateParams
    };
    if (!rawBatch.post.length && !rawBatch.patch.length) {
      return;
    }
    const batchChunks = {
      post: [],
      patch: []
    };
    for (const k of ["post", "patch"]) {
      const key = k;
      const batchItems = rawBatch[key].reverse();
      let batchItem = batchItems.pop();
      while (batchItem !== void 0) {
        batchChunks[key].push(batchItem);
        batchItem = batchItems.pop();
      }
    }
    if (batchChunks.post.length > 0 || batchChunks.patch.length > 0) {
      const runIds = batchChunks.post.map((item) => item.id).concat(batchChunks.patch.map((item) => item.id)).join(",");
      await this._postBatchIngestRuns(await this._serializeBody(batchChunks, `Ingesting runs with ids: ${runIds}`), options);
    }
  }
  async _postBatchIngestRuns(body, options) {
    const headers = {
      ...this._mergedHeaders,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (options?.apiKey !== void 0) {
      headers["x-api-key"] = options.apiKey;
    }
    await this.batchIngestCaller.callWithOptions({ sizeBytes: options?.sizeBytes }, async () => {
      const res = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs/batch`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "batch create run", true);
      return res;
    });
  }
  /**
   * Batch ingest/upsert multiple runs in the Langsmith system.
   * @param runs
   */
  async multipartIngestRuns({ runCreates, runUpdates }, options) {
    if (runCreates === void 0 && runUpdates === void 0) {
      return;
    }
    const allAttachments = {};
    let preparedCreateParams = [];
    for (const create of runCreates ?? []) {
      const preparedCreate = await this.prepareRunCreateOrUpdateInputs(create);
      if (preparedCreate.id !== void 0 && preparedCreate.attachments !== void 0) {
        allAttachments[preparedCreate.id] = preparedCreate.attachments;
      }
      delete preparedCreate.attachments;
      preparedCreateParams.push(preparedCreate);
    }
    let preparedUpdateParams = [];
    for (const update of runUpdates ?? []) {
      preparedUpdateParams.push(await this.prepareRunCreateOrUpdateInputs(update));
    }
    const invalidRunCreate = preparedCreateParams.find((runCreate) => {
      return runCreate.trace_id === void 0 || runCreate.dotted_order === void 0;
    });
    if (invalidRunCreate !== void 0) {
      throw new Error(`Multipart ingest requires "trace_id" and "dotted_order" to be set when creating a run`);
    }
    const invalidRunUpdate = preparedUpdateParams.find((runUpdate) => {
      return runUpdate.trace_id === void 0 || runUpdate.dotted_order === void 0;
    });
    if (invalidRunUpdate !== void 0) {
      throw new Error(`Multipart ingest requires "trace_id" and "dotted_order" to be set when updating a run`);
    }
    if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
      const createById = preparedCreateParams.reduce((params, run) => {
        if (!run.id) {
          return params;
        }
        params[run.id] = run;
        return params;
      }, {});
      const standaloneUpdates = [];
      for (const updateParam of preparedUpdateParams) {
        if (updateParam.id !== void 0 && createById[updateParam.id]) {
          createById[updateParam.id] = {
            ...createById[updateParam.id],
            ...updateParam
          };
        } else {
          standaloneUpdates.push(updateParam);
        }
      }
      preparedCreateParams = Object.values(createById);
      preparedUpdateParams = standaloneUpdates;
    }
    if (preparedCreateParams.length === 0 && preparedUpdateParams.length === 0) {
      return;
    }
    const accumulatedContext = [];
    const accumulatedParts = [];
    for (const [method, payloads] of [
      ["post", preparedCreateParams],
      ["patch", preparedUpdateParams]
    ]) {
      for (const originalPayload of payloads) {
        const { inputs, outputs, events, extra, error, serialized, attachments, ...payload } = originalPayload;
        const fields = { inputs, outputs, events, extra, error, serialized };
        const stringifiedPayload = await this._serializeBody(payload, `Serializing for multipart ingestion of run with id: ${payload.id}`);
        accumulatedParts.push({
          name: `${method}.${payload.id}`,
          payload: new Blob([stringifiedPayload], {
            type: `application/json; length=${stringifiedPayload.length}`
            // encoding=gzip
          })
        });
        for (const [key, value] of Object.entries(fields)) {
          if (value === void 0) {
            continue;
          }
          const stringifiedValue = await this._serializeBody(value, `Serializing ${key} for multipart ingestion of run with id: ${payload.id}`);
          accumulatedParts.push({
            name: `${method}.${payload.id}.${key}`,
            payload: new Blob([stringifiedValue], {
              type: `application/json; length=${stringifiedValue.length}`
            })
          });
        }
        if (payload.id !== void 0) {
          const attachments2 = allAttachments[payload.id];
          if (attachments2) {
            delete allAttachments[payload.id];
            for (const [name, attachment] of Object.entries(attachments2)) {
              let contentType;
              let content;
              if (Array.isArray(attachment)) {
                [contentType, content] = attachment;
              } else {
                contentType = attachment.mimeType;
                content = attachment.data;
              }
              if (name.includes(".")) {
                console.warn(`Skipping attachment '${name}' for run ${payload.id}: Invalid attachment name. Attachment names must not contain periods ('.'). Please rename the attachment and try again.`);
                continue;
              }
              accumulatedParts.push({
                name: `attachment.${payload.id}.${name}`,
                payload: new Blob([content], {
                  type: `${contentType}; length=${content.byteLength}`
                })
              });
            }
          }
        }
        accumulatedContext.push(`trace=${payload.trace_id},id=${payload.id}`);
      }
    }
    await this._sendMultipartRequest(accumulatedParts, accumulatedContext.join("; "), options);
  }
  async _createNodeFetchBody(parts, boundary) {
    const chunks = [];
    for (const part of parts) {
      chunks.push(new Blob([`--${boundary}\r
`]));
      chunks.push(new Blob([
        `Content-Disposition: form-data; name="${part.name}"\r
`,
        `Content-Type: ${part.payload.type}\r
\r
`
      ]));
      chunks.push(part.payload);
      chunks.push(new Blob(["\r\n"]));
    }
    chunks.push(new Blob([`--${boundary}--\r
`]));
    const body = new Blob(chunks);
    const arrayBuffer = await body.arrayBuffer();
    return arrayBuffer;
  }
  async _createMultipartStream(parts, boundary) {
    const encoder2 = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const writeChunk = async (chunk) => {
          if (typeof chunk === "string") {
            controller.enqueue(encoder2.encode(chunk));
          } else {
            controller.enqueue(chunk);
          }
        };
        for (const part of parts) {
          await writeChunk(`--${boundary}\r
`);
          await writeChunk(`Content-Disposition: form-data; name="${part.name}"\r
`);
          await writeChunk(`Content-Type: ${part.payload.type}\r
\r
`);
          const payloadStream = part.payload.stream();
          const reader = payloadStream.getReader();
          try {
            let result;
            while (!(result = await reader.read()).done) {
              controller.enqueue(result.value);
            }
          } finally {
            reader.releaseLock();
          }
          await writeChunk("\r\n");
        }
        await writeChunk(`--${boundary}--\r
`);
        controller.close();
      }
    });
    return stream;
  }
  async _sendMultipartRequest(parts, context, options) {
    const boundary = "----LangSmithFormBoundary" + Math.random().toString(36).slice(2);
    const buildBuffered = () => this._createNodeFetchBody(parts, boundary);
    const buildStream = () => this._createMultipartStream(parts, boundary);
    const sendWithRetry = async (bodyFactory) => {
      return this.batchIngestCaller.callWithOptions({ sizeBytes: options?.sizeBytes }, async () => {
        const body = await bodyFactory();
        const headers = {
          ...this._mergedHeaders,
          "Content-Type": `multipart/form-data; boundary=${boundary}`
        };
        if (options?.apiKey !== void 0) {
          headers["x-api-key"] = options.apiKey;
        }
        let transformedBody = body;
        if (options?.useGzip && typeof body === "object" && "pipeThrough" in body) {
          transformedBody = body.pipeThrough(new CompressionStream("gzip"));
          headers["Content-Encoding"] = "gzip";
        }
        const response = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs/multipart`, {
          method: "POST",
          headers,
          body: transformedBody,
          duplex: "half",
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions
        });
        await raiseForStatus(response, `Failed to send multipart request`, true);
        return response;
      });
    };
    try {
      let res;
      let streamedAttempt = false;
      const shouldStream = _shouldStreamForGlobalFetchImplementation();
      if (shouldStream && !this.multipartStreamingDisabled && getEnv2() !== "bun") {
        streamedAttempt = true;
        res = await sendWithRetry(buildStream);
      } else {
        res = await sendWithRetry(buildBuffered);
      }
      if ((!this.multipartStreamingDisabled || streamedAttempt) && res.status === 422 && (options?.apiUrl ?? this.apiUrl) !== DEFAULT_API_URL) {
        console.warn(`Streaming multipart upload to ${options?.apiUrl ?? this.apiUrl}/runs/multipart failed. This usually means the host does not support chunked uploads. Retrying with a buffered upload for operation "${context}".`);
        this.multipartStreamingDisabled = true;
        res = await sendWithRetry(buildBuffered);
      }
    } catch (e) {
      if (isLangSmithNotFoundError(e)) {
        throw e;
      }
      console.warn(`${e.message.trim()}

Context: ${context}`);
      if (this.failedTracesDir) {
        const bodyBuffer = await this._createNodeFetchBody(parts, boundary).catch(() => null);
        if (bodyBuffer) {
          await _Client._writeTraceToFallbackDir(this.failedTracesDir, bodyBuffer, { "Content-Type": `multipart/form-data; boundary=${boundary}` }, "runs/multipart", this.failedTracesMaxBytes);
        }
      }
    }
  }
  async updateRun(runId, run, options) {
    assertUuid(runId);
    if (run.inputs) {
      run.inputs = await this.processInputs(run.inputs);
    }
    if (run.outputs) {
      run.outputs = await this.processOutputs(run.outputs);
    }
    if (run.extra != null && "metadata" in run.extra) {
      run.extra = {
        ...run.extra,
        metadata: await this.processMetadata(run.extra.metadata)
      };
    }
    if (run.events) {
      run.events = this._filterNewTokenEvents(run.events);
    }
    const data = { ...run, id: runId };
    if (!this._filterForSampling([data], true).length) {
      return;
    }
    if (this.autoBatchTracing && data.trace_id !== void 0 && data.dotted_order !== void 0) {
      const otelContext = this._cloneCurrentOTELContext();
      if (run.end_time !== void 0 && data.parent_run_id === void 0 && this.blockOnRootRunFinalization && !this.manualFlushMode) {
        await this.processRunOperation({
          action: "update",
          item: data,
          otelContext,
          apiKey: options?.apiKey,
          apiUrl: options?.apiUrl
        }).catch(console.error);
        return;
      } else {
        void this.processRunOperation({
          action: "update",
          item: data,
          otelContext,
          apiKey: options?.apiKey,
          apiUrl: options?.apiUrl
        }).catch(console.error);
      }
      return;
    }
    const headers = {
      ...this._mergedHeaders,
      "Content-Type": "application/json"
    };
    if (options?.apiKey !== void 0) {
      headers["x-api-key"] = options.apiKey;
    }
    if (options?.workspaceId !== void 0) {
      headers["x-tenant-id"] = options.workspaceId;
    }
    const body = serialize(run, `Serializing payload to update run with id: ${runId}`);
    await this.caller.call(async () => {
      const res = await this._fetch(`${options?.apiUrl ?? this.apiUrl}/runs/${runId}`, {
        method: "PATCH",
        headers,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update run", true);
      return res;
    });
  }
  async readRun(runId, { loadChildRuns } = { loadChildRuns: false }) {
    assertUuid(runId);
    let run = _normalizeRunTimestamps(await this._get(`/runs/${runId}`));
    if (loadChildRuns) {
      run = await this._loadChildRuns(run);
    }
    return run;
  }
  async getRunUrl({ runId, run, projectOpts }) {
    if (run !== void 0) {
      let sessionId;
      if (run.session_id) {
        sessionId = run.session_id;
      } else if (projectOpts?.projectName) {
        sessionId = (await this.readProject({ projectName: projectOpts?.projectName })).id;
      } else if (projectOpts?.projectId) {
        sessionId = projectOpts?.projectId;
      } else {
        const project = await this.readProject({
          projectName: getLangSmithEnvironmentVariable("PROJECT") || "default"
        });
        sessionId = project.id;
      }
      const tenantId = await this._getTenantId();
      return `${this.getHostUrl()}/o/${tenantId}/projects/p/${sessionId}/r/${run.id}?poll=true`;
    } else if (runId !== void 0) {
      const run_ = await this.readRun(runId);
      if (!run_.app_path) {
        throw new Error(`Run ${runId} has no app_path`);
      }
      const baseUrl = this.getHostUrl();
      return `${baseUrl}${run_.app_path}`;
    } else {
      throw new Error("Must provide either runId or run");
    }
  }
  async _loadChildRuns(run) {
    const childRuns = await toArray(this.listRuns({
      isRoot: false,
      projectId: run.session_id,
      traceId: run.trace_id
    }));
    const treemap = {};
    const runs = {};
    childRuns.sort((a, b) => (a?.dotted_order ?? "").localeCompare(b?.dotted_order ?? ""));
    for (const childRun of childRuns) {
      if (childRun.parent_run_id === null || childRun.parent_run_id === void 0) {
        throw new Error(`Child run ${childRun.id} has no parent`);
      }
      if (childRun.dotted_order?.startsWith(run.dotted_order ?? "") && childRun.id !== run.id) {
        if (!(childRun.parent_run_id in treemap)) {
          treemap[childRun.parent_run_id] = [];
        }
        treemap[childRun.parent_run_id].push(childRun);
        runs[childRun.id] = childRun;
      }
    }
    run.child_runs = treemap[run.id] || [];
    for (const runId in treemap) {
      if (runId !== run.id) {
        runs[runId].child_runs = treemap[runId];
      }
    }
    return run;
  }
  /**
   * List runs from the LangSmith server.
   * @param projectId - The ID of the project to filter by.
   * @param projectName - The name of the project to filter by.
   * @param parentRunId - The ID of the parent run to filter by.
   * @param traceId - The ID of the trace to filter by.
   * @param referenceExampleId - The ID of the reference example to filter by.
   * @param startTime - The start time to filter by.
   * @param isRoot - Indicates whether to only return root runs.
   * @param runType - The run type to filter by.
   * @param error - Indicates whether to filter by error runs.
   * @param id - The ID of the run to filter by.
   * @param query - The query string to filter by.
   * @param filter - The filter string to apply to the run spans.
   * @param traceFilter - The filter string to apply on the root run of the trace.
   * @param treeFilter - The filter string to apply on other runs in the trace.
   * @param limit - The maximum number of runs to retrieve.
   * @returns {AsyncIterable<Run>} - The runs.
   *
   * @example
   * // List all runs in a project
   * const projectRuns = client.listRuns({ projectName: "<your_project>" });
   *
   * @example
   * // List LLM and Chat runs in the last 24 hours
   * const todaysLLMRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   start_time: new Date(Date.now() - 24 * 60 * 60 * 1000),
   *   run_type: "llm",
   * });
   *
   * @example
   * // List traces in a project
   * const rootRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   execution_order: 1,
   * });
   *
   * @example
   * // List runs without errors
   * const correctRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   error: false,
   * });
   *
   * @example
   * // List runs by run ID
   * const runIds = [
   *   "a36092d2-4ad5-4fb4-9c0d-0dba9a2ed836",
   *   "9398e6be-964f-4aa4-8ae9-ad78cd4b7074",
   * ];
   * const selectedRuns = client.listRuns({ run_ids: runIds });
   *
   * @example
   * // List all "chain" type runs that took more than 10 seconds and had `total_tokens` greater than 5000
   * const chainRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'and(eq(run_type, "chain"), gt(latency, 10), gt(total_tokens, 5000))',
   * });
   *
   * @example
   * // List all runs called "extractor" whose root of the trace was assigned feedback "user_score" score of 1
   * const goodExtractorRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'eq(name, "extractor")',
   *   traceFilter: 'and(eq(feedback_key, "user_score"), eq(feedback_score, 1))',
   * });
   *
   * @example
   * // List all runs that started after a specific timestamp and either have "error" not equal to null or a "Correctness" feedback score equal to 0
   * const complexRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'and(gt(start_time, "2023-07-15T12:34:56Z"), or(neq(error, null), and(eq(feedback_key, "Correctness"), eq(feedback_score, 0.0))))',
   * });
   *
   * @example
   * // List all runs where `tags` include "experimental" or "beta" and `latency` is greater than 2 seconds
   * const taggedRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'and(or(has(tags, "experimental"), has(tags, "beta")), gt(latency, 2))',
   * });
   */
  async *listRuns(props) {
    const { projectId, projectName, parentRunId, traceId, referenceExampleId, startTime, executionOrder, isRoot, runType, error, id, query, filter, traceFilter, treeFilter, limit, select, order } = props;
    let projectIds = [];
    if (projectId) {
      projectIds = Array.isArray(projectId) ? projectId : [projectId];
    }
    if (projectName) {
      const projectNames = Array.isArray(projectName) ? projectName : [projectName];
      const projectIds_ = await Promise.all(projectNames.map((name) => this.readProject({ projectName: name }).then((project) => project.id)));
      projectIds.push(...projectIds_);
    }
    const default_select = [
      "app_path",
      "completion_cost",
      "completion_tokens",
      "dotted_order",
      "end_time",
      "error",
      "events",
      "extra",
      "feedback_stats",
      "first_token_time",
      "id",
      "inputs",
      "name",
      "outputs",
      "parent_run_id",
      "parent_run_ids",
      "prompt_cost",
      "prompt_tokens",
      "reference_example_id",
      "run_type",
      "session_id",
      "start_time",
      "status",
      "tags",
      "total_cost",
      "total_tokens",
      "trace_id"
    ];
    const body = {
      session: projectIds.length ? projectIds : null,
      run_type: runType,
      reference_example: referenceExampleId,
      query,
      filter,
      trace_filter: traceFilter,
      tree_filter: treeFilter,
      execution_order: executionOrder,
      parent_run: parentRunId,
      start_time: startTime ? startTime.toISOString() : null,
      error,
      id,
      limit,
      trace: traceId,
      select: select ? select : default_select,
      is_root: isRoot,
      order
    };
    if (body.select.includes("child_run_ids")) {
      warnOnce("Deprecated: 'child_run_ids' in the listRuns select parameter is deprecated and will be removed in a future version.");
    }
    let runsYielded = 0;
    for await (const runs of this._getCursorPaginatedList("/runs/query", body)) {
      const normalized = runs.map(_normalizeRunTimestamps);
      if (limit) {
        if (runsYielded >= limit) {
          break;
        }
        if (normalized.length + runsYielded > limit) {
          const newRuns = normalized.slice(0, limit - runsYielded);
          yield* newRuns;
          break;
        }
        runsYielded += normalized.length;
        yield* normalized;
      } else {
        yield* normalized;
      }
    }
  }
  async *listGroupRuns(props) {
    const { projectId, projectName, groupBy, filter, startTime, endTime, limit, offset } = props;
    const sessionId = projectId || (await this.readProject({ projectName })).id;
    const baseBody = {
      session_id: sessionId,
      group_by: groupBy,
      filter,
      start_time: startTime ? startTime.toISOString() : null,
      end_time: endTime ? endTime.toISOString() : null,
      limit: Number(limit) || 100
    };
    let currentOffset = Number(offset) || 0;
    const path3 = "/runs/group";
    const url = `${this.apiUrl}${path3}`;
    while (true) {
      const currentBody = {
        ...baseBody,
        offset: currentOffset
      };
      const filteredPayload = Object.fromEntries(Object.entries(currentBody).filter(([_, value]) => value !== void 0));
      const body = JSON.stringify(filteredPayload);
      const response = await this.caller.call(async () => {
        const res = await this._fetch(url, {
          method: "POST",
          headers: {
            ...this._mergedHeaders,
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions,
          body
        });
        await raiseForStatus(res, `Failed to fetch ${path3}`);
        return res;
      });
      const items = await response.json();
      const { groups, total } = items;
      if (groups.length === 0) {
        break;
      }
      for (const thread of groups) {
        yield thread;
      }
      currentOffset += groups.length;
      if (currentOffset >= total) {
        break;
      }
    }
  }
  async *readThread(props) {
    const { threadId, projectId, projectName, isRoot = true, limit, filter: userFilter, order = "asc" } = props;
    if (!projectId && !projectName) {
      throw new Error("threadId requires projectId or projectName");
    }
    const threadFilter = `eq(thread_id, ${JSON.stringify(threadId)})`;
    const combinedFilter = userFilter ? `and(${threadFilter}, ${userFilter})` : threadFilter;
    yield* this.listRuns({
      projectId: projectId ?? void 0,
      projectName: projectName ?? void 0,
      isRoot,
      limit,
      filter: combinedFilter,
      order
    });
  }
  async listThreads(props) {
    const { projectId, projectName, limit, offset = 0, filter, startTime, isRoot = true } = props;
    if (!projectId && !projectName) {
      throw new Error("Either projectId or projectName must be provided");
    }
    if (projectId && projectName) {
      throw new Error("Provide exactly one of projectId or projectName");
    }
    const sessionId = projectId ?? (await this.readProject({ projectName })).id;
    const startTimeResolved = startTime ?? new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3);
    const runSelect = [
      "id",
      "name",
      "status",
      "start_time",
      "end_time",
      "thread_id",
      "trace_id",
      "run_type",
      "error",
      "tags",
      "session_id",
      "parent_run_id",
      "total_tokens",
      "total_cost",
      "dotted_order",
      "reference_example_id",
      "feedback_stats",
      "app_path",
      "completion_cost",
      "completion_tokens",
      "prompt_cost",
      "prompt_tokens",
      "first_token_time"
    ];
    const bodyQuery = {
      session: [sessionId],
      is_root: isRoot,
      limit: 100,
      order: "desc",
      select: runSelect,
      start_time: startTimeResolved.toISOString()
    };
    if (filter != null) {
      bodyQuery.filter = filter;
    }
    const threadsMap = /* @__PURE__ */ new Map();
    for await (const runs of this._getCursorPaginatedList("/runs/query", bodyQuery)) {
      for (const raw of runs) {
        const run = _normalizeRunTimestamps(raw);
        const tid = run.thread_id;
        if (tid) {
          const list = threadsMap.get(tid) ?? [];
          list.push(run);
          threadsMap.set(tid, list);
        }
      }
    }
    const result = [];
    for (const [threadId, runs] of threadsMap.entries()) {
      runs.sort((a, b) => {
        const aRun = a;
        const bRun = b;
        const aStart = aRun.start_time ?? "";
        const bStart = bRun.start_time ?? "";
        if (aStart !== bStart)
          return aStart.localeCompare(bStart);
        const aOrder = aRun.dotted_order ?? "";
        const bOrder = bRun.dotted_order ?? "";
        return aOrder.localeCompare(bOrder);
      });
      const startTimes = runs.map((r) => r.start_time).filter(Boolean);
      const sortedTimes = [...startTimes].sort();
      const minStart = sortedTimes.length ? sortedTimes[0] : "";
      const maxStart = sortedTimes.length ? sortedTimes[sortedTimes.length - 1] : "";
      result.push({
        thread_id: threadId,
        runs,
        count: runs.length,
        filter: "",
        total_tokens: 0,
        total_cost: null,
        min_start_time: minStart,
        max_start_time: maxStart,
        latency_p50: 0,
        latency_p99: 0,
        feedback_stats: null,
        first_inputs: "",
        last_outputs: "",
        last_error: null
      });
    }
    result.sort((a, b) => {
      const aMax = a.max_start_time ?? "";
      const bMax = b.max_start_time ?? "";
      return bMax.localeCompare(aMax);
    });
    const withOffset = offset > 0 ? result.slice(offset) : result;
    const withLimit = limit !== void 0 ? withOffset.slice(0, limit) : withOffset;
    return withLimit;
  }
  async getRunStats({ id, trace, parentRun, runType, projectNames, projectIds, referenceExampleIds, startTime, endTime, error, query, filter, traceFilter, treeFilter, isRoot, dataSourceType }) {
    let projectIds_ = projectIds || [];
    if (projectNames) {
      projectIds_ = [
        ...projectIds || [],
        ...await Promise.all(projectNames.map((name) => this.readProject({ projectName: name }).then((project) => project.id)))
      ];
    }
    const payload = {
      id,
      trace,
      parent_run: parentRun,
      run_type: runType,
      session: projectIds_,
      reference_example: referenceExampleIds,
      start_time: startTime,
      end_time: endTime,
      error,
      query,
      filter,
      trace_filter: traceFilter,
      tree_filter: treeFilter,
      is_root: isRoot,
      data_source_type: dataSourceType
    };
    const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== void 0));
    const body = JSON.stringify(filteredPayload);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/runs/stats`, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "get run stats");
      return res;
    });
    const result = await response.json();
    return result;
  }
  async shareRun(runId, { shareId } = {}) {
    const data = {
      run_id: runId,
      share_token: shareId || v4_default()
    };
    assertUuid(runId);
    const body = JSON.stringify(data);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/runs/${runId}/share`, {
        method: "PUT",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "share run");
      return res;
    });
    const result = await response.json();
    if (result === null || !("share_token" in result)) {
      throw new Error("Invalid response from server");
    }
    return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
  }
  async unshareRun(runId) {
    assertUuid(runId);
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/runs/${runId}/share`, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "unshare run", true);
      return res;
    });
  }
  async readRunSharedLink(runId) {
    assertUuid(runId);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/runs/${runId}/share`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "read run shared link");
      return res;
    });
    const result = await response.json();
    if (result === null || !("share_token" in result)) {
      return void 0;
    }
    return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
  }
  async listSharedRuns(shareToken, { runIds } = {}) {
    const queryParams = new URLSearchParams({
      share_token: shareToken
    });
    if (runIds !== void 0) {
      for (const runId of runIds) {
        queryParams.append("id", runId);
      }
    }
    assertUuid(shareToken);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/public/${shareToken}/runs${queryParams}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "list shared runs");
      return res;
    });
    const runs = await response.json();
    return runs.map(_normalizeRunTimestamps);
  }
  async readDatasetSharedSchema(datasetId, datasetName) {
    if (!datasetId && !datasetName) {
      throw new Error("Either datasetId or datasetName must be given");
    }
    if (!datasetId) {
      const dataset = await this.readDataset({ datasetName });
      datasetId = dataset.id;
    }
    assertUuid(datasetId);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId}/share`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "read dataset shared schema");
      return res;
    });
    const shareSchema = await response.json();
    shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
    return shareSchema;
  }
  async shareDataset(datasetId, datasetName) {
    if (!datasetId && !datasetName) {
      throw new Error("Either datasetId or datasetName must be given");
    }
    if (!datasetId) {
      const dataset = await this.readDataset({ datasetName });
      datasetId = dataset.id;
    }
    const data = {
      dataset_id: datasetId
    };
    assertUuid(datasetId);
    const body = JSON.stringify(data);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId}/share`, {
        method: "PUT",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "share dataset");
      return res;
    });
    const shareSchema = await response.json();
    shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
    return shareSchema;
  }
  async unshareDataset(datasetId) {
    assertUuid(datasetId);
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId}/share`, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "unshare dataset", true);
      return res;
    });
  }
  async readSharedDataset(shareToken) {
    assertUuid(shareToken);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/public/${shareToken}/datasets`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "read shared dataset");
      return res;
    });
    const dataset = await response.json();
    return dataset;
  }
  /**
   * Get shared examples.
   *
   * @param {string} shareToken The share token to get examples for. A share token is the UUID (or LangSmith URL, including UUID) generated when explicitly marking an example as public.
   * @param {Object} [options] Additional options for listing the examples.
   * @param {string[] | undefined} [options.exampleIds] A list of example IDs to filter by.
   * @returns {Promise<Example[]>} The shared examples.
   */
  async listSharedExamples(shareToken, options) {
    const params = {};
    if (options?.exampleIds) {
      params.id = options.exampleIds;
    }
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => urlParams.append(key, v));
      } else {
        urlParams.append(key, value);
      }
    });
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/public/${shareToken}/examples?${urlParams.toString()}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "list shared examples");
      return res;
    });
    const result = await response.json();
    if (!response.ok) {
      if ("detail" in result) {
        throw new Error(`Failed to list shared examples.
Status: ${response.status}
Message: ${Array.isArray(result.detail) ? result.detail.join("\n") : "Unspecified error"}`);
      }
      throw new Error(`Failed to list shared examples: ${response.status} ${response.statusText}`);
    }
    return result.map((example) => ({
      ...example,
      _hostUrl: this.getHostUrl()
    }));
  }
  async createProject({ projectName, description = null, metadata = null, upsert = false, projectExtra = null, referenceDatasetId = null }) {
    const upsert_ = upsert ? `?upsert=true` : "";
    const endpoint = `${this.apiUrl}/sessions${upsert_}`;
    const extra = projectExtra || {};
    if (metadata) {
      extra["metadata"] = metadata;
    }
    const body = {
      name: projectName,
      extra,
      description
    };
    if (referenceDatasetId !== null) {
      body["reference_dataset_id"] = referenceDatasetId;
    }
    const serializedBody = JSON.stringify(body);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(endpoint, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: serializedBody
      });
      await raiseForStatus(res, "create project");
      return res;
    });
    const result = await response.json();
    return result;
  }
  async updateProject(projectId, { name = null, description = null, metadata = null, projectExtra = null, endTime = null }) {
    const endpoint = `${this.apiUrl}/sessions/${projectId}`;
    let extra = projectExtra;
    if (metadata) {
      extra = { ...extra || {}, metadata };
    }
    const body = JSON.stringify({
      name,
      extra,
      description,
      end_time: endTime ? new Date(endTime).toISOString() : null
    });
    const response = await this.caller.call(async () => {
      const res = await this._fetch(endpoint, {
        method: "PATCH",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update project");
      return res;
    });
    const result = await response.json();
    return result;
  }
  async hasProject({ projectId, projectName }) {
    let path3 = "/sessions";
    const params = new URLSearchParams();
    if (projectId !== void 0 && projectName !== void 0) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId !== void 0) {
      assertUuid(projectId);
      path3 += `/${projectId}`;
    } else if (projectName !== void 0) {
      params.append("name", projectName);
    } else {
      throw new Error("Must provide projectName or projectId");
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}${path3}?${params}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "has project");
      return res;
    });
    try {
      const result = await response.json();
      if (!response.ok) {
        return false;
      }
      if (Array.isArray(result)) {
        return result.length > 0;
      }
      return true;
    } catch (_e) {
      return false;
    }
  }
  async readProject({ projectId, projectName, includeStats }) {
    let path3 = "/sessions";
    const params = new URLSearchParams();
    if (projectId !== void 0 && projectName !== void 0) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId !== void 0) {
      assertUuid(projectId);
      path3 += `/${projectId}`;
    } else if (projectName !== void 0) {
      params.append("name", projectName);
    } else {
      throw new Error("Must provide projectName or projectId");
    }
    if (includeStats !== void 0) {
      params.append("include_stats", includeStats.toString());
    }
    const response = await this._get(path3, params);
    let result;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        throw new Error(`Project[id=${projectId}, name=${projectName}] not found`);
      }
      result = response[0];
    } else {
      result = response;
    }
    return result;
  }
  async getProjectUrl({ projectId, projectName }) {
    if (projectId === void 0 && projectName === void 0) {
      throw new Error("Must provide either projectName or projectId");
    }
    const project = await this.readProject({ projectId, projectName });
    const tenantId = await this._getTenantId();
    return `${this.getHostUrl()}/o/${tenantId}/projects/p/${project.id}`;
  }
  async getDatasetUrl({ datasetId, datasetName }) {
    if (datasetId === void 0 && datasetName === void 0) {
      throw new Error("Must provide either datasetName or datasetId");
    }
    const dataset = await this.readDataset({ datasetId, datasetName });
    const tenantId = await this._getTenantId();
    return `${this.getHostUrl()}/o/${tenantId}/datasets/${dataset.id}`;
  }
  async _getTenantId() {
    if (this._tenantId !== null) {
      return this._tenantId;
    }
    const queryParams = new URLSearchParams({ limit: "1" });
    for await (const projects of this._getPaginated("/sessions", queryParams)) {
      this._tenantId = projects[0].tenant_id;
      return projects[0].tenant_id;
    }
    throw new Error("No projects found to resolve tenant.");
  }
  async *listProjects({ projectIds, name, nameContains, referenceDatasetId, referenceDatasetName, includeStats, datasetVersion, referenceFree, metadata } = {}) {
    const params = new URLSearchParams();
    if (projectIds !== void 0) {
      for (const projectId of projectIds) {
        params.append("id", projectId);
      }
    }
    if (name !== void 0) {
      params.append("name", name);
    }
    if (nameContains !== void 0) {
      params.append("name_contains", nameContains);
    }
    if (referenceDatasetId !== void 0) {
      params.append("reference_dataset", referenceDatasetId);
    } else if (referenceDatasetName !== void 0) {
      const dataset = await this.readDataset({
        datasetName: referenceDatasetName
      });
      params.append("reference_dataset", dataset.id);
    }
    if (includeStats !== void 0) {
      params.append("include_stats", includeStats.toString());
    }
    if (datasetVersion !== void 0) {
      params.append("dataset_version", datasetVersion);
    }
    if (referenceFree !== void 0) {
      params.append("reference_free", referenceFree.toString());
    }
    if (metadata !== void 0) {
      params.append("metadata", JSON.stringify(metadata));
    }
    for await (const projects of this._getPaginated("/sessions", params)) {
      yield* projects;
    }
  }
  async deleteProject({ projectId, projectName }) {
    let projectId_;
    if (projectId === void 0 && projectName === void 0) {
      throw new Error("Must provide projectName or projectId");
    } else if (projectId !== void 0 && projectName !== void 0) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId === void 0) {
      projectId_ = (await this.readProject({ projectName })).id;
    } else {
      projectId_ = projectId;
    }
    assertUuid(projectId_);
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/sessions/${projectId_}`, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `delete session ${projectId_} (${projectName})`, true);
      return res;
    });
  }
  async uploadCsv({ csvFile, fileName, inputKeys, outputKeys, description, dataType, name }) {
    const url = `${this.apiUrl}/datasets/upload`;
    const formData = new FormData();
    const csvBlob = new Blob([csvFile], { type: "text/csv" });
    formData.append("file", csvBlob, fileName);
    inputKeys.forEach((key) => {
      formData.append("input_keys", key);
    });
    outputKeys.forEach((key) => {
      formData.append("output_keys", key);
    });
    if (description) {
      formData.append("description", description);
    }
    if (dataType) {
      formData.append("data_type", dataType);
    }
    if (name) {
      formData.append("name", name);
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(url, {
        method: "POST",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: formData
      });
      await raiseForStatus(res, "upload CSV");
      return res;
    });
    const result = await response.json();
    return result;
  }
  async createDataset(name, { description, dataType, inputsSchema, outputsSchema, metadata } = {}) {
    const body = {
      name,
      description,
      extra: { source: "sdk", ...metadata ? { metadata } : {} }
    };
    if (dataType) {
      body.data_type = dataType;
    }
    if (inputsSchema) {
      body.inputs_schema_definition = inputsSchema;
    }
    if (outputsSchema) {
      body.outputs_schema_definition = outputsSchema;
    }
    const serializedBody = JSON.stringify(body);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets`, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: serializedBody
      });
      await raiseForStatus(res, "create dataset");
      return res;
    });
    const result = await response.json();
    return result;
  }
  async readDataset({ datasetId, datasetName }) {
    let path3 = "/datasets";
    const params = new URLSearchParams({ limit: "1" });
    if (datasetId && datasetName) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId) {
      assertUuid(datasetId);
      path3 += `/${datasetId}`;
    } else if (datasetName) {
      params.append("name", datasetName);
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    const response = await this._get(path3, params);
    let result;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        throw new Error(`Dataset[id=${datasetId}, name=${datasetName}] not found`);
      }
      result = response[0];
    } else {
      result = response;
    }
    return result;
  }
  async hasDataset({ datasetId, datasetName }) {
    try {
      await this.readDataset({ datasetId, datasetName });
      return true;
    } catch (e) {
      if (
        // eslint-disable-next-line no-instanceof/no-instanceof
        e instanceof Error && e.message.toLocaleLowerCase().includes("not found")
      ) {
        return false;
      }
      throw e;
    }
  }
  async diffDatasetVersions({ datasetId, datasetName, fromVersion, toVersion }) {
    let datasetId_ = datasetId;
    if (datasetId_ === void 0 && datasetName === void 0) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    }
    const urlParams = new URLSearchParams({
      from_version: typeof fromVersion === "string" ? fromVersion : fromVersion.toISOString(),
      to_version: typeof toVersion === "string" ? toVersion : toVersion.toISOString()
    });
    const response = await this._get(`/datasets/${datasetId_}/versions/diff`, urlParams);
    return response;
  }
  async readDatasetOpenaiFinetuning({ datasetId, datasetName }) {
    const path3 = "/datasets";
    if (datasetId !== void 0) {
    } else if (datasetName !== void 0) {
      datasetId = (await this.readDataset({ datasetName })).id;
    } else {
      throw new Error("Must provide either datasetName or datasetId");
    }
    const response = await this._getResponse(`${path3}/${datasetId}/openai_ft`);
    const datasetText = await response.text();
    const dataset = datasetText.trim().split("\n").map((line) => JSON.parse(line));
    return dataset;
  }
  async *listDatasets({ limit = 100, offset = 0, datasetIds, datasetName, datasetNameContains, metadata } = {}) {
    const path3 = "/datasets";
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (datasetIds !== void 0) {
      for (const id_ of datasetIds) {
        params.append("id", id_);
      }
    }
    if (datasetName !== void 0) {
      params.append("name", datasetName);
    }
    if (datasetNameContains !== void 0) {
      params.append("name_contains", datasetNameContains);
    }
    if (metadata !== void 0) {
      params.append("metadata", JSON.stringify(metadata));
    }
    for await (const datasets of this._getPaginated(path3, params)) {
      yield* datasets;
    }
  }
  /**
   * Update a dataset
   * @param props The dataset details to update
   * @returns The updated dataset
   */
  async updateDataset(props) {
    const { datasetId, datasetName, ...update } = props;
    if (!datasetId && !datasetName) {
      throw new Error("Must provide either datasetName or datasetId");
    }
    const _datasetId = datasetId ?? (await this.readDataset({ datasetName })).id;
    assertUuid(_datasetId);
    const body = JSON.stringify(update);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/${_datasetId}`, {
        method: "PATCH",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update dataset");
      return res;
    });
    return await response.json();
  }
  /**
   * Updates a tag on a dataset.
   *
   * If the tag is already assigned to a different version of this dataset,
   * the tag will be moved to the new version. The as_of parameter is used to
   * determine which version of the dataset to apply the new tags to.
   *
   * It must be an exact version of the dataset to succeed. You can
   * use the "readDatasetVersion" method to find the exact version
   * to apply the tags to.
   * @param params.datasetId The ID of the dataset to update. Must be provided if "datasetName" is not provided.
   * @param params.datasetName The name of the dataset to update. Must be provided if "datasetId" is not provided.
   * @param params.asOf The timestamp of the dataset to apply the new tags to.
   * @param params.tag The new tag to apply to the dataset.
   */
  async updateDatasetTag(props) {
    const { datasetId, datasetName, asOf, tag } = props;
    if (!datasetId && !datasetName) {
      throw new Error("Must provide either datasetName or datasetId");
    }
    const _datasetId = datasetId ?? (await this.readDataset({ datasetName })).id;
    assertUuid(_datasetId);
    const body = JSON.stringify({
      as_of: typeof asOf === "string" ? asOf : asOf.toISOString(),
      tag
    });
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/${_datasetId}/tags`, {
        method: "PUT",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update dataset tags", true);
      return res;
    });
  }
  async deleteDataset({ datasetId, datasetName }) {
    let path3 = "/datasets";
    let datasetId_ = datasetId;
    if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetName !== void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    }
    if (datasetId_ !== void 0) {
      assertUuid(datasetId_);
      path3 += `/${datasetId_}`;
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    await this.caller.call(async () => {
      const res = await this._fetch(this.apiUrl + path3, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `delete ${path3}`, true);
      return res;
    });
  }
  async createExample(inputsOrUpdate, outputs, options) {
    if (isExampleCreate(inputsOrUpdate)) {
      if (outputs !== void 0 || options !== void 0) {
        throw new Error("Cannot provide outputs or options when using ExampleCreate object");
      }
    }
    let datasetId_ = outputs ? options?.datasetId : inputsOrUpdate.dataset_id;
    const datasetName_ = outputs ? options?.datasetName : inputsOrUpdate.dataset_name;
    if (datasetId_ === void 0 && datasetName_ === void 0) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== void 0 && datasetName_ !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === void 0) {
      const dataset = await this.readDataset({ datasetName: datasetName_ });
      datasetId_ = dataset.id;
    }
    const createdAt_ = (outputs ? options?.createdAt : inputsOrUpdate.created_at) || /* @__PURE__ */ new Date();
    let data;
    if (!isExampleCreate(inputsOrUpdate)) {
      data = {
        inputs: inputsOrUpdate,
        outputs,
        created_at: createdAt_?.toISOString(),
        id: options?.exampleId,
        metadata: options?.metadata,
        split: options?.split,
        source_run_id: options?.sourceRunId,
        use_source_run_io: options?.useSourceRunIO,
        use_source_run_attachments: options?.useSourceRunAttachments,
        attachments: options?.attachments
      };
    } else {
      data = inputsOrUpdate;
    }
    const response = await this._uploadExamplesMultipart(datasetId_, [data]);
    const example = await this.readExample(response.example_ids?.[0] ?? v4_default());
    return example;
  }
  async createExamples(propsOrUploads) {
    if (Array.isArray(propsOrUploads)) {
      if (propsOrUploads.length === 0) {
        return [];
      }
      const uploads = propsOrUploads;
      let datasetId_2 = uploads[0].dataset_id;
      const datasetName_2 = uploads[0].dataset_name;
      if (datasetId_2 === void 0 && datasetName_2 === void 0) {
        throw new Error("Must provide either datasetName or datasetId");
      } else if (datasetId_2 !== void 0 && datasetName_2 !== void 0) {
        throw new Error("Must provide either datasetName or datasetId, not both");
      } else if (datasetId_2 === void 0) {
        const dataset = await this.readDataset({ datasetName: datasetName_2 });
        datasetId_2 = dataset.id;
      }
      const response2 = await this._uploadExamplesMultipart(datasetId_2, uploads);
      const examples2 = await Promise.all(response2.example_ids.map((id) => this.readExample(id)));
      return examples2;
    }
    const { inputs, outputs, metadata, splits, sourceRunIds, useSourceRunIOs, useSourceRunAttachments, attachments, exampleIds, datasetId, datasetName } = propsOrUploads;
    if (inputs === void 0) {
      throw new Error("Must provide inputs when using legacy parameters");
    }
    let datasetId_ = datasetId;
    const datasetName_ = datasetName;
    if (datasetId_ === void 0 && datasetName_ === void 0) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== void 0 && datasetName_ !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === void 0) {
      const dataset = await this.readDataset({ datasetName: datasetName_ });
      datasetId_ = dataset.id;
    }
    const formattedExamples = inputs.map((input, idx) => {
      return {
        dataset_id: datasetId_,
        inputs: input,
        outputs: outputs?.[idx],
        metadata: metadata?.[idx],
        split: splits?.[idx],
        id: exampleIds?.[idx],
        attachments: attachments?.[idx],
        source_run_id: sourceRunIds?.[idx],
        use_source_run_io: useSourceRunIOs?.[idx],
        use_source_run_attachments: useSourceRunAttachments?.[idx]
      };
    });
    const response = await this._uploadExamplesMultipart(datasetId_, formattedExamples);
    const examples = await Promise.all(response.example_ids.map((id) => this.readExample(id)));
    return examples;
  }
  async createLLMExample(input, generation, options) {
    return this.createExample({ input }, { output: generation }, options);
  }
  async createChatExample(input, generations, options) {
    const finalInput = input.map((message) => {
      if (isLangChainMessage(message)) {
        return convertLangChainMessageToExample(message);
      }
      return message;
    });
    const finalOutput = isLangChainMessage(generations) ? convertLangChainMessageToExample(generations) : generations;
    return this.createExample({ input: finalInput }, { output: finalOutput }, options);
  }
  async readExample(exampleId) {
    assertUuid(exampleId);
    const path3 = `/examples/${exampleId}`;
    const rawExample = await this._get(path3);
    const { attachment_urls, ...rest } = rawExample;
    const example = rest;
    if (attachment_urls) {
      example.attachments = Object.entries(attachment_urls).reduce((acc, [key, value]) => {
        acc[key.slice("attachment.".length)] = {
          presigned_url: value.presigned_url,
          mime_type: value.mime_type
        };
        return acc;
      }, {});
    }
    return example;
  }
  async *listExamples({ datasetId, datasetName, exampleIds, asOf, splits, inlineS3Urls, metadata, limit, offset, filter, includeAttachments } = {}) {
    let datasetId_;
    if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId !== void 0) {
      datasetId_ = datasetId;
    } else if (datasetName !== void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    } else {
      throw new Error("Must provide a datasetName or datasetId");
    }
    const params = new URLSearchParams({ dataset: datasetId_ });
    const dataset_version = asOf ? typeof asOf === "string" ? asOf : asOf?.toISOString() : void 0;
    if (dataset_version) {
      params.append("as_of", dataset_version);
    }
    const inlineS3Urls_ = inlineS3Urls ?? true;
    params.append("inline_s3_urls", inlineS3Urls_.toString());
    if (exampleIds !== void 0) {
      for (const id_ of exampleIds) {
        params.append("id", id_);
      }
    }
    if (splits !== void 0) {
      for (const split of splits) {
        params.append("splits", split);
      }
    }
    if (metadata !== void 0) {
      const serializedMetadata = JSON.stringify(metadata);
      params.append("metadata", serializedMetadata);
    }
    if (limit !== void 0) {
      params.append("limit", limit.toString());
    }
    if (offset !== void 0) {
      params.append("offset", offset.toString());
    }
    if (filter !== void 0) {
      params.append("filter", filter);
    }
    if (includeAttachments === true) {
      ["attachment_urls", "outputs", "metadata"].forEach((field) => params.append("select", field));
    }
    let i = 0;
    for await (const rawExamples of this._getPaginated("/examples", params)) {
      for (const rawExample of rawExamples) {
        const { attachment_urls, ...rest } = rawExample;
        const example = rest;
        if (attachment_urls) {
          example.attachments = Object.entries(attachment_urls).reduce((acc, [key, value]) => {
            acc[key.slice("attachment.".length)] = {
              presigned_url: value.presigned_url,
              mime_type: value.mime_type || void 0
            };
            return acc;
          }, {});
        }
        yield example;
        i++;
      }
      if (limit !== void 0 && i >= limit) {
        break;
      }
    }
  }
  async deleteExample(exampleId) {
    assertUuid(exampleId);
    const path3 = `/examples/${exampleId}`;
    await this.caller.call(async () => {
      const res = await this._fetch(this.apiUrl + path3, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `delete ${path3}`, true);
      return res;
    });
  }
  /**
   * Delete multiple examples by ID.
   * @param exampleIds - The IDs of the examples to delete
   * @param options - Optional settings for deletion
   * @param options.hardDelete - If true, permanently delete examples. If false (default), soft delete them.
   */
  async deleteExamples(exampleIds, options) {
    exampleIds.forEach((id) => assertUuid(id));
    if (options?.hardDelete) {
      const path3 = this._getPlatformEndpointPath("datasets/examples/delete");
      await this.caller.call(async () => {
        const res = await this._fetch(`${this.apiUrl}${path3}`, {
          method: "POST",
          headers: {
            ...this._mergedHeaders,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            example_ids: exampleIds,
            hard_delete: true
          }),
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions
        });
        await raiseForStatus(res, "hard delete examples", true);
        return res;
      });
    } else {
      const params = new URLSearchParams();
      exampleIds.forEach((id) => params.append("example_ids", id));
      await this.caller.call(async () => {
        const res = await this._fetch(`${this.apiUrl}/examples?${params.toString()}`, {
          method: "DELETE",
          headers: this._mergedHeaders,
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions
        });
        await raiseForStatus(res, "delete examples", true);
        return res;
      });
    }
  }
  async updateExample(exampleIdOrUpdate, update) {
    let exampleId;
    if (update) {
      exampleId = exampleIdOrUpdate;
    } else {
      exampleId = exampleIdOrUpdate.id;
    }
    assertUuid(exampleId);
    let updateToUse;
    if (update) {
      updateToUse = { id: exampleId, ...update };
    } else {
      updateToUse = exampleIdOrUpdate;
    }
    let datasetId;
    if (updateToUse.dataset_id !== void 0) {
      datasetId = updateToUse.dataset_id;
    } else {
      const example = await this.readExample(exampleId);
      datasetId = example.dataset_id;
    }
    return this._updateExamplesMultipart(datasetId, [updateToUse]);
  }
  async updateExamples(update) {
    let datasetId;
    if (update[0].dataset_id === void 0) {
      const example = await this.readExample(update[0].id);
      datasetId = example.dataset_id;
    } else {
      datasetId = update[0].dataset_id;
    }
    return this._updateExamplesMultipart(datasetId, update);
  }
  /**
   * Get dataset version by closest date or exact tag.
   *
   * Use this to resolve the nearest version to a given timestamp or for a given tag.
   *
   * @param options The options for getting the dataset version
   * @param options.datasetId The ID of the dataset
   * @param options.datasetName The name of the dataset
   * @param options.asOf The timestamp of the dataset to retrieve
   * @param options.tag The tag of the dataset to retrieve
   * @returns The dataset version
   */
  async readDatasetVersion({ datasetId, datasetName, asOf, tag }) {
    let resolvedDatasetId;
    if (!datasetId) {
      const dataset = await this.readDataset({ datasetName });
      resolvedDatasetId = dataset.id;
    } else {
      resolvedDatasetId = datasetId;
    }
    assertUuid(resolvedDatasetId);
    if (asOf && tag || !asOf && !tag) {
      throw new Error("Exactly one of asOf and tag must be specified.");
    }
    const params = new URLSearchParams();
    if (asOf !== void 0) {
      params.append("as_of", typeof asOf === "string" ? asOf : asOf.toISOString());
    }
    if (tag !== void 0) {
      params.append("tag", tag);
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/${resolvedDatasetId}/version?${params.toString()}`, {
        method: "GET",
        headers: { ...this._mergedHeaders },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "read dataset version");
      return res;
    });
    return await response.json();
  }
  async listDatasetSplits({ datasetId, datasetName, asOf }) {
    let datasetId_;
    if (datasetId === void 0 && datasetName === void 0) {
      throw new Error("Must provide dataset name or ID");
    } else if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId === void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    } else {
      datasetId_ = datasetId;
    }
    assertUuid(datasetId_);
    const params = new URLSearchParams();
    const dataset_version = asOf ? typeof asOf === "string" ? asOf : asOf?.toISOString() : void 0;
    if (dataset_version) {
      params.append("as_of", dataset_version);
    }
    const response = await this._get(`/datasets/${datasetId_}/splits`, params);
    return response;
  }
  async updateDatasetSplits({ datasetId, datasetName, splitName, exampleIds, remove = false }) {
    let datasetId_;
    if (datasetId === void 0 && datasetName === void 0) {
      throw new Error("Must provide dataset name or ID");
    } else if (datasetId !== void 0 && datasetName !== void 0) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId === void 0) {
      const dataset = await this.readDataset({ datasetName });
      datasetId_ = dataset.id;
    } else {
      datasetId_ = datasetId;
    }
    assertUuid(datasetId_);
    const data = {
      split_name: splitName,
      examples: exampleIds.map((id) => {
        assertUuid(id);
        return id;
      }),
      remove
    };
    const body = JSON.stringify(data);
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/${datasetId_}/splits`, {
        method: "PUT",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update dataset splits", true);
      return res;
    });
  }
  async createFeedback(runId, key, { score, value, correction, comment, sourceInfo, feedbackSourceType = "api", sourceRunId, feedbackId, feedbackConfig, projectId, comparativeExperimentId, sessionId, startTime }) {
    if (!runId && !projectId) {
      throw new Error("One of runId or projectId must be provided");
    }
    if (runId && projectId) {
      throw new Error("Only one of runId or projectId can be provided");
    }
    const feedback_source = {
      type: feedbackSourceType ?? "api",
      metadata: sourceInfo ?? {}
    };
    if (sourceRunId !== void 0 && feedback_source?.metadata !== void 0 && !feedback_source.metadata["__run"]) {
      feedback_source.metadata["__run"] = { run_id: sourceRunId };
    }
    if (feedback_source?.metadata !== void 0 && feedback_source.metadata["__run"]?.run_id !== void 0) {
      assertUuid(feedback_source.metadata["__run"].run_id);
    }
    const feedback = {
      id: feedbackId ?? v7_default(),
      run_id: runId,
      key,
      score: _formatFeedbackScore(score),
      value,
      correction,
      comment,
      feedback_source,
      comparative_experiment_id: comparativeExperimentId,
      feedbackConfig,
      session_id: sessionId ?? projectId,
      start_time: startTime
    };
    const body = JSON.stringify(feedback);
    const url = `${this.apiUrl}/feedback`;
    await this.caller.call(async () => {
      const res = await this._fetch(url, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "create feedback", true);
      return res;
    });
    return feedback;
  }
  async updateFeedback(feedbackId, { score, value, correction, comment }) {
    const feedbackUpdate = {};
    if (score !== void 0 && score !== null) {
      feedbackUpdate["score"] = _formatFeedbackScore(score);
    }
    if (value !== void 0 && value !== null) {
      feedbackUpdate["value"] = value;
    }
    if (correction !== void 0 && correction !== null) {
      feedbackUpdate["correction"] = correction;
    }
    if (comment !== void 0 && comment !== null) {
      feedbackUpdate["comment"] = comment;
    }
    assertUuid(feedbackId);
    const body = JSON.stringify(feedbackUpdate);
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update feedback", true);
      return res;
    });
  }
  async readFeedback(feedbackId) {
    assertUuid(feedbackId);
    const path3 = `/feedback/${feedbackId}`;
    const response = await this._get(path3);
    return response;
  }
  async deleteFeedback(feedbackId) {
    assertUuid(feedbackId);
    const path3 = `/feedback/${feedbackId}`;
    await this.caller.call(async () => {
      const res = await this._fetch(this.apiUrl + path3, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, `delete ${path3}`, true);
      return res;
    });
  }
  async *listFeedback({ runIds, feedbackKeys, feedbackSourceTypes } = {}) {
    const queryParams = new URLSearchParams();
    if (runIds) {
      for (const runId of runIds) {
        assertUuid(runId);
        queryParams.append("run", runId);
      }
    }
    if (feedbackKeys) {
      for (const key of feedbackKeys) {
        queryParams.append("key", key);
      }
    }
    if (feedbackSourceTypes) {
      for (const type of feedbackSourceTypes) {
        queryParams.append("source", type);
      }
    }
    for await (const feedbacks of this._getPaginated("/feedback", queryParams)) {
      yield* feedbacks;
    }
  }
  /**
   * Creates a presigned feedback token and URL.
   *
   * The token can be used to authorize feedback metrics without
   * needing an API key. This is useful for giving browser-based
   * applications the ability to submit feedback without needing
   * to expose an API key.
   *
   * @param runId The ID of the run.
   * @param feedbackKey The feedback key.
   * @param options Additional options for the token.
   * @param options.expiration The expiration time for the token.
   *
   * @returns A promise that resolves to a FeedbackIngestToken.
   */
  async createPresignedFeedbackToken(runId, feedbackKey, { expiration, feedbackConfig } = {}) {
    const body = {
      run_id: runId,
      feedback_key: feedbackKey,
      feedback_config: feedbackConfig
    };
    if (expiration) {
      if (typeof expiration === "string") {
        body["expires_at"] = expiration;
      } else if (expiration?.hours || expiration?.minutes || expiration?.days) {
        body["expires_in"] = expiration;
      }
    } else {
      body["expires_in"] = {
        hours: 3
      };
    }
    const serializedBody = JSON.stringify(body);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/feedback/tokens`, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: serializedBody
      });
      await raiseForStatus(res, "create presigned feedback token");
      return res;
    });
    return await response.json();
  }
  async createComparativeExperiment({ name, experimentIds, referenceDatasetId, createdAt, description, metadata, id }) {
    if (experimentIds.length === 0) {
      throw new Error("At least one experiment is required");
    }
    if (!referenceDatasetId) {
      referenceDatasetId = (await this.readProject({
        projectId: experimentIds[0]
      })).reference_dataset_id;
    }
    if (!referenceDatasetId == null) {
      throw new Error("A reference dataset is required");
    }
    const body = {
      id,
      name,
      experiment_ids: experimentIds,
      reference_dataset_id: referenceDatasetId,
      description,
      created_at: (createdAt ?? /* @__PURE__ */ new Date())?.toISOString(),
      extra: {}
    };
    if (metadata)
      body.extra["metadata"] = metadata;
    const serializedBody = JSON.stringify(body);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/datasets/comparative`, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: serializedBody
      });
      await raiseForStatus(res, "create comparative experiment");
      return res;
    });
    return response.json();
  }
  /**
   * Retrieves a list of presigned feedback tokens for a given run ID.
   * @param runId The ID of the run.
   * @returns An async iterable of FeedbackIngestToken objects.
   */
  async *listPresignedFeedbackTokens(runId) {
    assertUuid(runId);
    const params = new URLSearchParams({ run_id: runId });
    for await (const tokens of this._getPaginated("/feedback/tokens", params)) {
      yield* tokens;
    }
  }
  _selectEvalResults(results) {
    let results_;
    if ("results" in results) {
      results_ = results.results;
    } else if (Array.isArray(results)) {
      results_ = results;
    } else {
      results_ = [results];
    }
    return results_;
  }
  async _logEvaluationFeedback(evaluatorResponse, run, sourceInfo) {
    const evalResults = this._selectEvalResults(evaluatorResponse);
    const feedbacks = [];
    for (const res of evalResults) {
      let sourceInfo_ = sourceInfo || {};
      if (res.evaluatorInfo) {
        sourceInfo_ = { ...res.evaluatorInfo, ...sourceInfo_ };
      }
      let runId_ = null;
      if (res.targetRunId) {
        runId_ = res.targetRunId;
      } else if (run) {
        runId_ = run.id;
      }
      feedbacks.push(await this.createFeedback(runId_, res.key, {
        score: res.score,
        value: res.value,
        comment: res.comment,
        correction: res.correction,
        sourceInfo: sourceInfo_,
        sourceRunId: res.sourceRunId,
        feedbackConfig: res.feedbackConfig,
        feedbackSourceType: "model",
        sessionId: run?.session_id,
        startTime: run?.start_time
      }));
    }
    return [evalResults, feedbacks];
  }
  async logEvaluationFeedback(evaluatorResponse, run, sourceInfo) {
    const [results] = await this._logEvaluationFeedback(evaluatorResponse, run, sourceInfo);
    return results;
  }
  /**
   * API for managing feedback configs
   */
  /**
   * Create a feedback configuration on the LangSmith API.
   *
   * This upserts: if an identical config already exists, it returns it.
   * If a conflicting config exists for the same key, a 400 error is raised.
   *
   * @param options - The options for creating a feedback config
   * @param options.feedbackKey - The unique key for this feedback config
   * @param options.feedbackConfig - The config specifying type, bounds, and categories
   * @param options.isLowerScoreBetter - Whether a lower score is better
   * @returns The created FeedbackConfigSchema object
   */
  async createFeedbackConfig(options) {
    const { feedbackKey, feedbackConfig, isLowerScoreBetter = false } = options;
    const body = {
      feedback_key: feedbackKey,
      feedback_config: feedbackConfig,
      is_lower_score_better: isLowerScoreBetter
    };
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/feedback-configs`, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: JSON.stringify(body)
      });
      await raiseForStatus(res, "create feedback config");
      return res;
    });
    return response.json();
  }
  /**
   * List feedback configurations on the LangSmith API.
   * @param options - The options for listing feedback configs
   * @param options.feedbackKeys - Filter by specific feedback keys
   * @param options.nameContains - Filter by name substring
   * @param options.limit - The maximum number of configs to return
   * @returns An async iterator of FeedbackConfigSchema objects
   */
  async *listFeedbackConfigs(options = {}) {
    const { feedbackKeys, nameContains, limit } = options;
    const params = new URLSearchParams();
    if (feedbackKeys) {
      feedbackKeys.forEach((key) => {
        params.append("key", key);
      });
    }
    if (nameContains)
      params.append("name_contains", nameContains);
    params.append("limit", (limit !== void 0 ? Math.min(limit, 100) : 100).toString());
    let count = 0;
    for await (const configs of this._getPaginated("/feedback-configs", params)) {
      yield* configs;
      count += configs.length;
      if (limit !== void 0 && count >= limit)
        break;
    }
  }
  /**
   * Update a feedback configuration on the LangSmith API.
   * @param feedbackKey - The key of the feedback config to update
   * @param options - The options for updating the feedback config
   * @param options.feedbackConfig - The new feedback config
   * @param options.isLowerScoreBetter - Whether a lower score is better
   * @returns The updated FeedbackConfigSchema object
   */
  async updateFeedbackConfig(feedbackKey, options = {}) {
    const { feedbackConfig, isLowerScoreBetter } = options;
    const body = { feedback_key: feedbackKey };
    if (feedbackConfig !== void 0) {
      body.feedback_config = feedbackConfig;
    }
    if (isLowerScoreBetter !== void 0) {
      body.is_lower_score_better = isLowerScoreBetter;
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/feedback-configs`, {
        method: "PATCH",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: JSON.stringify(body)
      });
      await raiseForStatus(res, "update feedback config");
      return res;
    });
    return response.json();
  }
  /**
   * Delete a feedback configuration on the LangSmith API.
   * @param feedbackKey - The key of the feedback config to delete
   */
  async deleteFeedbackConfig(feedbackKey) {
    const params = new URLSearchParams({ feedback_key: feedbackKey });
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/feedback-configs?${params}`, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "delete feedback config", true);
      return res;
    });
  }
  /**
   * API for managing annotation queues
   */
  /**
   * List the annotation queues on the LangSmith API.
   * @param options - The options for listing annotation queues
   * @param options.queueIds - The IDs of the queues to filter by
   * @param options.name - The name of the queue to filter by
   * @param options.nameContains - The substring that the queue name should contain
   * @param options.limit - The maximum number of queues to return
   * @returns An iterator of AnnotationQueue objects
   */
  async *listAnnotationQueues(options = {}) {
    const { queueIds, name, nameContains, limit } = options;
    const params = new URLSearchParams();
    if (queueIds) {
      queueIds.forEach((id, i) => {
        assertUuid(id, `queueIds[${i}]`);
        params.append("ids", id);
      });
    }
    if (name)
      params.append("name", name);
    if (nameContains)
      params.append("name_contains", nameContains);
    params.append("limit", (limit !== void 0 ? Math.min(limit, 100) : 100).toString());
    let count = 0;
    for await (const queues of this._getPaginated("/annotation-queues", params)) {
      yield* queues;
      count++;
      if (limit !== void 0 && count >= limit)
        break;
    }
  }
  /**
   * Create an annotation queue on the LangSmith API.
   * @param options - The options for creating an annotation queue
   * @param options.name - The name of the annotation queue
   * @param options.description - The description of the annotation queue
   * @param options.queueId - The ID of the annotation queue
   * @returns The created AnnotationQueue object
   */
  async createAnnotationQueue(options) {
    const { name, description, queueId, rubricInstructions, rubricItems } = options;
    const body = {
      name,
      description,
      id: queueId || v4_default(),
      rubric_instructions: rubricInstructions,
      rubric_items: rubricItems
    };
    const serializedBody = JSON.stringify(Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== void 0)));
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues`, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: serializedBody
      });
      await raiseForStatus(res, "create annotation queue");
      return res;
    });
    return response.json();
  }
  /**
   * Read an annotation queue with the specified queue ID.
   * @param queueId - The ID of the annotation queue to read
   * @returns The AnnotationQueueWithDetails object
   */
  async readAnnotationQueue(queueId) {
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "read annotation queue");
      return res;
    });
    return response.json();
  }
  /**
   * Update an annotation queue with the specified queue ID.
   * @param queueId - The ID of the annotation queue to update
   * @param options - The options for updating the annotation queue
   * @param options.name - The new name for the annotation queue
   * @param options.description - The new description for the annotation queue
   */
  async updateAnnotationQueue(queueId, options) {
    const { name, description, rubricInstructions, rubricItems } = options;
    const bodyObj = {};
    if (name !== void 0)
      bodyObj.name = name;
    if (description !== void 0)
      bodyObj.description = description;
    if (rubricInstructions !== void 0)
      bodyObj.rubric_instructions = rubricInstructions;
    if (rubricItems !== void 0)
      bodyObj.rubric_items = rubricItems;
    const body = JSON.stringify(bodyObj);
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}`, {
        method: "PATCH",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update annotation queue", true);
      return res;
    });
  }
  /**
   * Delete an annotation queue with the specified queue ID.
   * @param queueId - The ID of the annotation queue to delete
   */
  async deleteAnnotationQueue(queueId) {
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}`, {
        method: "DELETE",
        headers: { ...this._mergedHeaders, Accept: "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "delete annotation queue", true);
      return res;
    });
  }
  /**
   * Add runs to an annotation queue with the specified queue ID.
   * @param queueId - The ID of the annotation queue
   * @param runIds - The IDs of the runs to be added to the annotation queue
   */
  async addRunsToAnnotationQueue(queueId, runIds) {
    const body = JSON.stringify(runIds.map((id, i) => assertUuid(id, `runIds[${i}]`).toString()));
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}/runs`, {
        method: "POST",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "add runs to annotation queue", true);
      return res;
    });
  }
  /**
   * Get a run from an annotation queue at the specified index.
   * @param queueId - The ID of the annotation queue
   * @param index - The index of the run to retrieve
   * @returns A Promise that resolves to a RunWithAnnotationQueueInfo object
   * @throws {Error} If the run is not found at the given index or for other API-related errors
   */
  async getRunFromAnnotationQueue(queueId, index) {
    const baseUrl = `/annotation-queues/${assertUuid(queueId, "queueId")}/run`;
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}${baseUrl}/${index}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "get run from annotation queue");
      return res;
    });
    const run = await response.json();
    return _normalizeRunTimestamps(run);
  }
  /**
   * List the runs in an annotation queue.
   * @param queueId - The ID of the annotation queue
   * @param options - The options for listing runs in the annotation queue
   * @param options.status - Filter runs by review status. If omitted, returns
   * runs across all review states.
   * @param options.limit - The maximum number of runs to return
   * @returns An iterator of RunWithAnnotationQueueInfo objects
   */
  async *listRunsFromAnnotationQueue(queueId, options = {}) {
    const { status, limit: userLimit } = options;
    const params = new URLSearchParams();
    const limit = userLimit !== void 0 && Number.isFinite(userLimit) ? Math.min(userLimit, 100) : 100;
    if (status)
      params.append("status", status);
    params.append("limit", limit.toString());
    let count = 0;
    const path3 = `/annotation-queues/${assertUuid(queueId, "queueId")}/runs`;
    for await (const runs of this._getPaginated(path3, params)) {
      for (const run of runs) {
        yield _normalizeRunTimestamps(run);
        count++;
        if (count >= limit)
          return;
      }
    }
  }
  /**
   * Delete a run from an an annotation queue.
   * @param queueId - The ID of the annotation queue to delete the run from
   * @param queueRunId - The ID of the run to delete from the annotation queue
   */
  async deleteRunFromAnnotationQueue(queueId, queueRunId) {
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}/runs/${assertUuid(queueRunId, "queueRunId")}`, {
        method: "DELETE",
        headers: { ...this._mergedHeaders, Accept: "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "delete run from annotation queue", true);
      return res;
    });
  }
  /**
   * Get the size of an annotation queue.
   * @param queueId - The ID of the annotation queue
   */
  async getSizeFromAnnotationQueue(queueId) {
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/annotation-queues/${assertUuid(queueId, "queueId")}/size`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "get size from annotation queue");
      return res;
    });
    return response.json();
  }
  async _currentTenantIsOwner(owner) {
    const settings = await this._getSettings();
    return owner == "-" || settings.tenant_handle === owner;
  }
  async _ownerConflictError(action, owner) {
    const settings = await this._getSettings();
    return new Error(`Cannot ${action} for another tenant.

      Current tenant: ${settings.tenant_handle}

      Requested tenant: ${owner}`);
  }
  async _getLatestCommitHash(promptOwnerAndName) {
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/commits/${promptOwnerAndName}/?limit=${1}&offset=${0}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "get latest commit hash");
      return res;
    });
    const json = await response.json();
    if (json.commits.length === 0) {
      return void 0;
    }
    return json.commits[0].commit_hash;
  }
  async _createCommitTags(promptOwnerAndName, commitId, tags) {
    const tagList = typeof tags === "string" ? [tags] : tags;
    await Promise.all(tagList.map(async (tag) => this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/repos/${promptOwnerAndName}/tags`, {
        method: "POST",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: JSON.stringify({ tag_name: tag, commit_id: commitId })
      });
      await raiseForStatus(res, "create commit tag");
      return res;
    })));
  }
  async _likeOrUnlikePrompt(promptIdentifier, like) {
    const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
    const body = JSON.stringify({ like });
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/likes/${owner}/${promptName}`, {
        method: "POST",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, `${like ? "like" : "unlike"} prompt`);
      return res;
    });
    return response.json();
  }
  async _getPromptUrl(promptIdentifier) {
    const [owner, promptName, commitHash] = parseHubIdentifier(promptIdentifier);
    if (!await this._currentTenantIsOwner(owner)) {
      if (commitHash !== "latest") {
        return `${this.getHostUrl()}/hub/${owner}/${promptName}/${commitHash.substring(0, 8)}`;
      } else {
        return `${this.getHostUrl()}/hub/${owner}/${promptName}`;
      }
    } else {
      const settings = await this._getSettings();
      if (commitHash !== "latest") {
        return `${this.getHostUrl()}/prompts/${promptName}/${commitHash.substring(0, 8)}?organizationId=${settings.id}`;
      } else {
        return `${this.getHostUrl()}/prompts/${promptName}?organizationId=${settings.id}`;
      }
    }
  }
  /**
   * Check if a prompt exists.
   * @param promptIdentifier - The identifier of the prompt. Can be in the format:
   *   - "promptName" (for private prompts, owner defaults to "-")
   *   - "owner/promptName" (for prompts with explicit owner)
   * @returns A Promise that resolves to true if the prompt exists, false otherwise
   * @example
   * ```typescript
   * // Check if a prompt exists before creating a commit
   * if (await client.promptExists("my-prompt")) {
   *   await client.createCommit("my-prompt", template);
   * } else {
   *   await client.createPrompt("my-prompt");
   * }
   * ```
   */
  async promptExists(promptIdentifier) {
    const prompt = await this.getPrompt(promptIdentifier);
    return !!prompt;
  }
  /**
   * Like a prompt.
   * @param promptIdentifier - The identifier of the prompt. Can be in the format:
   *   - "promptName" (for private prompts, owner defaults to "-")
   *   - "owner/promptName" (for prompts with explicit owner)
   * @returns A Promise that resolves to the like response containing the updated like count
   * @example
   * ```typescript
   * // Like a prompt
   * const response = await client.likePrompt("owner/useful-prompt");
   * console.log(`Prompt now has ${response.likes} likes`);
   * ```
   */
  async likePrompt(promptIdentifier) {
    return this._likeOrUnlikePrompt(promptIdentifier, true);
  }
  /**
   * Unlike a prompt (remove a previously added like).
   * @param promptIdentifier - The identifier of the prompt. Can be in the format:
   *   - "promptName" (for private prompts, owner defaults to "-")
   *   - "owner/promptName" (for prompts with explicit owner)
   * @returns A Promise that resolves to the like response containing the updated like count
   * @example
   * ```typescript
   * // Unlike a prompt
   * const response = await client.unlikePrompt("owner/useful-prompt");
   * console.log(`Prompt now has ${response.likes} likes`);
   * ```
   */
  async unlikePrompt(promptIdentifier) {
    return this._likeOrUnlikePrompt(promptIdentifier, false);
  }
  /**
   * List all commits for a prompt.
   * @param promptIdentifier - The identifier of the prompt. Can be in the format:
   *   - "promptName" (for private prompts, owner defaults to "-")
   *   - "owner/promptName" (for prompts with explicit owner)
   *   - "promptName:commitHash" (commit hash is ignored, all commits are returned)
   * @returns An async iterable iterator of PromptCommit objects
   * @example
   * ```typescript
   * // List commits for a private prompt
   * for await (const commit of client.listCommits("my-prompt")) {
   *   console.log(commit);
   * }
   *
   * // List commits for a prompt with explicit owner
   * for await (const commit of client.listCommits("owner/my-prompt")) {
   *   console.log(commit);
   * }
   * ```
   */
  async *listCommits(promptIdentifier) {
    const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
    for await (const commits of this._getPaginated(`/commits/${owner}/${promptName}/`, new URLSearchParams(), (res) => res.commits)) {
      yield* commits;
    }
  }
  /**
   * List prompts by filter.
   * @param options - Optional filters for listing prompts
   * @param options.isPublic - Filter by public/private prompts. If undefined, returns all prompts.
   * @param options.isArchived - Filter by archived status. Defaults to false (non-archived prompts only).
   * @param options.sortField - Field to sort by. Defaults to "updated_at".
   * @param options.query - Search query to filter prompts by name or description.
   * @returns An async iterable iterator of Prompt objects
   * @example
   * ```typescript
   * // List all prompts
   * for await (const prompt of client.listPrompts()) {
   *   console.log(prompt);
   * }
   *
   * // List only public prompts
   * for await (const prompt of client.listPrompts({ isPublic: true })) {
   *   console.log(prompt);
   * }
   *
   * // Search for prompts
   * for await (const prompt of client.listPrompts({ query: "translation" })) {
   *   console.log(prompt);
   * }
   * ```
   */
  async *listPrompts(options) {
    const params = new URLSearchParams();
    params.append("sort_field", options?.sortField ?? "updated_at");
    params.append("sort_direction", "desc");
    params.append("is_archived", (!!options?.isArchived).toString());
    if (options?.isPublic !== void 0) {
      params.append("is_public", options.isPublic.toString());
    }
    if (options?.query) {
      params.append("query", options.query);
    }
    for await (const prompts of this._getPaginated("/repos", params, (res) => res.repos)) {
      yield* prompts;
    }
  }
  /**
   * Get a prompt by its identifier.
   * @param promptIdentifier - The identifier of the prompt. Can be in the format:
   *   - "promptName" (for private prompts, owner defaults to "-")
   *   - "owner/promptName" (for prompts with explicit owner)
   *   - "promptName:commitHash" (commit hash is ignored, latest version is returned)
   * @returns A Promise that resolves to the Prompt object, or null if not found
   * @example
   * ```typescript
   * // Get a private prompt
   * const prompt = await client.getPrompt("my-prompt");
   *
   * // Get a public prompt
   * const publicPrompt = await client.getPrompt("owner/public-prompt");
   * ```
   */
  async getPrompt(promptIdentifier) {
    const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${promptName}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      if (res?.status === 404) {
        return null;
      }
      await raiseForStatus(res, "get prompt");
      return res;
    });
    const result = await response?.json();
    if (result?.repo) {
      return result.repo;
    } else {
      return null;
    }
  }
  /**
   * Create a new prompt.
   * @param promptIdentifier - The identifier for the new prompt. Can be in the format:
   *   - "promptName" (creates a private prompt)
   *   - "owner/promptName" (creates a prompt under a specific owner, must match your tenant)
   * @param options - Optional configuration for the prompt
   * @param options.description - A description of the prompt
   * @param options.readme - Markdown content for the prompt's README
   * @param options.tags - Array of tags to categorize the prompt
   * @param options.isPublic - Whether the prompt should be public. Requires a LangChain Hub handle.
   * @returns A Promise that resolves to the created Prompt object
   * @throws {Error} If creating a public prompt without a LangChain Hub handle, or if owner doesn't match current tenant
   * @example
   * ```typescript
   * // Create a private prompt
   * const prompt = await client.createPrompt("my-new-prompt", {
   *   description: "A prompt for translations",
   *   tags: ["translation", "language"]
   * });
   *
   * // Create a public prompt
   * const publicPrompt = await client.createPrompt("my-public-prompt", {
   *   description: "A public translation prompt",
   *   isPublic: true
   * });
   * ```
   */
  async createPrompt(promptIdentifier, options) {
    const settings = await this._getSettings();
    if (options?.isPublic && !settings.tenant_handle) {
      throw new Error(`Cannot create a public prompt without first

        creating a LangChain Hub handle.
        You can add a handle by creating a public prompt at:

        https://smith.langchain.com/prompts`);
    }
    const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
    if (!await this._currentTenantIsOwner(owner)) {
      throw await this._ownerConflictError("create a prompt", owner);
    }
    const data = {
      repo_handle: promptName,
      ...options?.description && { description: options.description },
      ...options?.readme && { readme: options.readme },
      ...options?.tags && { tags: options.tags },
      is_public: !!options?.isPublic
    };
    const body = JSON.stringify(data);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/repos/`, {
        method: "POST",
        headers: { ...this._mergedHeaders, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "create prompt");
      return res;
    });
    const { repo } = await response.json();
    return repo;
  }
  /**
   * Create a new commit for an existing prompt.
   * @param promptIdentifier - The identifier of the prompt. Can be in the format:
   *   - "promptName" (for private prompts, owner defaults to "-")
   *   - "owner/promptName" (for prompts with explicit owner)
   * @param object - The prompt object/manifest to commit (e.g., ChatPromptTemplate, messages array, etc.)
   * @param options - Optional configuration for the commit
   * @param options.parentCommitHash - The parent commit hash. Defaults to "latest" (the most recent commit).
   * @param options.tags - A tag or list of tags to apply to the commit.
   * @param options.description - A description for the commit.
   * @returns A Promise that resolves to the URL of the newly created commit
   * @throws {Error} If the prompt does not exist
   * @example
   * ```typescript
   * import { ChatPromptTemplate } from "@langchain/core/prompts";
   *
   * // Create a commit with a new version of the prompt
   * const template = ChatPromptTemplate.fromMessages([
   *   ["system", "You are a helpful assistant."],
   *   ["human", "{input}"]
   * ]);
   *
   * const commitUrl = await client.createCommit("my-prompt", template);
   * console.log(`Commit created: ${commitUrl}`);
   *
   * // Create a commit with tags
   * const commitUrl2 = await client.createCommit("my-prompt", template, {
   *   tags: ["production", "v1"]
   * });
   * ```
   */
  async createCommit(promptIdentifier, object, options) {
    if (!await this.promptExists(promptIdentifier)) {
      throw new Error("Prompt does not exist, you must create it first.");
    }
    const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
    const resolvedParentCommitHash = options?.parentCommitHash === "latest" || !options?.parentCommitHash ? await this._getLatestCommitHash(`${owner}/${promptName}`) : options?.parentCommitHash;
    const payload = {
      manifest: JSON.parse(JSON.stringify(object)),
      parent_commit: resolvedParentCommitHash,
      ...options?.description !== void 0 && {
        description: options.description
      }
    };
    const body = JSON.stringify(payload);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/commits/${owner}/${promptName}`, {
        method: "POST",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "create commit");
      return res;
    });
    const result = await response.json();
    const commit = result.commit ?? result;
    if (options?.tags) {
      await this._createCommitTags(`${owner}/${promptName}`, commit.id, options.tags);
    }
    return this._getPromptUrl(`${owner}/${promptName}${commit.commit_hash ? `:${commit.commit_hash}` : ""}`);
  }
  /**
   * Update examples with attachments using multipart form data.
   * @param updates List of ExampleUpdateWithAttachments objects to upsert
   * @returns Promise with the update response
   */
  async updateExamplesMultipart(datasetId, updates = []) {
    return this._updateExamplesMultipart(datasetId, updates);
  }
  async _updateExamplesMultipart(datasetId, updates = []) {
    if (!await this._getDatasetExamplesMultiPartSupport()) {
      throw new Error("Your LangSmith deployment does not allow using the multipart examples endpoint, please upgrade your deployment to the latest version.");
    }
    const formData = new FormData();
    for (const example of updates) {
      const exampleId = example.id;
      const exampleBody = {
        ...example.metadata && { metadata: example.metadata },
        ...example.split && { split: example.split }
      };
      const stringifiedExample = serialize(exampleBody, `Serializing body for example with id: ${exampleId}`);
      const exampleBlob = new Blob([stringifiedExample], {
        type: "application/json"
      });
      formData.append(exampleId, exampleBlob);
      if (example.inputs) {
        const stringifiedInputs = serialize(example.inputs, `Serializing inputs for example with id: ${exampleId}`);
        const inputsBlob = new Blob([stringifiedInputs], {
          type: "application/json"
        });
        formData.append(`${exampleId}.inputs`, inputsBlob);
      }
      if (example.outputs) {
        const stringifiedOutputs = serialize(example.outputs, `Serializing outputs whle updating example with id: ${exampleId}`);
        const outputsBlob = new Blob([stringifiedOutputs], {
          type: "application/json"
        });
        formData.append(`${exampleId}.outputs`, outputsBlob);
      }
      if (example.attachments) {
        for (const [name, attachment] of Object.entries(example.attachments)) {
          let mimeType;
          let data;
          if (Array.isArray(attachment)) {
            [mimeType, data] = attachment;
          } else {
            mimeType = attachment.mimeType;
            data = attachment.data;
          }
          const attachmentBlob = new Blob([data], {
            type: `${mimeType}; length=${data.byteLength}`
          });
          formData.append(`${exampleId}.attachment.${name}`, attachmentBlob);
        }
      }
      if (example.attachments_operations) {
        const stringifiedAttachmentsOperations = serialize(example.attachments_operations, `Serializing attachments while updating example with id: ${exampleId}`);
        const attachmentsOperationsBlob = new Blob([stringifiedAttachmentsOperations], {
          type: "application/json"
        });
        formData.append(`${exampleId}.attachments_operations`, attachmentsOperationsBlob);
      }
    }
    const datasetIdToUse = datasetId ?? updates[0]?.dataset_id;
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}${this._getPlatformEndpointPath(`datasets/${datasetIdToUse}/examples`)}`, {
        method: "PATCH",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: formData
      });
      await raiseForStatus(res, "update examples");
      return res;
    });
    return response.json();
  }
  /**
   * Upload examples with attachments using multipart form data.
   * @param uploads List of ExampleUploadWithAttachments objects to upload
   * @returns Promise with the upload response
   * @deprecated This method is deprecated and will be removed in future LangSmith versions, please use `createExamples` instead
   */
  async uploadExamplesMultipart(datasetId, uploads = []) {
    return this._uploadExamplesMultipart(datasetId, uploads);
  }
  async _uploadExamplesMultipart(datasetId, uploads = []) {
    if (!await this._getDatasetExamplesMultiPartSupport()) {
      throw new Error("Your LangSmith deployment does not allow using the multipart examples endpoint, please upgrade your deployment to the latest version.");
    }
    const formData = new FormData();
    for (const example of uploads) {
      const exampleId = (example.id ?? v4_default()).toString();
      const exampleBody = {
        created_at: example.created_at,
        ...example.metadata && { metadata: example.metadata },
        ...example.split && { split: example.split },
        ...example.source_run_id && { source_run_id: example.source_run_id },
        ...example.use_source_run_io && {
          use_source_run_io: example.use_source_run_io
        },
        ...example.use_source_run_attachments && {
          use_source_run_attachments: example.use_source_run_attachments
        }
      };
      const stringifiedExample = serialize(exampleBody, `Serializing body for uploaded example with id: ${exampleId}`);
      const exampleBlob = new Blob([stringifiedExample], {
        type: "application/json"
      });
      formData.append(exampleId, exampleBlob);
      if (example.inputs) {
        const stringifiedInputs = serialize(example.inputs, `Serializing inputs for uploaded example with id: ${exampleId}`);
        const inputsBlob = new Blob([stringifiedInputs], {
          type: "application/json"
        });
        formData.append(`${exampleId}.inputs`, inputsBlob);
      }
      if (example.outputs) {
        const stringifiedOutputs = serialize(example.outputs, `Serializing outputs for uploaded example with id: ${exampleId}`);
        const outputsBlob = new Blob([stringifiedOutputs], {
          type: "application/json"
        });
        formData.append(`${exampleId}.outputs`, outputsBlob);
      }
      if (example.attachments) {
        for (const [name, attachment] of Object.entries(example.attachments)) {
          let mimeType;
          let data;
          if (Array.isArray(attachment)) {
            [mimeType, data] = attachment;
          } else {
            mimeType = attachment.mimeType;
            data = attachment.data;
          }
          const attachmentBlob = new Blob([data], {
            type: `${mimeType}; length=${data.byteLength}`
          });
          formData.append(`${exampleId}.attachment.${name}`, attachmentBlob);
        }
      }
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}${this._getPlatformEndpointPath(`datasets/${datasetId}/examples`)}`, {
        method: "POST",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: formData
      });
      await raiseForStatus(res, "upload examples");
      return res;
    });
    return response.json();
  }
  async updatePrompt(promptIdentifier, options) {
    if (!await this.promptExists(promptIdentifier)) {
      throw new Error("Prompt does not exist, you must create it first.");
    }
    const [owner, promptName] = parseHubIdentifier(promptIdentifier);
    if (!await this._currentTenantIsOwner(owner)) {
      throw await this._ownerConflictError("update a prompt", owner);
    }
    const payload = {};
    if (options?.description !== void 0)
      payload.description = options.description;
    if (options?.readme !== void 0)
      payload.readme = options.readme;
    if (options?.tags !== void 0)
      payload.tags = options.tags;
    if (options?.isPublic !== void 0)
      payload.is_public = options.isPublic;
    if (options?.isArchived !== void 0)
      payload.is_archived = options.isArchived;
    if (Object.keys(payload).length === 0) {
      throw new Error("No valid update options provided");
    }
    const body = JSON.stringify(payload);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${promptName}`, {
        method: "PATCH",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body
      });
      await raiseForStatus(res, "update prompt");
      return res;
    });
    return response.json();
  }
  async deletePrompt(promptIdentifier) {
    if (!await this.promptExists(promptIdentifier)) {
      throw new Error("Prompt does not exist, you must create it first.");
    }
    const [owner, promptName, _] = parseHubIdentifier(promptIdentifier);
    if (!await this._currentTenantIsOwner(owner)) {
      throw await this._ownerConflictError("delete a prompt", owner);
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${promptName}`, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "delete prompt");
      return res;
    });
    return response.json();
  }
  /**
   * Generate a cache key for a prompt.
   * Format: "{identifier}" or "{identifier}:with_model"
   */
  _getPromptCacheKey(promptIdentifier, includeModel) {
    const suffix = includeModel ? ":with_model" : "";
    return `${promptIdentifier}${suffix}`;
  }
  /**
   * Fetch a prompt commit directly from the API (bypassing cache).
   */
  async _fetchPromptFromApi(promptIdentifier, options) {
    const [owner, promptName, commitHash] = parseHubIdentifier(promptIdentifier);
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/commits/${owner}/${promptName}/${commitHash}${options?.includeModel ? "?include_model=true" : ""}`, {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "pull prompt commit");
      return res;
    });
    const result = await response.json();
    return {
      owner,
      repo: promptName,
      commit_hash: result.commit_hash,
      manifest: result.manifest,
      examples: result.examples,
      hub_model_config: result.model_config,
      hub_model_provider: result.model_provider
    };
  }
  /**
   * Pull a prompt commit from the LangSmith API.
   *
   * Public prompts referenced by owner/name cross a trust boundary because the
   * prompt manifest may contain serialized LangChain objects and configuration
   * that affect runtime behavior. For example, a prompt can intentionally
   * configure a model with a custom base URL, headers, model name, or other
   * constructor arguments. These are supported features, but they also mean the
   * prompt contents should be treated as executable configuration rather than
   * plain text.
   *
   * Set `dangerouslyPullPublicPrompt: true` only after reviewing and trusting
   * the prompt contents, not merely the publishing account. Prompts from your
   * own or your organization's account can still be unsafe if that account or
   * prompt was compromised.
   *
   * When pulling a trusted external prompt, prefer pinning to a specific commit
   * rather than following a mutable latest version. Using `includeModel: true`
   * increases risk and should be avoided for public prompts or prompts outside
   * your own organization.
   */
  async pullPromptCommit(promptIdentifier, options) {
    assertPullPublicPromptAllowed(promptIdentifier, options?.dangerouslyPullPublicPrompt);
    const refreshFunc = this._fetchPromptFromApi.bind(this, promptIdentifier, options);
    if (!options?.skipCache && this._promptCache) {
      const cacheKey = this._getPromptCacheKey(promptIdentifier, options?.includeModel);
      const cached2 = this._promptCache.get(cacheKey, refreshFunc);
      if (cached2) {
        return cached2;
      }
      const result = await refreshFunc();
      this._promptCache.set(cacheKey, result, refreshFunc);
      return result;
    }
    return this._fetchPromptFromApi(promptIdentifier, options);
  }
  /**
   * This method should not be used directly, use `import { pull } from "langchain/hub"` instead.
   * Using this method directly returns the JSON string of the prompt rather than a LangChain object.
   *
   * Public prompts referenced by owner/name cross a trust boundary because the
   * prompt manifest may contain serialized LangChain objects and configuration
   * that affect runtime behavior. For example, a prompt can intentionally
   * configure a model with a custom base URL, headers, model name, or other
   * constructor arguments. These are supported features, but they also mean the
   * prompt contents should be treated as executable configuration rather than
   * plain text.
   *
   * Set `dangerouslyPullPublicPrompt: true` only after reviewing and trusting
   * the prompt contents, not merely the publishing account. Prompts from your
   * own or your organization's account can still be unsafe if that account or
   * prompt was compromised.
   *
   * When pulling a trusted external prompt, prefer pinning to a specific commit
   * rather than following a mutable latest version. Using `includeModel: true`
   * increases risk and should be avoided for public prompts or prompts outside
   * your own organization.
   * @private
   */
  async _pullPrompt(promptIdentifier, options) {
    const promptObject = await this.pullPromptCommit(promptIdentifier, {
      includeModel: options?.includeModel,
      skipCache: options?.skipCache,
      dangerouslyPullPublicPrompt: options?.dangerouslyPullPublicPrompt
    });
    const prompt = JSON.stringify(promptObject.manifest);
    return prompt;
  }
  async pushPrompt(promptIdentifier, options) {
    if (await this.promptExists(promptIdentifier)) {
      if (options && ["description", "readme", "tags", "isPublic"].some((key) => options[key] !== void 0)) {
        await this.updatePrompt(promptIdentifier, {
          description: options?.description,
          readme: options?.readme,
          tags: options?.tags,
          isPublic: options?.isPublic
        });
      }
    } else {
      await this.createPrompt(promptIdentifier, {
        description: options?.description,
        readme: options?.readme,
        tags: options?.tags,
        isPublic: options?.isPublic
      });
    }
    if (!options?.object) {
      return await this._getPromptUrl(promptIdentifier);
    }
    const url = await this.createCommit(promptIdentifier, options?.object, {
      parentCommitHash: options?.parentCommitHash,
      tags: options?.commitTags,
      description: options?.commitDescription
    });
    return url;
  }
  /**
   * Check if an agent repo exists.
   */
  async agentExists(identifier) {
    const [owner, name] = parseHubIdentifier(identifier);
    return this._repoExists(owner, name);
  }
  /**
   * Check if a skill repo exists.
   */
  async skillExists(identifier) {
    const [owner, name] = parseHubIdentifier(identifier);
    return this._repoExists(owner, name);
  }
  /**
   * Pull an agent directory from Hub.
   * @param identifier The identifier (owner/name[:version]).
   * @param options.version Commit hash or tag; overrides identifier's version.
   */
  async pullAgent(identifier, options) {
    return await this._pullDirectory(identifier, "agent", options?.version);
  }
  /**
   * Pull a skill directory from Hub.
   */
  async pullSkill(identifier, options) {
    return await this._pullDirectory(identifier, "skill", options?.version);
  }
  /**
   * Push an agent to Hub. Creates the repo if missing, patches metadata if
   * provided, then commits the given files.
   * @returns The URL of the resulting commit.
   */
  async pushAgent(identifier, options) {
    return this._pushDirectory(identifier, "agent", options);
  }
  /**
   * Push a skill to Hub.
   */
  async pushSkill(identifier, options) {
    return this._pushDirectory(identifier, "skill", options);
  }
  /**
   * Delete an agent and all its owned child file repos.
   */
  async deleteAgent(identifier) {
    return this._deleteDirectory(identifier);
  }
  /**
   * Delete a skill and all its owned child file repos.
   */
  async deleteSkill(identifier) {
    return this._deleteDirectory(identifier);
  }
  /**
   * List agent repos. Yields one at a time, auto-paginating.
   */
  async *listAgents(options) {
    yield* this._listReposByType("agent", options);
  }
  /**
   * List skill repos. Yields one at a time, auto-paginating.
   */
  async *listSkills(options) {
    yield* this._listReposByType("skill", options);
  }
  async *_listReposByType(repoType, options) {
    const params = new URLSearchParams();
    params.append("repo_type", repoType);
    params.append("is_archived", (!!options?.isArchived).toString());
    if (options?.isPublic !== void 0) {
      params.append("is_public", options.isPublic.toString());
    }
    if (options?.query) {
      params.append("query", options.query);
    }
    for await (const repos of this._getPaginated("/repos", params, (res) => res.repos)) {
      yield* repos;
    }
  }
  async _pullDirectory(identifier, repoType, version3) {
    const [owner, name, parsedVersion] = parseHubIdentifier(identifier);
    const resolvedVersion = version3 ?? (parsedVersion !== "latest" ? parsedVersion : void 0);
    const url = new URL(`${this.apiUrl}/v1/platform/hub/repos/${owner}/${name}/directories`);
    url.searchParams.set("repo_type", repoType);
    if (resolvedVersion) {
      url.searchParams.set("commit", resolvedVersion);
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(url.toString(), {
        method: "GET",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "pull directory");
      return res;
    });
    return await response.json();
  }
  async _pushDirectory(identifier, repoType, options) {
    if (options.parentCommit !== void 0 && (options.parentCommit.length < 8 || options.parentCommit.length > 64)) {
      throw new Error("parent_commit must be 8-64 characters");
    }
    const [owner, name] = parseHubIdentifier(identifier);
    if (!await this._currentTenantIsOwner(owner)) {
      throw await this._ownerConflictError(`push ${repoType}`, owner);
    }
    if (await this._repoExists(owner, name)) {
      if (options.description !== void 0 || options.readme !== void 0 || options.tags !== void 0 || options.isPublic !== void 0) {
        await this._updateRepoMetadata(owner, name, options);
      }
    } else {
      const REPO_HANDLE_PATTERN = /^[a-z][a-z0-9-_]*$/;
      if (!REPO_HANDLE_PATTERN.test(name)) {
        throw new Error(`Invalid repo_handle ${JSON.stringify(name)}: must match ${REPO_HANDLE_PATTERN}`);
      }
      await this._createRepo(name, repoType, options);
    }
    const body = { files: options.files };
    if (options.parentCommit) {
      body.parent_commit = options.parentCommit;
    }
    const response = await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/v1/platform/hub/repos/${owner}/${name}/directories/commits`, {
        method: "POST",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: JSON.stringify(body)
      });
      await raiseForStatus(res, `push ${repoType}`);
      return res;
    });
    const data = await response.json();
    const commitHash = data.commit.commit_hash;
    const settings = await this._getSettings();
    const query = new URLSearchParams({ organizationId: settings.id });
    return `${this.getHostUrl()}/context/${name}/${commitHash.slice(0, 8)}?${query.toString()}`;
  }
  async _deleteDirectory(identifier) {
    const [owner, name] = parseHubIdentifier(identifier);
    if (!await this._currentTenantIsOwner(owner)) {
      throw await this._ownerConflictError("delete", owner);
    }
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/v1/platform/hub/repos/${owner}/${name}/directories`, {
        method: "DELETE",
        headers: this._mergedHeaders,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      await raiseForStatus(res, "delete directory");
      return res;
    });
  }
  async _repoExists(owner, name) {
    try {
      await this.caller.call(async () => {
        const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${name}`, {
          method: "GET",
          headers: this._mergedHeaders,
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions
        });
        await raiseForStatus(res, "check repo exists");
        return res;
      });
      return true;
    } catch (e) {
      if (isLangSmithNotFoundError(e)) {
        return false;
      }
      throw e;
    }
  }
  async _createRepo(name, repoType, options) {
    const body = {
      repo_handle: name,
      repo_type: repoType,
      is_public: !!options.isPublic
    };
    if (options.description !== void 0)
      body.description = options.description;
    if (options.readme !== void 0)
      body.readme = options.readme;
    if (options.tags !== void 0)
      body.tags = options.tags;
    try {
      await this.caller.call(async () => {
        const res = await this._fetch(`${this.apiUrl}/repos/`, {
          method: "POST",
          headers: {
            ...this._mergedHeaders,
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(this.timeout_ms),
          ...this.fetchOptions,
          body: JSON.stringify(body)
        });
        await raiseForStatus(res, `create ${repoType}`);
        return res;
      });
    } catch (e) {
      if (isLangSmithConflictError(e)) {
        return;
      }
      throw e;
    }
  }
  async _updateRepoMetadata(owner, name, options) {
    const body = {};
    if (options.description !== void 0)
      body.description = options.description;
    if (options.readme !== void 0)
      body.readme = options.readme;
    if (options.tags !== void 0)
      body.tags = options.tags;
    if (options.isPublic !== void 0)
      body.is_public = options.isPublic;
    if (Object.keys(body).length === 0)
      return;
    await this.caller.call(async () => {
      const res = await this._fetch(`${this.apiUrl}/repos/${owner}/${name}`, {
        method: "PATCH",
        headers: {
          ...this._mergedHeaders,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: JSON.stringify(body)
      });
      await raiseForStatus(res, "update repo metadata");
      return res;
    });
  }
  /**
     * Clone a public dataset to your own langsmith tenant.
     * This operation is idempotent. If you already have a dataset with the given name,
     * this function will do nothing.
  
     * @param {string} tokenOrUrl The token of the public dataset to clone.
     * @param {Object} [options] Additional options for cloning the dataset.
     * @param {string} [options.sourceApiUrl] The URL of the langsmith server where the data is hosted. Defaults to the API URL of your current client.
     * @param {string} [options.datasetName] The name of the dataset to create in your tenant. Defaults to the name of the public dataset.
     * @returns {Promise<void>}
     */
  async clonePublicDataset(tokenOrUrl, options = {}) {
    const { sourceApiUrl = this.apiUrl, datasetName } = options;
    const [parsedApiUrl, tokenUuid] = this.parseTokenOrUrl(tokenOrUrl, sourceApiUrl);
    const sourceClient = new _Client({
      apiUrl: parsedApiUrl,
      // Placeholder API key not needed anymore in most cases, but
      // some private deployments may have API key-based rate limiting
      // that would cause this to fail if we provide no value.
      apiKey: "placeholder"
    });
    const ds = await sourceClient.readSharedDataset(tokenUuid);
    const finalDatasetName = datasetName || ds.name;
    try {
      if (await this.hasDataset({ datasetId: finalDatasetName })) {
        console.log(`Dataset ${finalDatasetName} already exists in your tenant. Skipping.`);
        return;
      }
    } catch (_) {
    }
    const examples = await sourceClient.listSharedExamples(tokenUuid);
    const dataset = await this.createDataset(finalDatasetName, {
      description: ds.description,
      dataType: ds.data_type || "kv",
      inputsSchema: ds.inputs_schema_definition ?? void 0,
      outputsSchema: ds.outputs_schema_definition ?? void 0
    });
    try {
      await this.createExamples({
        inputs: examples.map((e) => e.inputs),
        outputs: examples.flatMap((e) => e.outputs ? [e.outputs] : []),
        datasetId: dataset.id
      });
    } catch (e) {
      console.error(`An error occurred while creating dataset ${finalDatasetName}. You should delete it manually.`);
      throw e;
    }
  }
  parseTokenOrUrl(urlOrToken, apiUrl, numParts = 2, kind = "dataset") {
    try {
      assertUuid(urlOrToken);
      return [apiUrl, urlOrToken];
    } catch (_) {
    }
    try {
      const parsedUrl = new URL(urlOrToken);
      const pathParts = parsedUrl.pathname.split("/").filter((part) => part !== "");
      if (pathParts.length >= numParts) {
        const tokenUuid = pathParts[pathParts.length - numParts];
        return [apiUrl, tokenUuid];
      } else {
        throw new Error(`Invalid public ${kind} URL: ${urlOrToken}`);
      }
    } catch (_error) {
      throw new Error(`Invalid public ${kind} URL or token: ${urlOrToken}`);
    }
  }
  /**
   * Cleanup resources held by the client.
   * Stops the cache's background refresh timer.
   */
  cleanup() {
    if (this._promptCache) {
      this._promptCache.stop();
    }
  }
  /**
   * Awaits all pending trace batches. Useful for environments where
   * you need to be sure that all tracing requests finish before execution ends,
   * such as serverless environments.
   *
   * @example
   * ```
   * import { Client } from "langsmith";
   *
   * const client = new Client();
   *
   * try {
   *   // Tracing happens here
   *   ...
   * } finally {
   *   await client.awaitPendingTraceBatches();
   * }
   * ```
   *
   * @returns A promise that resolves once all currently pending traces have sent.
   */
  async awaitPendingTraceBatches() {
    if (this.manualFlushMode) {
      console.warn("[WARNING]: When tracing in manual flush mode, you must call `await client.flush()` manually to submit trace batches.");
      return Promise.resolve();
    }
    await new Promise((resolve3) => setTimeout(resolve3, 1));
    while (this._pendingDrains.size > 0) {
      await Promise.all([...this._pendingDrains]);
    }
    await Promise.all([
      ...this.autoBatchQueue.items.map(({ itemPromise }) => itemPromise),
      this.batchIngestCaller.queue.onIdle()
    ]);
    if (this.langSmithToOTELTranslator !== void 0) {
      await getDefaultOTLPTracerComponents()?.DEFAULT_LANGSMITH_SPAN_PROCESSOR?.forceFlush();
    }
  }
  /**
   * Returns a string representation of the Client instance.
   * This method is called when the object is converted to a string
   * or logged, ensuring sensitive information like API keys is not exposed.
   *
   * @returns A string representation of the Client.
   */
  toString() {
    const params = [`apiUrl=${JSON.stringify(this.apiUrl)}`];
    if (this.webUrl !== void 0) {
      params.push(`webUrl=${JSON.stringify(this.webUrl)}`);
    }
    if (this.workspaceId !== void 0) {
      params.push(`workspaceId=${JSON.stringify(this.workspaceId)}`);
    }
    return `[LangSmithClient ${params.join(" ")}]`;
  }
  /**
   * Custom inspect method for Node.js.
   * This method is called when the object is inspected in the Node.js REPL
   * or with console.log, ensuring sensitive information like API keys is not exposed.
   *
   * @returns A string representation of the Client for inspection.
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toString();
  }
};
Object.defineProperty(Client, "_fallbackDirsCreated", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: /* @__PURE__ */ new Set()
});
function isExampleCreate(input) {
  return "dataset_id" in input || "dataset_name" in input;
}

// ../../node_modules/langsmith/dist/env.js
var isTracingEnabled = (tracingEnabled) => {
  if (tracingEnabled !== void 0) {
    return tracingEnabled;
  }
  const envVars = ["TRACING_V2", "TRACING"];
  return !!envVars.find((envVar) => getLangSmithEnvironmentVariable(envVar) === "true");
};

// ../../node_modules/langsmith/dist/singletons/constants.js
var _LC_CONTEXT_VARIABLES_KEY = Symbol.for("lc:context_variables");
var _LC_CHILD_RUN_END_PROMISES_KEY = Symbol.for("lc:child_run_end_promises");
var _REPLICA_TRACE_ROOTS_KEY = Symbol.for("langsmith:replica_trace_roots");

// ../../node_modules/langsmith/dist/utils/context_vars.js
function getContextVar(runTree, key) {
  if (_LC_CONTEXT_VARIABLES_KEY in runTree) {
    const contextVars = runTree[_LC_CONTEXT_VARIABLES_KEY];
    return contextVars[key];
  }
  return void 0;
}
function setContextVar(runTree, key, value) {
  const contextVars = _LC_CONTEXT_VARIABLES_KEY in runTree ? (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runTree[_LC_CONTEXT_VARIABLES_KEY]
  ) : {};
  contextVars[key] = value;
  runTree[_LC_CONTEXT_VARIABLES_KEY] = contextVars;
}

// ../../node_modules/langsmith/dist/run_trees.js
var TIMESTAMP_LENGTH = 36;
var UUID_NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
function getReplicaKey(replica) {
  const sortedKeys = Object.keys(replica).sort();
  const keyData = sortedKeys.map((key) => `${key}:${replica[key] ?? ""}`).join("|");
  return v5_default(keyData, UUID_NAMESPACE_DNS);
}
function stripNonAlphanumeric(input) {
  return input.replace(/[-:.]/g, "");
}
function getMicrosecondPrecisionDatestring(epoch, executionOrder = 1) {
  const paddedOrder = executionOrder.toFixed(0).slice(0, 3).padStart(3, "0");
  return `${new Date(epoch).toISOString().slice(0, -1)}${paddedOrder}Z`;
}
function convertToDottedOrderFormat(epoch, runId, executionOrder = 1) {
  const microsecondPrecisionDatestring = getMicrosecondPrecisionDatestring(epoch, executionOrder);
  return {
    dottedOrder: stripNonAlphanumeric(microsecondPrecisionDatestring) + runId,
    microsecondPrecisionDatestring
  };
}
var HEADER_SAFE_REPLICA_FIELDS = /* @__PURE__ */ new Set([
  "projectName",
  "updates",
  "reroot"
]);
function filterReplicaForHeaders(replica) {
  const filtered = {};
  for (const key of Object.keys(replica)) {
    if (HEADER_SAFE_REPLICA_FIELDS.has(key)) {
      filtered[key] = replica[key];
    }
  }
  return filtered;
}
var Baggage = class _Baggage {
  constructor(metadata, tags, project_name, replicas) {
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "project_name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "replicas", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.metadata = metadata;
    this.tags = tags;
    this.project_name = project_name;
    this.replicas = replicas;
  }
  static fromHeader(value) {
    const items = value.split(",");
    let metadata = {};
    let tags = [];
    let project_name;
    let replicas;
    for (const item of items) {
      const [key, uriValue] = item.split("=");
      const value2 = decodeURIComponent(uriValue);
      if (key === "langsmith-metadata") {
        metadata = JSON.parse(value2);
      } else if (key === "langsmith-tags") {
        tags = value2.split(",");
      } else if (key === "langsmith-project") {
        project_name = value2;
      } else if (key === "langsmith-replicas") {
        const parsed = JSON.parse(value2);
        replicas = parsed.map((replica) => {
          if (Array.isArray(replica)) {
            return replica;
          }
          return filterReplicaForHeaders(replica);
        });
      }
    }
    return new _Baggage(metadata, tags, project_name, replicas);
  }
  toHeader() {
    const items = [];
    if (this.metadata && Object.keys(this.metadata).length > 0) {
      items.push(`langsmith-metadata=${encodeURIComponent(JSON.stringify(this.metadata))}`);
    }
    if (this.tags && this.tags.length > 0) {
      items.push(`langsmith-tags=${encodeURIComponent(this.tags.join(","))}`);
    }
    if (this.project_name) {
      items.push(`langsmith-project=${encodeURIComponent(this.project_name)}`);
    }
    return items.join(",");
  }
};
var RunTree = class _RunTree {
  constructor(originalConfig) {
    Object.defineProperty(this, "id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "run_type", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "project_name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "parent_run", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "parent_run_id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "child_runs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "start_time", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "end_time", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "extra", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "error", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "serialized", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "inputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "outputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "reference_example_id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "client", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "events", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "trace_id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "dotted_order", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tracingEnabled", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "execution_order", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "child_execution_order", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "attachments", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "replicas", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "distributedParentId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_serialized_start_time", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_awaitInputsOnPost", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    if (isRunTree(originalConfig)) {
      Object.assign(this, { ...originalConfig });
      return;
    }
    const defaultConfig = _RunTree.getDefaultConfig();
    const { metadata, ...config2 } = originalConfig;
    const client2 = config2.client ?? _RunTree.getSharedClient();
    const dedupedMetadata = {
      ...metadata,
      ...config2?.extra?.metadata
    };
    config2.extra = { ...config2.extra, metadata: dedupedMetadata };
    if ("id" in config2 && config2.id == null) {
      delete config2.id;
    }
    Object.assign(this, { ...defaultConfig, ...config2, client: client2 });
    this.execution_order ??= 1;
    this.child_execution_order ??= 1;
    if (!this.dotted_order) {
      this._serialized_start_time = getMicrosecondPrecisionDatestring(this.start_time, this.execution_order);
    }
    if (!this.id) {
      this.id = uuid7FromTime(this._serialized_start_time ?? this.start_time);
    }
    if (!this.trace_id) {
      if (this.parent_run) {
        this.trace_id = this.parent_run.trace_id ?? this.id;
      } else {
        this.trace_id = this.id;
      }
    }
    this.replicas = _ensureWriteReplicas(this.replicas);
    if (!this.dotted_order) {
      const { dottedOrder } = convertToDottedOrderFormat(this.start_time, this.id, this.execution_order);
      if (this.parent_run) {
        this.dotted_order = this.parent_run.dotted_order + "." + dottedOrder;
      } else {
        this.dotted_order = dottedOrder;
      }
    }
  }
  set metadata(metadata) {
    this.extra = {
      ...this.extra,
      metadata: {
        ...this.extra?.metadata,
        ...metadata
      }
    };
  }
  get metadata() {
    return this.extra?.metadata;
  }
  static getDefaultConfig() {
    const start_time = Date.now();
    return {
      run_type: "chain",
      project_name: getDefaultProjectName(),
      child_runs: [],
      api_url: getEnvironmentVariable2("LANGCHAIN_ENDPOINT") ?? "http://localhost:1984",
      api_key: getEnvironmentVariable2("LANGCHAIN_API_KEY"),
      caller_options: {},
      start_time,
      serialized: {},
      inputs: {},
      extra: {}
    };
  }
  static getSharedClient() {
    if (!_RunTree.sharedClient) {
      _RunTree.sharedClient = new Client();
    }
    return _RunTree.sharedClient;
  }
  createChild(config2) {
    const child_execution_order = this.child_execution_order + 1;
    const inheritedReplicas = this.replicas?.map((replica) => {
      const { reroot, ...rest } = replica;
      return rest;
    });
    const childReplicas = config2.replicas ?? inheritedReplicas;
    const child = new _RunTree({
      ...config2,
      parent_run: this,
      project_name: this.project_name,
      replicas: childReplicas,
      client: this.client,
      tracingEnabled: this.tracingEnabled,
      execution_order: child_execution_order,
      child_execution_order
    });
    const parentMeta = this.extra?.metadata ?? {};
    const childMeta = child.extra?.metadata ?? {};
    if (Object.keys(parentMeta).length > 0) {
      child.extra = {
        ...child.extra,
        metadata: { ...parentMeta, ...childMeta }
      };
    }
    if (_LC_CONTEXT_VARIABLES_KEY in this) {
      child[_LC_CONTEXT_VARIABLES_KEY] = this[_LC_CONTEXT_VARIABLES_KEY];
    }
    const LC_CHILD = Symbol.for("lc:child_config");
    const presentConfig = config2.extra?.[LC_CHILD] ?? this.extra[LC_CHILD];
    if (isRunnableConfigLike(presentConfig)) {
      const newConfig = { ...presentConfig };
      const callbacks = isCallbackManagerLike(newConfig.callbacks) ? newConfig.callbacks.copy?.() : void 0;
      if (callbacks) {
        Object.assign(callbacks, { _parentRunId: child.id });
        callbacks.handlers?.find(isLangChainTracerLike)?.updateFromRunTree?.(child);
        newConfig.callbacks = callbacks;
      }
      child.extra[LC_CHILD] = newConfig;
    }
    const visited = /* @__PURE__ */ new Set();
    let current = this;
    while (current != null && !visited.has(current.id)) {
      visited.add(current.id);
      current.child_execution_order = Math.max(current.child_execution_order, child_execution_order);
      current = current.parent_run;
    }
    this.child_runs.push(child);
    return child;
  }
  async end(outputs, error, endTime = Date.now(), metadata) {
    this.outputs = this.outputs ?? outputs;
    this.error = this.error ?? error;
    this.end_time = this.end_time ?? endTime;
    if (metadata && Object.keys(metadata).length > 0) {
      this.extra = this.extra ? { ...this.extra, metadata: { ...this.extra.metadata, ...metadata } } : { metadata };
    }
  }
  _convertToCreate(run, runtimeEnv, excludeChildRuns = true) {
    const runExtra = run.extra ?? {};
    if (runExtra?.runtime?.library === void 0) {
      if (!runExtra.runtime) {
        runExtra.runtime = {};
      }
      if (runtimeEnv) {
        for (const [k, v] of Object.entries(runtimeEnv)) {
          if (!runExtra.runtime[k]) {
            runExtra.runtime[k] = v;
          }
        }
      }
    }
    const parent_run_id = run.parent_run?.id ?? run.parent_run_id;
    let child_runs;
    if (!excludeChildRuns) {
      child_runs = run.child_runs.map((child_run) => this._convertToCreate(child_run, runtimeEnv, excludeChildRuns));
    } else {
      child_runs = [];
    }
    return {
      id: run.id,
      name: run.name,
      start_time: run._serialized_start_time ?? run.start_time,
      end_time: run.end_time,
      run_type: run.run_type,
      reference_example_id: run.reference_example_id,
      extra: runExtra,
      serialized: run.serialized,
      error: run.error,
      inputs: run.inputs,
      outputs: run.outputs,
      session_name: run.project_name,
      child_runs,
      parent_run_id,
      trace_id: run.trace_id,
      dotted_order: run.dotted_order,
      tags: run.tags,
      attachments: run.attachments,
      events: run.events
    };
  }
  _sliceParentId(parentId, run) {
    if (run.dotted_order) {
      const segs = run.dotted_order.split(".");
      let startIdx = null;
      for (let idx = 0; idx < segs.length; idx++) {
        const segId = segs[idx].slice(-TIMESTAMP_LENGTH);
        if (segId === parentId) {
          startIdx = idx;
          break;
        }
      }
      if (startIdx !== null) {
        const trimmedSegs = segs.slice(startIdx + 1);
        run.dotted_order = trimmedSegs.join(".");
        if (trimmedSegs.length > 0) {
          run.trace_id = trimmedSegs[0].slice(-TIMESTAMP_LENGTH);
        } else {
          run.trace_id = run.id;
        }
      }
    }
    if (run.parent_run_id === parentId) {
      run.parent_run_id = void 0;
    }
  }
  _setReplicaTraceRoot(replicaKey, traceRootId) {
    const replicaTraceRoots = getContextVar(this, _REPLICA_TRACE_ROOTS_KEY) ?? {};
    replicaTraceRoots[replicaKey] = traceRootId;
    setContextVar(this, _REPLICA_TRACE_ROOTS_KEY, replicaTraceRoots);
    for (const child of this.child_runs) {
      child._setReplicaTraceRoot(replicaKey, traceRootId);
    }
  }
  _remapForProject(params) {
    const { projectName, runtimeEnv, excludeChildRuns = true, reroot = false, distributedParentId, apiUrl, apiKey, workspaceId } = params;
    const baseRun = this._convertToCreate(this, runtimeEnv, excludeChildRuns);
    if (projectName === this.project_name) {
      return {
        ...baseRun,
        session_name: projectName
      };
    }
    if (reroot) {
      if (distributedParentId) {
        this._sliceParentId(distributedParentId, baseRun);
      } else {
        baseRun.parent_run_id = void 0;
        if (baseRun.dotted_order) {
          const segs = baseRun.dotted_order.split(".");
          if (segs.length > 0) {
            baseRun.dotted_order = segs[segs.length - 1];
            baseRun.trace_id = baseRun.id;
          }
        }
      }
      const replicaKey = getReplicaKey({
        projectName,
        apiUrl,
        apiKey,
        workspaceId
      });
      this._setReplicaTraceRoot(replicaKey, baseRun.id);
    }
    let ancestorRerootedTraceId;
    if (!reroot) {
      const replicaTraceRoots = getContextVar(this, _REPLICA_TRACE_ROOTS_KEY) ?? {};
      const replicaKey = getReplicaKey({
        projectName,
        apiUrl,
        apiKey,
        workspaceId
      });
      ancestorRerootedTraceId = replicaTraceRoots[replicaKey];
      if (ancestorRerootedTraceId) {
        baseRun.trace_id = ancestorRerootedTraceId;
        if (baseRun.dotted_order) {
          const segs = baseRun.dotted_order.split(".");
          let rootIdx = null;
          for (let idx = 0; idx < segs.length; idx++) {
            const segId = segs[idx].slice(-TIMESTAMP_LENGTH);
            if (segId === ancestorRerootedTraceId) {
              rootIdx = idx;
              break;
            }
          }
          if (rootIdx !== null) {
            const trimmedSegs = segs.slice(rootIdx);
            baseRun.dotted_order = trimmedSegs.join(".");
          }
        }
      }
    }
    const oldId = baseRun.id;
    const newId = nonCryptographicUuid7Deterministic(oldId, projectName);
    let newTraceId;
    if (baseRun.trace_id) {
      newTraceId = nonCryptographicUuid7Deterministic(baseRun.trace_id, projectName);
    } else {
      newTraceId = newId;
    }
    let newParentId;
    if (baseRun.parent_run_id) {
      newParentId = nonCryptographicUuid7Deterministic(baseRun.parent_run_id, projectName);
    }
    let newDottedOrder;
    if (baseRun.dotted_order) {
      const segs = baseRun.dotted_order.split(".");
      const remappedSegs = segs.map((seg) => {
        const segId = seg.slice(-TIMESTAMP_LENGTH);
        const remappedId = nonCryptographicUuid7Deterministic(segId, projectName);
        return seg.slice(0, -TIMESTAMP_LENGTH) + remappedId;
      });
      newDottedOrder = remappedSegs.join(".");
    }
    return {
      ...baseRun,
      id: newId,
      trace_id: newTraceId,
      parent_run_id: newParentId,
      dotted_order: newDottedOrder,
      session_name: projectName
    };
  }
  async postRun(excludeChildRuns = true) {
    if (this._awaitInputsOnPost) {
      this.inputs = await this.inputs;
    }
    try {
      const runtimeEnv = getRuntimeEnvironment2();
      if (this.replicas && this.replicas.length > 0) {
        for (const { projectName, apiKey, apiUrl, workspaceId, reroot, client: replicaClient } of this.replicas) {
          const runCreate = this._remapForProject({
            projectName: projectName ?? this.project_name,
            runtimeEnv,
            excludeChildRuns: true,
            reroot,
            distributedParentId: this.distributedParentId,
            apiUrl,
            apiKey,
            workspaceId
          });
          const targetClient = replicaClient ?? this.client;
          await targetClient.createRun(runCreate, {
            apiKey,
            apiUrl,
            workspaceId
          });
        }
      } else {
        const runCreate = this._convertToCreate(this, runtimeEnv, excludeChildRuns);
        await this.client.createRun(runCreate);
      }
      if (!excludeChildRuns) {
        warnOnce("Posting with excludeChildRuns=false is deprecated and will be removed in a future version.");
        for (const childRun of this.child_runs) {
          await childRun.postRun(false);
        }
      }
      this.child_runs = [];
    } catch (error) {
      console.error(`Error in postRun for run ${this.id}:`, error);
    }
  }
  async patchRun(options) {
    if (this.replicas && this.replicas.length > 0) {
      for (const { projectName, apiKey, apiUrl, workspaceId, updates, reroot, client: replicaClient } of this.replicas) {
        const runData = this._remapForProject({
          projectName: projectName ?? this.project_name,
          runtimeEnv: void 0,
          excludeChildRuns: true,
          reroot,
          distributedParentId: this.distributedParentId,
          apiUrl,
          apiKey,
          workspaceId
        });
        const updatePayload = {
          id: runData.id,
          name: runData.name,
          run_type: runData.run_type,
          start_time: runData.start_time,
          outputs: runData.outputs,
          error: runData.error,
          parent_run_id: runData.parent_run_id,
          session_name: runData.session_name,
          reference_example_id: runData.reference_example_id,
          end_time: runData.end_time,
          dotted_order: runData.dotted_order,
          trace_id: runData.trace_id,
          events: runData.events,
          tags: runData.tags,
          extra: runData.extra,
          attachments: this.attachments,
          ...updates
        };
        if (!options?.excludeInputs) {
          updatePayload.inputs = runData.inputs;
        }
        const targetClient = replicaClient ?? this.client;
        await targetClient.updateRun(runData.id, updatePayload, {
          apiKey,
          apiUrl,
          workspaceId
        });
      }
    } else {
      try {
        const runUpdate = {
          name: this.name,
          run_type: this.run_type,
          start_time: this._serialized_start_time ?? this.start_time,
          end_time: this.end_time,
          error: this.error,
          outputs: this.outputs,
          parent_run_id: this.parent_run?.id ?? this.parent_run_id,
          reference_example_id: this.reference_example_id,
          extra: this.extra,
          events: this.events,
          dotted_order: this.dotted_order,
          trace_id: this.trace_id,
          tags: this.tags,
          attachments: this.attachments,
          session_name: this.project_name
        };
        if (!options?.excludeInputs) {
          runUpdate.inputs = this.inputs;
        }
        await this.client.updateRun(this.id, runUpdate);
      } catch (error) {
        console.error(`Error in patchRun for run ${this.id}`, error);
      }
    }
    this.child_runs = [];
  }
  toJSON() {
    return this._convertToCreate(this, void 0, false);
  }
  /**
   * Add an event to the run tree.
   * @param event - A single event or string to add
   */
  addEvent(event) {
    if (!this.events) {
      this.events = [];
    }
    if (typeof event === "string") {
      this.events.push({
        name: "event",
        time: (/* @__PURE__ */ new Date()).toISOString(),
        message: event
      });
    } else {
      this.events.push({
        ...event,
        time: event.time ?? (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  static fromRunnableConfig(parentConfig, props) {
    const callbackManager = parentConfig?.callbacks;
    let parentRun;
    let projectName;
    let client2;
    let tracingEnabled = isTracingEnabled();
    if (callbackManager) {
      const parentRunId = callbackManager?.getParentRunId?.() ?? "";
      const langChainTracer = callbackManager?.handlers?.find((handler) => handler?.name == "langchain_tracer");
      parentRun = langChainTracer?.getRun?.(parentRunId);
      projectName = langChainTracer?.projectName;
      client2 = langChainTracer?.client;
      tracingEnabled = tracingEnabled || !!langChainTracer;
    }
    if (!parentRun) {
      return new _RunTree({
        ...props,
        client: client2,
        tracingEnabled,
        project_name: projectName
      });
    }
    const parentRunTree = new _RunTree({
      name: parentRun.name,
      id: parentRun.id,
      trace_id: parentRun.trace_id,
      dotted_order: parentRun.dotted_order,
      client: client2,
      tracingEnabled,
      project_name: projectName,
      tags: [
        ...new Set((parentRun?.tags ?? []).concat(parentConfig?.tags ?? []))
      ],
      extra: {
        metadata: {
          ...parentRun?.extra?.metadata,
          ...parentConfig?.metadata
        }
      }
    });
    return parentRunTree.createChild(props);
  }
  static fromDottedOrder(dottedOrder) {
    return this.fromHeaders({ "langsmith-trace": dottedOrder });
  }
  static fromHeaders(headers, inheritArgs) {
    const rawHeaders = "get" in headers && typeof headers.get === "function" ? {
      "langsmith-trace": headers.get("langsmith-trace"),
      baggage: headers.get("baggage")
    } : headers;
    const headerTrace = rawHeaders["langsmith-trace"];
    if (!headerTrace || typeof headerTrace !== "string")
      return void 0;
    const parentDottedOrder = headerTrace.trim();
    const parsedDottedOrder = parentDottedOrder.split(".").map((part) => {
      const [strTime, uuid2] = part.split("Z");
      return { strTime, time: Date.parse(strTime + "Z"), uuid: uuid2 };
    });
    const traceId = parsedDottedOrder[0].uuid;
    const config2 = {
      ...inheritArgs,
      name: inheritArgs?.["name"] ?? "parent",
      run_type: inheritArgs?.["run_type"] ?? "chain",
      start_time: inheritArgs?.["start_time"] ?? Date.now(),
      id: parsedDottedOrder.at(-1)?.uuid,
      trace_id: traceId,
      dotted_order: parentDottedOrder
    };
    if (rawHeaders["baggage"] && typeof rawHeaders["baggage"] === "string") {
      const baggage = Baggage.fromHeader(rawHeaders["baggage"]);
      config2.metadata = baggage.metadata;
      config2.tags = baggage.tags;
      config2.project_name = baggage.project_name;
      config2.replicas = baggage.replicas;
    }
    const runTree = new _RunTree(config2);
    runTree.distributedParentId = runTree.id;
    return runTree;
  }
  toHeaders(headers) {
    const result = {
      "langsmith-trace": this.dotted_order,
      baggage: new Baggage(this.extra?.metadata, this.tags, this.project_name, this.replicas).toHeader()
    };
    if (headers) {
      for (const [key, value] of Object.entries(result)) {
        headers.set(key, value);
      }
    }
    return result;
  }
};
Object.defineProperty(RunTree, "sharedClient", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: null
});
function isRunTree(x) {
  return x != null && typeof x.createChild === "function" && typeof x.postRun === "function";
}
function isLangChainTracerLike(x) {
  return typeof x === "object" && x != null && typeof x.name === "string" && x.name === "langchain_tracer";
}
function containsLangChainTracerLike(x) {
  return Array.isArray(x) && x.some((callback) => isLangChainTracerLike(callback));
}
function isCallbackManagerLike(x) {
  return typeof x === "object" && x != null && Array.isArray(x.handlers);
}
function isRunnableConfigLike(x) {
  const callbacks = x?.callbacks;
  return x != null && typeof callbacks === "object" && // Callback manager with a langchain tracer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (containsLangChainTracerLike(callbacks?.handlers) || // Or it's an array with a LangChainTracerLike object within it
  containsLangChainTracerLike(callbacks));
}
function _getWriteReplicasFromEnv() {
  const envVar = getEnvironmentVariable2("LANGSMITH_RUNS_ENDPOINTS");
  if (!envVar)
    return [];
  try {
    const parsed = JSON.parse(envVar);
    if (Array.isArray(parsed)) {
      const replicas = [];
      for (const item of parsed) {
        if (typeof item !== "object" || item === null) {
          console.warn(`Invalid item type in LANGSMITH_RUNS_ENDPOINTS: expected object, got ${typeof item}`);
          continue;
        }
        if (typeof item.api_url !== "string") {
          console.warn(`Invalid api_url type in LANGSMITH_RUNS_ENDPOINTS: expected string, got ${typeof item.api_url}`);
          continue;
        }
        if (typeof item.api_key !== "string") {
          console.warn(`Invalid api_key type in LANGSMITH_RUNS_ENDPOINTS: expected string, got ${typeof item.api_key}`);
          continue;
        }
        replicas.push({
          apiUrl: item.api_url.replace(/\/$/, ""),
          apiKey: item.api_key
        });
      }
      return replicas;
    } else if (typeof parsed === "object" && parsed !== null) {
      _checkEndpointEnvUnset(parsed);
      const replicas = [];
      for (const [url, key] of Object.entries(parsed)) {
        const cleanUrl = url.replace(/\/$/, "");
        if (typeof key === "string") {
          replicas.push({
            apiUrl: cleanUrl,
            apiKey: key
          });
        } else {
          console.warn(`Invalid value type in LANGSMITH_RUNS_ENDPOINTS for URL ${url}: expected string, got ${typeof key}`);
          continue;
        }
      }
      return replicas;
    } else {
      console.warn(`Invalid LANGSMITH_RUNS_ENDPOINTS \u2013 must be valid JSON array of objects with api_url and api_key properties, or object mapping url->apiKey, got ${typeof parsed}`);
      return [];
    }
  } catch (e) {
    if (isConflictingEndpointsError(e)) {
      throw e;
    }
    console.warn("Invalid LANGSMITH_RUNS_ENDPOINTS \u2013 must be valid JSON array of objects with api_url and api_key properties, or object mapping url->apiKey");
    return [];
  }
}
function _ensureWriteReplicas(replicas) {
  if (replicas) {
    return replicas.map((replica) => {
      if (Array.isArray(replica)) {
        return {
          projectName: replica[0],
          updates: replica[1]
        };
      }
      return replica;
    });
  }
  return _getWriteReplicasFromEnv();
}
function _checkEndpointEnvUnset(parsed) {
  if (Object.keys(parsed).length > 0 && getLangSmithEnvironmentVariable("ENDPOINT")) {
    throw new ConflictingEndpointsError();
  }
}

// ../../node_modules/@langchain/core/dist/tracers/base.js
var convertRunTreeToRun = (runTree) => {
  if (!runTree)
    return;
  runTree.events = runTree.events ?? [];
  runTree.child_runs = runTree.child_runs ?? [];
  return runTree;
};
function convertRunToRunTree(run, parentRun) {
  if (!run)
    return;
  return new RunTree({
    ...run,
    start_time: run._serialized_start_time ?? run.start_time,
    parent_run: convertRunToRunTree(parentRun),
    child_runs: run.child_runs.map((r) => convertRunToRunTree(r)).filter((r) => r !== void 0),
    extra: {
      ...run.extra,
      runtime: getRuntimeEnvironment()
    },
    tracingEnabled: false
  });
}
function _coerceToDict(value, defaultKey) {
  return value && !Array.isArray(value) && typeof value === "object" ? value : { [defaultKey]: value };
}
function isBaseTracer(x) {
  return typeof x._addRunToRunMap === "function";
}
var BaseTracer = class extends BaseCallbackHandler {
  /** @deprecated Use `runTreeMap` instead. */
  runMap = /* @__PURE__ */ new Map();
  runTreeMap = /* @__PURE__ */ new Map();
  usesRunTreeMap = false;
  constructor(_fields) {
    super(...arguments);
  }
  copy() {
    return this;
  }
  getRunById(runId) {
    if (runId === void 0)
      return;
    return this.usesRunTreeMap ? convertRunTreeToRun(this.runTreeMap.get(runId)) : this.runMap.get(runId);
  }
  stringifyError(error) {
    if (error instanceof Error)
      return error.message + (error?.stack ? `

${error.stack}` : "");
    if (typeof error === "string")
      return error;
    return `${error}`;
  }
  _addChildRun(parentRun, childRun) {
    parentRun.child_runs.push(childRun);
  }
  _addRunToRunMap(run) {
    const { dottedOrder: currentDottedOrder, microsecondPrecisionDatestring } = convertToDottedOrderFormat(new Date(run.start_time).getTime(), run.id, run.execution_order);
    const storedRun = { ...run };
    const parentRun = this.getRunById(storedRun.parent_run_id);
    if (storedRun.parent_run_id !== void 0)
      if (parentRun) {
        this._addChildRun(parentRun, storedRun);
        parentRun.child_execution_order = Math.max(parentRun.child_execution_order, storedRun.child_execution_order);
        storedRun.trace_id = parentRun.trace_id;
        if (parentRun.dotted_order !== void 0) {
          storedRun.dotted_order = [parentRun.dotted_order, currentDottedOrder].join(".");
          storedRun._serialized_start_time = microsecondPrecisionDatestring;
        }
      } else
        storedRun.parent_run_id = void 0;
    else {
      storedRun.trace_id = storedRun.id;
      storedRun.dotted_order = currentDottedOrder;
      storedRun._serialized_start_time = microsecondPrecisionDatestring;
    }
    if (this.usesRunTreeMap) {
      const runTree = convertRunToRunTree(storedRun, parentRun);
      if (runTree !== void 0)
        this.runTreeMap.set(storedRun.id, runTree);
    } else
      this.runMap.set(storedRun.id, storedRun);
    return storedRun;
  }
  async _endTrace(run) {
    const parentRun = run.parent_run_id !== void 0 && this.getRunById(run.parent_run_id);
    if (parentRun)
      parentRun.child_execution_order = Math.max(parentRun.child_execution_order, run.child_execution_order);
    else
      await this.persistRun(run);
    await this.onRunUpdate?.(run);
    if (this.usesRunTreeMap)
      this.runTreeMap.delete(run.id);
    else
      this.runMap.delete(run.id);
  }
  _getExecutionOrder(parentRunId) {
    const parentRun = parentRunId !== void 0 && this.getRunById(parentRunId);
    if (!parentRun)
      return 1;
    return parentRun.child_execution_order + 1;
  }
  /**
  * Create and add a run to the run map for LLM start events.
  * This must sometimes be done synchronously to avoid race conditions
  * when callbacks are backgrounded, so we expose it as a separate method here.
  */
  _createRunForLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const finalExtraParams = metadata ? {
      ...extraParams,
      metadata
    } : extraParams;
    const run = {
      id: runId,
      name: name ?? llm.id[llm.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: llm,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: { prompts },
      execution_order,
      child_runs: [],
      child_execution_order: execution_order,
      run_type: "llm",
      extra: finalExtraParams ?? {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name) {
    const run = this.getRunById(runId) ?? this._createRunForLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onLLMStart?.(run);
    return run;
  }
  /**
  * Create and add a run to the run map for chat model start events.
  * This must sometimes be done synchronously to avoid race conditions
  * when callbacks are backgrounded, so we expose it as a separate method here.
  */
  _createRunForChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const finalExtraParams = metadata ? {
      ...extraParams,
      metadata
    } : extraParams;
    const run = {
      id: runId,
      name: name ?? llm.id[llm.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: llm,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: { messages },
      execution_order,
      child_runs: [],
      child_execution_order: execution_order,
      run_type: "llm",
      extra: finalExtraParams ?? {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata, name) {
    const run = this.getRunById(runId) ?? this._createRunForChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onLLMStart?.(run);
    return run;
  }
  async handleLLMEnd(output, runId, _parentRunId, _tags, extraParams) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "llm")
      throw new Error("No LLM run to end.");
    run.end_time = Date.now();
    run.outputs = output;
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    run.extra = {
      ...run.extra,
      ...extraParams
    };
    await this.onLLMEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleLLMError(error, runId, _parentRunId, _tags, extraParams) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "llm")
      throw new Error("No LLM run to end.");
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    run.extra = {
      ...run.extra,
      ...extraParams
    };
    await this.onLLMError?.(run);
    await this._endTrace(run);
    return run;
  }
  /**
  * Create and add a run to the run map for chain start events.
  * This must sometimes be done synchronously to avoid race conditions
  * when callbacks are backgrounded, so we expose it as a separate method here.
  */
  _createRunForChainStart(chain, inputs, runId, parentRunId, tags, metadata, runType, name, extra) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: name ?? chain.id[chain.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: chain,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs,
      execution_order,
      child_execution_order: execution_order,
      run_type: runType ?? "chain",
      child_runs: [],
      extra: metadata ? {
        ...extra,
        metadata
      } : { ...extra },
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleChainStart(chain, inputs, runId, parentRunId, tags, metadata, runType, name) {
    const run = this.getRunById(runId) ?? this._createRunForChainStart(chain, inputs, runId, parentRunId, tags, metadata, runType, name);
    await this.onRunCreate?.(run);
    await this.onChainStart?.(run);
    return run;
  }
  async handleChainEnd(outputs, runId, _parentRunId, _tags, kwargs) {
    const run = this.getRunById(runId);
    if (!run)
      throw new Error("No chain run to end.");
    run.end_time = Date.now();
    run.outputs = _coerceToDict(outputs, "output");
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    if (kwargs?.inputs !== void 0)
      run.inputs = _coerceToDict(kwargs.inputs, "input");
    await this.onChainEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleChainError(error, runId, _parentRunId, _tags, kwargs) {
    const run = this.getRunById(runId);
    if (!run)
      throw new Error("No chain run to end.");
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    if (kwargs?.inputs !== void 0)
      run.inputs = _coerceToDict(kwargs.inputs, "input");
    await this.onChainError?.(run);
    await this._endTrace(run);
    return run;
  }
  /**
  * Create and add a run to the run map for tool start events.
  * This must sometimes be done synchronously to avoid race conditions
  * when callbacks are backgrounded, so we expose it as a separate method here.
  */
  _createRunForToolStart(tool, input, runId, parentRunId, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: name ?? tool.id[tool.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: tool,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: { input },
      execution_order,
      child_execution_order: execution_order,
      run_type: "tool",
      child_runs: [],
      extra: metadata ? { metadata } : {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleToolStart(tool, input, runId, parentRunId, tags, metadata, name) {
    const run = this.getRunById(runId) ?? this._createRunForToolStart(tool, input, runId, parentRunId, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onToolStart?.(run);
    return run;
  }
  async handleToolEnd(output, runId) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "tool")
      throw new Error("No tool run to end");
    run.end_time = Date.now();
    run.outputs = { output };
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onToolEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleToolError(error, runId) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "tool")
      throw new Error("No tool run to end");
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onToolError?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleAgentAction(action, runId) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "chain")
      return;
    const agentRun = run;
    agentRun.actions = agentRun.actions || [];
    agentRun.actions.push(action);
    agentRun.events.push({
      name: "agent_action",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: { action }
    });
    await this.onAgentAction?.(run);
  }
  async handleAgentEnd(action, runId) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "chain")
      return;
    run.events.push({
      name: "agent_end",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: { action }
    });
    await this.onAgentEnd?.(run);
  }
  /**
  * Create and add a run to the run map for retriever start events.
  * This must sometimes be done synchronously to avoid race conditions
  * when callbacks are backgrounded, so we expose it as a separate method here.
  */
  _createRunForRetrieverStart(retriever, query, runId, parentRunId, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: name ?? retriever.id[retriever.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: retriever,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: { query },
      execution_order,
      child_execution_order: execution_order,
      run_type: "retriever",
      child_runs: [],
      extra: metadata ? { metadata } : {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleRetrieverStart(retriever, query, runId, parentRunId, tags, metadata, name) {
    const run = this.getRunById(runId) ?? this._createRunForRetrieverStart(retriever, query, runId, parentRunId, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onRetrieverStart?.(run);
    return run;
  }
  async handleRetrieverEnd(documents, runId) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "retriever")
      throw new Error("No retriever run to end");
    run.end_time = Date.now();
    run.outputs = { documents };
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onRetrieverEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleRetrieverError(error, runId) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "retriever")
      throw new Error("No retriever run to end");
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onRetrieverError?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleText(text, runId) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "chain")
      return;
    run.events.push({
      name: "text",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: { text }
    });
    await this.onText?.(run);
  }
  async handleLLMNewToken(token, idx, runId, _parentRunId, _tags, fields) {
    const run = this.getRunById(runId);
    if (!run || run?.run_type !== "llm")
      throw new Error(`Invalid "runId" provided to "handleLLMNewToken" callback.`);
    run.events.push({
      name: "new_token",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      kwargs: {
        token,
        idx,
        chunk: fields?.chunk
      }
    });
    await this.onLLMNewToken?.(run, token, { chunk: fields?.chunk });
    return run;
  }
};

// ../../node_modules/@langchain/core/dist/tracers/console.js
var styles = {
  bold: {
    open: "\x1B[1m",
    close: "\x1B[22m"
  },
  color: {
    grey: {
      open: "\x1B[90m",
      close: "\x1B[39m"
    },
    green: {
      open: "\x1B[32m",
      close: "\x1B[39m"
    },
    cyan: {
      open: "\x1B[36m",
      close: "\x1B[39m"
    },
    red: {
      open: "\x1B[31m",
      close: "\x1B[39m"
    },
    blue: {
      open: "\x1B[34m",
      close: "\x1B[39m"
    }
  }
};
function wrap(style, text) {
  return `${style.open}${text}${style.close}`;
}
function tryJsonStringify(obj, fallback) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return fallback;
  }
}
function formatKVMapItem(value) {
  if (typeof value === "string")
    return value.trim();
  if (value === null || value === void 0)
    return value;
  return tryJsonStringify(value, value.toString());
}
function elapsed(run) {
  if (!run.end_time)
    return "";
  const elapsed2 = run.end_time - run.start_time;
  if (elapsed2 < 1e3)
    return `${elapsed2}ms`;
  return `${(elapsed2 / 1e3).toFixed(2)}s`;
}
var { color } = styles;
var ConsoleCallbackHandler = class extends BaseTracer {
  name = "console_callback_handler";
  /**
  * Method used to persist the run. In this case, it simply returns a
  * resolved promise as there's no persistence logic.
  * @param _run The run to persist.
  * @returns A resolved promise.
  */
  persistRun(_run) {
    return Promise.resolve();
  }
  /**
  * Method used to get all the parent runs of a given run.
  * @param run The run whose parents are to be retrieved.
  * @returns An array of parent runs.
  */
  getParents(run) {
    const parents = [];
    let currentRun = run;
    while (currentRun.parent_run_id) {
      const parent = this.runMap.get(currentRun.parent_run_id);
      if (parent) {
        parents.push(parent);
        currentRun = parent;
      } else
        break;
    }
    return parents;
  }
  /**
  * Method used to get a string representation of the run's lineage, which
  * is used in logging.
  * @param run The run whose lineage is to be retrieved.
  * @returns A string representation of the run's lineage.
  */
  getBreadcrumbs(run) {
    const string2 = [...this.getParents(run).reverse(), run].map((parent, i, arr2) => {
      const name = `${parent.execution_order}:${parent.run_type}:${parent.name}`;
      return i === arr2.length - 1 ? wrap(styles.bold, name) : name;
    }).join(" > ");
    return wrap(color.grey, string2);
  }
  /**
  * Method used to log the start of a chain run.
  * @param run The chain run that has started.
  * @returns void
  */
  onChainStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.green, "[chain/start]")} [${crumbs}] Entering Chain run with input: ${tryJsonStringify(run.inputs, "[inputs]")}`);
  }
  /**
  * Method used to log the end of a chain run.
  * @param run The chain run that has ended.
  * @returns void
  */
  onChainEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[chain/end]")} [${crumbs}] [${elapsed(run)}] Exiting Chain run with output: ${tryJsonStringify(run.outputs, "[outputs]")}`);
  }
  /**
  * Method used to log any errors of a chain run.
  * @param run The chain run that has errored.
  * @returns void
  */
  onChainError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[chain/error]")} [${crumbs}] [${elapsed(run)}] Chain run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
  * Method used to log the start of an LLM run.
  * @param run The LLM run that has started.
  * @returns void
  */
  onLLMStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    const inputs = "prompts" in run.inputs ? { prompts: run.inputs.prompts.map((p) => p.trim()) } : run.inputs;
    console.log(`${wrap(color.green, "[llm/start]")} [${crumbs}] Entering LLM run with input: ${tryJsonStringify(inputs, "[inputs]")}`);
  }
  /**
  * Method used to log the end of an LLM run.
  * @param run The LLM run that has ended.
  * @returns void
  */
  onLLMEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[llm/end]")} [${crumbs}] [${elapsed(run)}] Exiting LLM run with output: ${tryJsonStringify(run.outputs, "[response]")}`);
  }
  /**
  * Method used to log any errors of an LLM run.
  * @param run The LLM run that has errored.
  * @returns void
  */
  onLLMError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[llm/error]")} [${crumbs}] [${elapsed(run)}] LLM run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
  * Method used to log the start of a tool run.
  * @param run The tool run that has started.
  * @returns void
  */
  onToolStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.green, "[tool/start]")} [${crumbs}] Entering Tool run with input: "${formatKVMapItem(run.inputs.input)}"`);
  }
  /**
  * Method used to log the end of a tool run.
  * @param run The tool run that has ended.
  * @returns void
  */
  onToolEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[tool/end]")} [${crumbs}] [${elapsed(run)}] Exiting Tool run with output: "${formatKVMapItem(run.outputs?.output)}"`);
  }
  /**
  * Method used to log any errors of a tool run.
  * @param run The tool run that has errored.
  * @returns void
  */
  onToolError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[tool/error]")} [${crumbs}] [${elapsed(run)}] Tool run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
  * Method used to log the start of a retriever run.
  * @param run The retriever run that has started.
  * @returns void
  */
  onRetrieverStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.green, "[retriever/start]")} [${crumbs}] Entering Retriever run with input: ${tryJsonStringify(run.inputs, "[inputs]")}`);
  }
  /**
  * Method used to log the end of a retriever run.
  * @param run The retriever run that has ended.
  * @returns void
  */
  onRetrieverEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.cyan, "[retriever/end]")} [${crumbs}] [${elapsed(run)}] Exiting Retriever run with output: ${tryJsonStringify(run.outputs, "[outputs]")}`);
  }
  /**
  * Method used to log any errors of a retriever run.
  * @param run The retriever run that has errored.
  * @returns void
  */
  onRetrieverError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.red, "[retriever/error]")} [${crumbs}] [${elapsed(run)}] Retriever run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
  * Method used to log the action selected by the agent.
  * @param run The run in which the agent action occurred.
  * @returns void
  */
  onAgentAction(run) {
    const agentRun = run;
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap(color.blue, "[agent/action]")} [${crumbs}] Agent selected action: ${tryJsonStringify(agentRun.actions[agentRun.actions.length - 1], "[action]")}`);
  }
};

// ../../node_modules/@langchain/core/dist/singletons/tracer.js
var client;
var getDefaultLangChainClientSingleton = () => {
  if (client === void 0)
    client = new Client(getEnvironmentVariable("LANGCHAIN_CALLBACKS_BACKGROUND") === "false" ? { blockOnRootRunFinalization: true } : {});
  return client;
};

// ../../node_modules/langsmith/dist/singletons/traceable.js
var MockAsyncLocalStorage = class {
  getStore() {
    return void 0;
  }
  run(_, callback) {
    return callback();
  }
};
var TRACING_ALS_KEY2 = Symbol.for("ls:tracing_async_local_storage");
var mockAsyncLocalStorage = new MockAsyncLocalStorage();
var AsyncLocalStorageProvider = class {
  getInstance() {
    return globalThis[TRACING_ALS_KEY2] ?? mockAsyncLocalStorage;
  }
  initializeGlobalInstance(instance) {
    if (globalThis[TRACING_ALS_KEY2] === void 0) {
      globalThis[TRACING_ALS_KEY2] = instance;
    }
  }
};
var AsyncLocalStorageProviderSingleton = new AsyncLocalStorageProvider();
function getCurrentRunTree(permitAbsentRunTree = false) {
  const runTree = AsyncLocalStorageProviderSingleton.getInstance().getStore();
  if (!permitAbsentRunTree && runTree === void 0) {
    throw new Error("Could not get the current run tree.\n\nPlease make sure you are calling this method within a traceable function and that tracing is enabled.");
  }
  return runTree;
}
var ROOT = Symbol.for("langsmith:traceable:root");
function isTraceableFunction(x) {
  return typeof x === "function" && "langsmith:traceable" in x;
}

// ../../node_modules/@langchain/core/dist/tracers/tracer_langchain.js
var OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS = /* @__PURE__ */ new Set(["ls_agent_type"]);
function _getUsageMetadataFromGenerations(generations) {
  let output = void 0;
  for (const generationBatch of generations)
    for (const generation of generationBatch)
      if (AIMessage.isInstance(generation.message) && generation.message.usage_metadata !== void 0)
        output = mergeUsageMetadata(output, generation.message.usage_metadata);
  return output;
}
var LangChainTracer = class LangChainTracer2 extends BaseTracer {
  name = "langchain_tracer";
  projectName;
  exampleId;
  client;
  replicas;
  usesRunTreeMap = true;
  tracingMetadata;
  tracingTags = [];
  constructor(fields = {}) {
    super(fields);
    this.fields = fields;
    const { exampleId, projectName, client: client2, replicas, metadata, tags } = fields;
    this.projectName = projectName ?? getDefaultProjectName();
    this.replicas = replicas;
    this.exampleId = exampleId;
    this.client = client2 ?? getDefaultLangChainClientSingleton();
    this.tracingMetadata = metadata ? { ...metadata } : void 0;
    this.tracingTags = tags ?? [];
    const traceableTree = LangChainTracer2.getTraceableRunTree();
    if (traceableTree)
      this.updateFromRunTree(traceableTree);
  }
  async persistRun(_run) {
  }
  async onRunCreate(run) {
    _patchMissingTracingDefaults(this, run);
    if (!run.extra?.lc_defers_inputs)
      await this.getRunTreeWithTracingConfig(run.id)?.postRun();
  }
  async onRunUpdate(run) {
    _patchMissingTracingDefaults(this, run);
    const runTree = this.getRunTreeWithTracingConfig(run.id);
    if (run.extra?.lc_defers_inputs)
      await runTree?.postRun();
    else
      await runTree?.patchRun();
  }
  onLLMEnd(run) {
    const outputs = run.outputs;
    if (outputs?.generations) {
      const usageMetadata = _getUsageMetadataFromGenerations(outputs.generations);
      if (usageMetadata !== void 0) {
        run.extra = run.extra ?? {};
        const metadata = run.extra.metadata ?? {};
        metadata.usage_metadata = usageMetadata;
        run.extra.metadata = metadata;
      }
    }
  }
  copyWithTracingConfig({ metadata, tags }) {
    let mergedMetadata;
    if (metadata === void 0)
      mergedMetadata = this.tracingMetadata ? { ...this.tracingMetadata } : void 0;
    else if (this.tracingMetadata === void 0)
      mergedMetadata = { ...metadata };
    else {
      mergedMetadata = { ...this.tracingMetadata };
      for (const [key, value] of Object.entries(metadata))
        if (!Object.prototype.hasOwnProperty.call(mergedMetadata, key) || OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS.has(key))
          mergedMetadata[key] = value;
    }
    const mergedTags = tags ? Array.from(/* @__PURE__ */ new Set([...this.tracingTags, ...tags])) : [...this.tracingTags];
    const copied = new LangChainTracer2({
      ...this.fields,
      metadata: mergedMetadata,
      tags: mergedTags
    });
    copied.runMap = this.runMap;
    copied.runTreeMap = this.runTreeMap;
    return copied;
  }
  getRun(id) {
    return this.runTreeMap.get(id);
  }
  updateFromRunTree(runTree) {
    this.runTreeMap.set(runTree.id, runTree);
    let rootRun = runTree;
    const visited = /* @__PURE__ */ new Set();
    while (rootRun.parent_run) {
      if (visited.has(rootRun.id))
        break;
      visited.add(rootRun.id);
      if (!rootRun.parent_run)
        break;
      rootRun = rootRun.parent_run;
    }
    visited.clear();
    const queue2 = [rootRun];
    while (queue2.length > 0) {
      const current = queue2.shift();
      if (!current || visited.has(current.id))
        continue;
      visited.add(current.id);
      this.runTreeMap.set(current.id, current);
      if (current.child_runs)
        queue2.push(...current.child_runs);
    }
    this.client = runTree.client ?? this.client;
    this.replicas = runTree.replicas ?? this.replicas;
    this.projectName = runTree.project_name ?? this.projectName;
    this.exampleId = runTree.reference_example_id ?? this.exampleId;
    this.fields = {
      ...this.fields,
      client: this.client,
      replicas: this.replicas,
      projectName: this.projectName,
      exampleId: this.exampleId
    };
  }
  getRunTreeWithTracingConfig(id) {
    const runTree = this.runTreeMap.get(id);
    if (!runTree)
      return void 0;
    return new RunTree({
      ...runTree,
      client: this.client,
      project_name: this.projectName,
      replicas: this.replicas,
      reference_example_id: this.exampleId,
      tracingEnabled: true
    });
  }
  static getTraceableRunTree() {
    try {
      return getCurrentRunTree(true);
    } catch {
      return;
    }
  }
  static [Symbol.hasInstance](instance) {
    if (typeof instance !== "object" || instance === null)
      return false;
    const candidate = instance;
    return "name" in candidate && candidate.name === "langchain_tracer" && "copyWithTracingConfig" in candidate && typeof candidate.copyWithTracingConfig === "function" && "getRunTreeWithTracingConfig" in candidate && typeof candidate.getRunTreeWithTracingConfig === "function";
  }
};
function _patchMissingTracingDefaults(tracer, run) {
  if (tracer.tracingMetadata) {
    run.extra ??= {};
    const metadata = run.extra.metadata ?? {};
    let didPatchMetadata = false;
    for (const [key, value] of Object.entries(tracer.tracingMetadata))
      if (!Object.prototype.hasOwnProperty.call(metadata, key) || OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS.has(key)) {
        if (metadata[key] !== value) {
          metadata[key] = value;
          didPatchMetadata = true;
        }
      }
    if (didPatchMetadata)
      run.extra.metadata = metadata;
  }
  if (tracer.tracingTags.length > 0)
    run.tags = Array.from(/* @__PURE__ */ new Set([...run.tags ?? [], ...tracer.tracingTags]));
}

// ../../node_modules/@langchain/core/dist/singletons/callbacks.js
var import_p_queue3 = __toESM(require_dist(), 1);
var queue;
function createQueue() {
  return new ("default" in import_p_queue3.default ? import_p_queue3.default.default : import_p_queue3.default)({
    autoStart: true,
    concurrency: 1
  });
}
function getQueue() {
  if (typeof queue === "undefined")
    queue = createQueue();
  return queue;
}
async function consumeCallback(promiseFn, wait) {
  if (wait === true) {
    const asyncLocalStorageInstance = getGlobalAsyncLocalStorageInstance();
    if (asyncLocalStorageInstance !== void 0)
      await asyncLocalStorageInstance.run(void 0, async () => promiseFn());
    else
      await promiseFn();
  } else {
    queue = getQueue();
    queue.add(async () => {
      const asyncLocalStorageInstance = getGlobalAsyncLocalStorageInstance();
      if (asyncLocalStorageInstance !== void 0)
        await asyncLocalStorageInstance.run(void 0, async () => promiseFn());
      else
        await promiseFn();
    });
  }
}

// ../../node_modules/@langchain/core/dist/utils/callbacks.js
var isTracingEnabled2 = (tracingEnabled) => {
  if (tracingEnabled !== void 0)
    return tracingEnabled;
  return !![
    "LANGSMITH_TRACING_V2",
    "LANGCHAIN_TRACING_V2",
    "LANGSMITH_TRACING",
    "LANGCHAIN_TRACING"
  ].find((envVar) => getEnvironmentVariable(envVar) === "true");
};

// ../../node_modules/@langchain/core/dist/singletons/async_local_storage/context.js
function getContextVariable(name) {
  const asyncLocalStorageInstance = getGlobalAsyncLocalStorageInstance();
  if (asyncLocalStorageInstance === void 0)
    return;
  return asyncLocalStorageInstance.getStore()?.[_CONTEXT_VARIABLES_KEY]?.[name];
}
var LC_CONFIGURE_HOOKS_KEY = Symbol("lc:configure_hooks");
var _getConfigureHooks = () => getContextVariable(LC_CONFIGURE_HOOKS_KEY) || [];

// ../../node_modules/@langchain/core/dist/callbacks/manager.js
var BaseCallbackManager = class {
  setHandler(handler) {
    return this.setHandlers([handler]);
  }
};
var BaseRunManager = class {
  constructor(runId, handlers, inheritableHandlers, tags, inheritableTags, metadata, inheritableMetadata, _parentRunId) {
    this.runId = runId;
    this.handlers = handlers;
    this.inheritableHandlers = inheritableHandlers;
    this.tags = tags;
    this.inheritableTags = inheritableTags;
    this.metadata = metadata;
    this.inheritableMetadata = inheritableMetadata;
    this._parentRunId = _parentRunId;
  }
  get parentRunId() {
    return this._parentRunId;
  }
  async handleText(text) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      try {
        await handler.handleText?.(text, this.runId, this._parentRunId, this.tags);
      } catch (err) {
        (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleText: ${err}`);
        if (handler.raiseError)
          throw err;
      }
    }, handler.awaitHandlers)));
  }
  async handleCustomEvent(eventName, data, _runId, _tags, _metadata) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      try {
        await handler.handleCustomEvent?.(eventName, data, this.runId, this.tags, this.metadata);
      } catch (err) {
        (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleCustomEvent: ${err}`);
        if (handler.raiseError)
          throw err;
      }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForRetrieverRun = class extends BaseRunManager {
  getChild(tag) {
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag)
      manager.addTags([tag], false);
    return manager;
  }
  async handleRetrieverEnd(documents) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreRetriever)
        try {
          await handler.handleRetrieverEnd?.(documents, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleRetriever`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
  async handleRetrieverError(err) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreRetriever)
        try {
          await handler.handleRetrieverError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (error) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleRetrieverError: ${error}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForLLMRun = class extends BaseRunManager {
  async handleLLMNewToken(token, idx, _runId, _parentRunId, _tags, fields) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreLLM)
        try {
          await handler.handleLLMNewToken?.(token, idx ?? {
            prompt: 0,
            completion: 0
          }, this.runId, this._parentRunId, this.tags, fields);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleLLMNewToken: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
  async handleChatModelStreamEvent(event) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreLLM)
        try {
          await handler.handleChatModelStreamEvent?.(event, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleChatModelStreamEvent: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
  async handleLLMError(err, _runId, _parentRunId, _tags, extraParams) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreLLM)
        try {
          await handler.handleLLMError?.(err, this.runId, this._parentRunId, this.tags, extraParams);
        } catch (err2) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleLLMError: ${err2}`);
          if (handler.raiseError)
            throw err2;
        }
    }, handler.awaitHandlers)));
  }
  async handleLLMEnd(output, _runId, _parentRunId, _tags, extraParams) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreLLM)
        try {
          await handler.handleLLMEnd?.(output, this.runId, this._parentRunId, this.tags, extraParams);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleLLMEnd: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForChainRun = class extends BaseRunManager {
  getChild(tag) {
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag)
      manager.addTags([tag], false);
    return manager;
  }
  async handleChainError(err, _runId, _parentRunId, _tags, kwargs) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreChain)
        try {
          await handler.handleChainError?.(err, this.runId, this._parentRunId, this.tags, kwargs);
        } catch (err2) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleChainError: ${err2}`);
          if (handler.raiseError)
            throw err2;
        }
    }, handler.awaitHandlers)));
  }
  async handleChainEnd(output, _runId, _parentRunId, _tags, kwargs) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreChain)
        try {
          await handler.handleChainEnd?.(output, this.runId, this._parentRunId, this.tags, kwargs);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleChainEnd: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
  async handleAgentAction(action) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent)
        try {
          await handler.handleAgentAction?.(action, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleAgentAction: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
  async handleAgentEnd(action) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent)
        try {
          await handler.handleAgentEnd?.(action, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleAgentEnd: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
};
var CallbackManagerForToolRun = class extends BaseRunManager {
  getChild(tag) {
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag)
      manager.addTags([tag], false);
    return manager;
  }
  async handleToolError(err) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent)
        try {
          await handler.handleToolError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (err2) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleToolError: ${err2}`);
          if (handler.raiseError)
            throw err2;
        }
    }, handler.awaitHandlers)));
  }
  async handleToolEvent(chunk) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent)
        try {
          await handler.handleToolEvent?.(chunk, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
  async handleToolEnd(output) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreAgent)
        try {
          await handler.handleToolEnd?.(output, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleToolEnd: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
};
var CallbackManager = class CallbackManager2 extends BaseCallbackManager {
  handlers = [];
  inheritableHandlers = [];
  tags = [];
  inheritableTags = [];
  metadata = {};
  inheritableMetadata = {};
  name = "callback_manager";
  _parentRunId;
  constructor(parentRunId, options) {
    super();
    this.handlers = options?.handlers ?? this.handlers;
    this.inheritableHandlers = options?.inheritableHandlers ?? this.inheritableHandlers;
    this.tags = options?.tags ?? this.tags;
    this.inheritableTags = options?.inheritableTags ?? this.inheritableTags;
    this.metadata = options?.metadata ?? this.metadata;
    this.inheritableMetadata = options?.inheritableMetadata ?? this.inheritableMetadata;
    this._parentRunId = parentRunId;
  }
  /**
  * Gets the parent run ID, if any.
  *
  * @returns The parent run ID.
  */
  getParentRunId() {
    return this._parentRunId;
  }
  async handleLLMStart(llm, prompts, runId = void 0, _parentRunId = void 0, extraParams = void 0, _tags = void 0, _metadata = void 0, runName = void 0) {
    return Promise.all(prompts.map(async (prompt, idx) => {
      const runId_ = idx === 0 && runId ? runId : v72();
      await Promise.all(this.handlers.map((handler) => {
        if (handler.ignoreLLM)
          return;
        if (isBaseTracer(handler))
          handler._createRunForLLMStart(llm, [prompt], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
        return consumeCallback(async () => {
          try {
            await handler.handleLLMStart?.(llm, [prompt], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
          } catch (err) {
            (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleLLMStart: ${err}`);
            if (handler.raiseError)
              throw err;
          }
        }, handler.awaitHandlers);
      }));
      return new CallbackManagerForLLMRun(runId_, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
    }));
  }
  async handleChatModelStart(llm, messages, runId = void 0, _parentRunId = void 0, extraParams = void 0, _tags = void 0, _metadata = void 0, runName = void 0) {
    return Promise.all(messages.map(async (messageGroup, idx) => {
      const runId_ = idx === 0 && runId ? runId : v72();
      await Promise.all(this.handlers.map((handler) => {
        if (handler.ignoreLLM)
          return;
        if (isBaseTracer(handler))
          handler._createRunForChatModelStart(llm, [messageGroup], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
        return consumeCallback(async () => {
          try {
            if (handler.handleChatModelStart)
              await handler.handleChatModelStart?.(llm, [messageGroup], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
            else if (handler.handleLLMStart) {
              const messageString = getBufferString(messageGroup);
              await handler.handleLLMStart?.(llm, [messageString], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
            }
          } catch (err) {
            (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleLLMStart: ${err}`);
            if (handler.raiseError)
              throw err;
          }
        }, handler.awaitHandlers);
      }));
      return new CallbackManagerForLLMRun(runId_, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
    }));
  }
  async handleChainStart(chain, inputs, runId = v72(), runType = void 0, _tags = void 0, _metadata = void 0, runName = void 0, _parentRunId = void 0, extra = void 0) {
    await Promise.all(this.handlers.map((handler) => {
      if (handler.ignoreChain)
        return;
      if (isBaseTracer(handler))
        handler._createRunForChainStart(chain, inputs, runId, this._parentRunId, this.tags, this.metadata, runType, runName, extra);
      return consumeCallback(async () => {
        try {
          await handler.handleChainStart?.(chain, inputs, runId, this._parentRunId, this.tags, this.metadata, runType, runName, extra);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleChainStart: ${err}`);
          if (handler.raiseError)
            throw err;
        }
      }, handler.awaitHandlers);
    }));
    return new CallbackManagerForChainRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleToolStart(tool, input, runId = v72(), _parentRunId = void 0, _tags = void 0, _metadata = void 0, runName = void 0, toolCallId = void 0) {
    await Promise.all(this.handlers.map((handler) => {
      if (handler.ignoreAgent)
        return;
      if (isBaseTracer(handler))
        handler._createRunForToolStart(tool, input, runId, this._parentRunId, this.tags, this.metadata, runName);
      return consumeCallback(async () => {
        try {
          await handler.handleToolStart?.(tool, input, runId, this._parentRunId, this.tags, this.metadata, runName, toolCallId);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleToolStart: ${err}`);
          if (handler.raiseError)
            throw err;
        }
      }, handler.awaitHandlers);
    }));
    return new CallbackManagerForToolRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleRetrieverStart(retriever, query, runId = v72(), _parentRunId = void 0, _tags = void 0, _metadata = void 0, runName = void 0) {
    await Promise.all(this.handlers.map((handler) => {
      if (handler.ignoreRetriever)
        return;
      if (isBaseTracer(handler))
        handler._createRunForRetrieverStart(retriever, query, runId, this._parentRunId, this.tags, this.metadata, runName);
      return consumeCallback(async () => {
        try {
          await handler.handleRetrieverStart?.(retriever, query, runId, this._parentRunId, this.tags, this.metadata, runName);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleRetrieverStart: ${err}`);
          if (handler.raiseError)
            throw err;
        }
      }, handler.awaitHandlers);
    }));
    return new CallbackManagerForRetrieverRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleCustomEvent(eventName, data, runId, _tags, _metadata) {
    await Promise.all(this.handlers.map((handler) => consumeCallback(async () => {
      if (!handler.ignoreCustomEvent)
        try {
          await handler.handleCustomEvent?.(eventName, data, runId, this.tags, this.metadata);
        } catch (err) {
          (handler.raiseError ? console.error : console.warn)(`Error in handler ${handler.constructor.name}, handleCustomEvent: ${err}`);
          if (handler.raiseError)
            throw err;
        }
    }, handler.awaitHandlers)));
  }
  addHandler(handler, inherit = true) {
    this.handlers.push(handler);
    if (inherit)
      this.inheritableHandlers.push(handler);
  }
  removeHandler(handler) {
    this.handlers = this.handlers.filter((_handler) => _handler !== handler);
    this.inheritableHandlers = this.inheritableHandlers.filter((_handler) => _handler !== handler);
  }
  setHandlers(handlers, inherit = true) {
    this.handlers = [];
    this.inheritableHandlers = [];
    for (const handler of handlers)
      this.addHandler(handler, inherit);
  }
  addTags(tags, inherit = true) {
    this.removeTags(tags);
    this.tags.push(...tags);
    if (inherit)
      this.inheritableTags.push(...tags);
  }
  removeTags(tags) {
    this.tags = this.tags.filter((tag) => !tags.includes(tag));
    this.inheritableTags = this.inheritableTags.filter((tag) => !tags.includes(tag));
  }
  addMetadata(metadata, inherit = true) {
    this.metadata = {
      ...this.metadata,
      ...metadata
    };
    if (inherit)
      this.inheritableMetadata = {
        ...this.inheritableMetadata,
        ...metadata
      };
  }
  removeMetadata(metadata) {
    for (const key of Object.keys(metadata)) {
      delete this.metadata[key];
      delete this.inheritableMetadata[key];
    }
  }
  copy(additionalHandlers = [], inherit = true) {
    const manager = new CallbackManager2(this._parentRunId);
    for (const handler of this.handlers) {
      const inheritable = this.inheritableHandlers.includes(handler);
      manager.addHandler(handler, inheritable);
    }
    for (const tag of this.tags) {
      const inheritable = this.inheritableTags.includes(tag);
      manager.addTags([tag], inheritable);
    }
    for (const key of Object.keys(this.metadata)) {
      const inheritable = Object.keys(this.inheritableMetadata).includes(key);
      manager.addMetadata({ [key]: this.metadata[key] }, inheritable);
    }
    for (const handler of additionalHandlers) {
      if (manager.handlers.filter((h) => h.name === "console_callback_handler").some((h) => h.name === handler.name))
        continue;
      manager.addHandler(handler, inherit);
    }
    return manager;
  }
  static fromHandlers(handlers) {
    class Handler extends BaseCallbackHandler {
      name = v72();
      constructor() {
        super();
        Object.assign(this, handlers);
      }
    }
    const manager = new this();
    manager.addHandler(new Handler());
    return manager;
  }
  static configure(inheritableHandlers, localHandlers, inheritableTags, localTags, inheritableMetadata, localMetadata, options) {
    return this._configureSync(inheritableHandlers, localHandlers, inheritableTags, localTags, inheritableMetadata, localMetadata, options);
  }
  static _configureSync(inheritableHandlers, localHandlers, inheritableTags, localTags, inheritableMetadata, localMetadata, options) {
    let callbackManager;
    if (inheritableHandlers || localHandlers) {
      if (Array.isArray(inheritableHandlers) || !inheritableHandlers) {
        callbackManager = new CallbackManager2();
        callbackManager.setHandlers(inheritableHandlers?.map(ensureHandler) ?? [], true);
      } else
        callbackManager = inheritableHandlers;
      callbackManager = callbackManager.copy(Array.isArray(localHandlers) ? localHandlers.map(ensureHandler) : localHandlers?.handlers, false);
    }
    const verboseEnabled = getEnvironmentVariable("LANGCHAIN_VERBOSE") === "true" || options?.verbose;
    const traceableRunTree = LangChainTracer.getTraceableRunTree();
    const tracingV2Enabled = traceableRunTree?.tracingEnabled ?? isTracingEnabled2();
    if (traceableRunTree?.tracingEnabled === false && callbackManager) {
      const inheritedTracers = callbackManager.handlers.filter((handler) => handler.name === "langchain_tracer");
      for (const tracer of inheritedTracers)
        callbackManager.removeHandler(tracer);
    }
    const tracingEnabled = tracingV2Enabled || (getEnvironmentVariable("LANGCHAIN_TRACING") ?? false);
    if (verboseEnabled || tracingEnabled) {
      if (!callbackManager)
        callbackManager = new CallbackManager2();
      if (verboseEnabled && !callbackManager.handlers.some((handler) => handler.name === ConsoleCallbackHandler.prototype.name)) {
        const consoleHandler = new ConsoleCallbackHandler();
        callbackManager.addHandler(consoleHandler, true);
      }
      if (tracingEnabled && !callbackManager.handlers.some((handler) => handler.name === "langchain_tracer")) {
        if (tracingV2Enabled) {
          const tracerV2 = new LangChainTracer();
          callbackManager.addHandler(tracerV2, true);
        }
      }
      if (tracingV2Enabled) {
        if (traceableRunTree && callbackManager._parentRunId === void 0) {
          callbackManager._parentRunId = traceableRunTree.id;
          callbackManager.handlers.find((handler) => handler.name === "langchain_tracer")?.updateFromRunTree(traceableRunTree);
        }
      }
    }
    for (const { contextVar, inheritable = true, handlerClass, envVar } of _getConfigureHooks()) {
      const createIfNotInContext = envVar && getEnvironmentVariable(envVar) === "true" && handlerClass;
      let handler;
      const contextVarValue = contextVar !== void 0 ? getContextVariable(contextVar) : void 0;
      if (contextVarValue && isBaseCallbackHandler(contextVarValue))
        handler = contextVarValue;
      else if (createIfNotInContext)
        handler = new handlerClass({});
      if (handler !== void 0) {
        if (!callbackManager)
          callbackManager = new CallbackManager2();
        if (!callbackManager.handlers.some((h) => h.name === handler.name))
          callbackManager.addHandler(handler, inheritable);
      }
    }
    if (inheritableTags || localTags) {
      if (callbackManager) {
        callbackManager.addTags(inheritableTags ?? []);
        callbackManager.addTags(localTags ?? [], false);
      }
    }
    if (inheritableMetadata || localMetadata) {
      if (callbackManager) {
        callbackManager.addMetadata(inheritableMetadata ?? {});
        callbackManager.addMetadata(localMetadata ?? {}, false);
      }
    }
    const tracerInheritableMetadata = options?.tracerInheritableMetadata;
    const tracerInheritableTags = options?.tracerInheritableTags;
    if (callbackManager && (tracerInheritableMetadata || tracerInheritableTags)) {
      callbackManager.handlers = callbackManager.handlers.map((handler) => handler instanceof LangChainTracer ? handler.copyWithTracingConfig({
        metadata: tracerInheritableMetadata,
        tags: tracerInheritableTags
      }) : handler);
      callbackManager.inheritableHandlers = callbackManager.inheritableHandlers.map((handler) => handler instanceof LangChainTracer ? handler.copyWithTracingConfig({
        metadata: tracerInheritableMetadata,
        tags: tracerInheritableTags
      }) : handler);
    }
    return callbackManager;
  }
};
function ensureHandler(handler) {
  if ("name" in handler)
    return handler;
  return BaseCallbackHandler.fromMethods(handler);
}

// ../../node_modules/@langchain/core/dist/singletons/async_local_storage/index.js
var MockAsyncLocalStorage2 = class {
  getStore() {
  }
  run(_store, callback) {
    return callback();
  }
  enterWith(_store) {
  }
};
var mockAsyncLocalStorage2 = new MockAsyncLocalStorage2();
var LC_CHILD_KEY = Symbol.for("lc:child_config");
var AsyncLocalStorageProvider2 = class {
  getInstance() {
    return getGlobalAsyncLocalStorageInstance() ?? mockAsyncLocalStorage2;
  }
  getRunnableConfig() {
    return this.getInstance().getStore()?.extra?.[LC_CHILD_KEY];
  }
  runWithConfig(config2, callback, avoidCreatingRootRunTree) {
    const callbackManager = CallbackManager._configureSync(config2?.callbacks, void 0, config2?.tags, void 0, config2?.metadata);
    const storage = this.getInstance();
    const previousValue = storage.getStore();
    const parentRunId = callbackManager?.getParentRunId();
    const langChainTracer = callbackManager?.handlers?.find((handler) => handler?.name === "langchain_tracer");
    let runTree;
    if (langChainTracer && parentRunId)
      runTree = langChainTracer.getRunTreeWithTracingConfig(parentRunId);
    else if (!avoidCreatingRootRunTree)
      runTree = new RunTree({
        name: "<runnable_lambda>",
        tracingEnabled: false
      });
    if (runTree)
      runTree.extra = {
        ...runTree.extra,
        [LC_CHILD_KEY]: config2
      };
    if (previousValue !== void 0 && previousValue[_CONTEXT_VARIABLES_KEY] !== void 0) {
      if (runTree === void 0)
        runTree = {};
      runTree[_CONTEXT_VARIABLES_KEY] = previousValue[_CONTEXT_VARIABLES_KEY];
    }
    return storage.run(runTree, callback);
  }
  initializeGlobalInstance(instance) {
    if (getGlobalAsyncLocalStorageInstance() === void 0)
      setGlobalAsyncLocalStorageInstance(instance);
  }
};
var AsyncLocalStorageProviderSingleton2 = new AsyncLocalStorageProvider2();

// ../../node_modules/@langchain/core/dist/runnables/config.js
var CONFIGURABLE_TO_TRACING_METADATA_EXCLUDED_KEYS = /* @__PURE__ */ new Set(["api_key"]);
var PRIMITIVES = /* @__PURE__ */ new Set([
  "string",
  "number",
  "boolean"
]);
function _getTracingInheritableMetadataFromConfig(config2) {
  const configurable = config2.configurable ?? {};
  const metadata = config2.metadata ?? {};
  const langSmithMetadata = {};
  for (const [key, value] of Object.entries(configurable))
    if (!key.startsWith("__") && !Object.prototype.hasOwnProperty.call(metadata, key) && !CONFIGURABLE_TO_TRACING_METADATA_EXCLUDED_KEYS.has(key) && PRIMITIVES.has(typeof value))
      langSmithMetadata[key] = value;
  return Object.keys(langSmithMetadata).length > 0 ? langSmithMetadata : void 0;
}
async function getCallbackManagerForConfig(config2) {
  return CallbackManager._configureSync(config2?.callbacks, void 0, config2?.tags, void 0, config2?.metadata, void 0, { tracerInheritableMetadata: config2 ? _getTracingInheritableMetadataFromConfig(config2) : void 0 });
}
function mergeConfigs(...configs) {
  const copy = {};
  for (const options of configs.filter((c) => !!c))
    for (const key of Object.keys(options))
      if (key === "metadata")
        copy[key] = {
          ...copy[key],
          ...options[key]
        };
      else if (key === "tags") {
        const baseKeys = copy[key] ?? [];
        copy[key] = [...new Set(baseKeys.concat(options[key] ?? []))];
      } else if (key === "configurable")
        copy[key] = {
          ...copy[key],
          ...options[key]
        };
      else if (key === "timeout") {
        if (copy.timeout === void 0)
          copy.timeout = options.timeout;
        else if (options.timeout !== void 0)
          copy.timeout = Math.min(copy.timeout, options.timeout);
      } else if (key === "signal") {
        if (copy.signal === void 0)
          copy.signal = options.signal;
        else if (options.signal !== void 0)
          if ("any" in AbortSignal)
            copy.signal = AbortSignal.any([copy.signal, options.signal]);
          else
            copy.signal = options.signal;
      } else if (key === "callbacks") {
        const baseCallbacks = copy.callbacks;
        const providedCallbacks = options.callbacks;
        if (Array.isArray(providedCallbacks))
          if (!baseCallbacks)
            copy.callbacks = providedCallbacks;
          else if (Array.isArray(baseCallbacks))
            copy.callbacks = baseCallbacks.concat(providedCallbacks);
          else {
            const manager = baseCallbacks.copy();
            for (const callback of providedCallbacks)
              manager.addHandler(ensureHandler(callback), true);
            copy.callbacks = manager;
          }
        else if (providedCallbacks)
          if (!baseCallbacks)
            copy.callbacks = providedCallbacks;
          else if (Array.isArray(baseCallbacks)) {
            const manager = providedCallbacks.copy();
            for (const callback of baseCallbacks)
              manager.addHandler(ensureHandler(callback), true);
            copy.callbacks = manager;
          } else
            copy.callbacks = new CallbackManager(providedCallbacks._parentRunId, {
              handlers: baseCallbacks.handlers.concat(providedCallbacks.handlers),
              inheritableHandlers: baseCallbacks.inheritableHandlers.concat(providedCallbacks.inheritableHandlers),
              tags: Array.from(new Set(baseCallbacks.tags.concat(providedCallbacks.tags))),
              inheritableTags: Array.from(new Set(baseCallbacks.inheritableTags.concat(providedCallbacks.inheritableTags))),
              metadata: {
                ...baseCallbacks.metadata,
                ...providedCallbacks.metadata
              }
            });
      } else {
        const typedKey = key;
        copy[typedKey] = options[typedKey] ?? copy[typedKey];
      }
  return copy;
}
function ensureConfig(config2) {
  const implicitConfig = AsyncLocalStorageProviderSingleton2.getRunnableConfig();
  let empty = {
    tags: [],
    metadata: {},
    recursionLimit: 25,
    runId: void 0
  };
  if (implicitConfig) {
    const { runId, runName, ...rest } = implicitConfig;
    empty = Object.entries(rest).reduce((currentConfig, [key, value]) => {
      if (value !== void 0)
        currentConfig[key] = value;
      return currentConfig;
    }, empty);
  }
  if (config2)
    empty = Object.entries(config2).reduce((currentConfig, [key, value]) => {
      if (value !== void 0)
        currentConfig[key] = value;
      return currentConfig;
    }, empty);
  if (empty?.configurable) {
    if (typeof empty.configurable.model === "string" && empty.metadata?.model === void 0) {
      if (!empty.metadata)
        empty.metadata = {};
      empty.metadata.model = empty.configurable.model;
    }
  }
  if (empty.timeout !== void 0) {
    if (empty.timeout <= 0)
      throw new Error("Timeout must be a positive number");
    const originalTimeoutMs = empty.timeout;
    const timeoutSignal = AbortSignal.timeout(originalTimeoutMs);
    if (!empty.metadata)
      empty.metadata = {};
    if (empty.metadata.timeoutMs === void 0)
      empty.metadata.timeoutMs = originalTimeoutMs;
    if (empty.signal !== void 0) {
      if ("any" in AbortSignal)
        empty.signal = AbortSignal.any([empty.signal, timeoutSignal]);
    } else
      empty.signal = timeoutSignal;
    delete empty.timeout;
  }
  return empty;
}
function patchConfig(config2 = {}, { callbacks, maxConcurrency, recursionLimit, runName, configurable, runId } = {}) {
  const newConfig = ensureConfig(config2);
  if (callbacks !== void 0) {
    delete newConfig.runName;
    newConfig.callbacks = callbacks;
  }
  if (recursionLimit !== void 0)
    newConfig.recursionLimit = recursionLimit;
  if (maxConcurrency !== void 0)
    newConfig.maxConcurrency = maxConcurrency;
  if (runName !== void 0)
    newConfig.runName = runName;
  if (configurable !== void 0)
    newConfig.configurable = {
      ...newConfig.configurable,
      ...configurable
    };
  if (runId !== void 0)
    delete newConfig.runId;
  return newConfig;
}
function pickRunnableConfigKeys(config2) {
  if (!config2)
    return void 0;
  return {
    configurable: config2.configurable,
    recursionLimit: config2.recursionLimit,
    callbacks: config2.callbacks,
    tags: config2.tags,
    metadata: config2.metadata,
    maxConcurrency: config2.maxConcurrency,
    timeout: config2.timeout,
    signal: config2.signal,
    store: config2.store
  };
}

// ../../node_modules/@langchain/core/dist/utils/signal.js
async function raceWithSignal(promise, signal) {
  if (signal === void 0)
    return promise;
  let listener;
  return Promise.race([promise.catch((err) => {
    if (!signal?.aborted)
      throw err;
    else
      return;
  }), new Promise((_, reject) => {
    listener = () => {
      reject(getAbortSignalError(signal));
    };
    signal.addEventListener("abort", listener, { once: true });
    if (signal.aborted)
      reject(getAbortSignalError(signal));
  })]).finally(() => signal.removeEventListener("abort", listener));
}
function getAbortSignalError(signal) {
  if (signal?.reason instanceof Error)
    return signal.reason;
  if (typeof signal?.reason === "string")
    return new Error(signal.reason);
  return /* @__PURE__ */ new Error("Aborted");
}

// ../../node_modules/@langchain/core/dist/utils/stream.js
var IterableReadableStream = class IterableReadableStream2 extends ReadableStream {
  reader;
  ensureReader() {
    if (!this.reader)
      this.reader = this.getReader();
  }
  async next() {
    this.ensureReader();
    try {
      const result = await this.reader.read();
      if (result.done) {
        this.reader.releaseLock();
        return {
          done: true,
          value: void 0
        };
      } else
        return {
          done: false,
          value: result.value
        };
    } catch (e) {
      this.reader.releaseLock();
      throw e;
    }
  }
  async return() {
    this.ensureReader();
    if (this.locked) {
      const cancelPromise = this.reader.cancel();
      this.reader.releaseLock();
      await cancelPromise;
    }
    return {
      done: true,
      value: void 0
    };
  }
  async throw(e) {
    this.ensureReader();
    if (this.locked) {
      const cancelPromise = this.reader.cancel();
      this.reader.releaseLock();
      await cancelPromise;
    }
    throw e;
  }
  [Symbol.asyncIterator]() {
    return this;
  }
  async [Symbol.asyncDispose]() {
    await this.return();
  }
  static fromReadableStream(stream) {
    const reader = stream.getReader();
    return new IterableReadableStream2({
      start(controller) {
        return pump();
        function pump() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }
      },
      cancel() {
        reader.releaseLock();
      }
    });
  }
  static fromAsyncGenerator(generator) {
    return new IterableReadableStream2({
      async pull(controller) {
        const { value, done } = await generator.next();
        if (done)
          controller.close();
        controller.enqueue(value);
      },
      async cancel(reason) {
        await generator.return(reason);
      }
    });
  }
};
function atee(iter, length = 2) {
  const buffers = Array.from({ length }, () => []);
  return buffers.map(async function* makeIter(buffer) {
    while (true)
      if (buffer.length === 0) {
        const result = await iter.next();
        for (const buffer2 of buffers)
          buffer2.push(result);
      } else if (buffer[0].done)
        return;
      else
        yield buffer.shift().value;
  });
}
function concat(first, second) {
  if (Array.isArray(first) && Array.isArray(second))
    return first.concat(second);
  else if (typeof first === "string" && typeof second === "string")
    return first + second;
  else if (typeof first === "number" && typeof second === "number")
    return first + second;
  else if ("concat" in first && typeof first.concat === "function")
    return first.concat(second);
  else if (typeof first === "object" && typeof second === "object") {
    const chunk = { ...first };
    for (const [key, value] of Object.entries(second))
      if (key in chunk && !Array.isArray(chunk[key]))
        chunk[key] = concat(chunk[key], value);
      else
        chunk[key] = value;
    return chunk;
  } else
    throw new Error(`Cannot concat ${typeof first} and ${typeof second}`);
}
var AsyncGeneratorWithSetup = class {
  generator;
  setup;
  config;
  signal;
  firstResult;
  firstResultUsed = false;
  constructor(params) {
    this.generator = params.generator;
    this.config = params.config;
    this.signal = params.signal ?? this.config?.signal;
    this.setup = new Promise((resolve3, reject) => {
      AsyncLocalStorageProviderSingleton2.runWithConfig(pickRunnableConfigKeys(params.config), async () => {
        this.firstResult = this.signal ? raceWithSignal(params.generator.next(), this.signal) : params.generator.next();
        if (params.startSetup)
          this.firstResult.then(params.startSetup).then(resolve3, reject);
        else
          this.firstResult.then((_result) => resolve3(void 0), reject);
      }, true);
    });
  }
  async next(...args) {
    this.signal?.throwIfAborted();
    if (!this.firstResultUsed) {
      this.firstResultUsed = true;
      return this.firstResult;
    }
    return AsyncLocalStorageProviderSingleton2.runWithConfig(pickRunnableConfigKeys(this.config), this.signal ? async () => {
      return raceWithSignal(this.generator.next(...args), this.signal);
    } : async () => {
      return this.generator.next(...args);
    }, true);
  }
  async return(value) {
    return this.generator.return(value);
  }
  async throw(e) {
    return this.generator.throw(e);
  }
  [Symbol.asyncIterator]() {
    return this;
  }
  async [Symbol.asyncDispose]() {
    await this.return();
  }
};
async function pipeGeneratorWithSetup(to, generator, startSetup, signal, ...args) {
  const gen = new AsyncGeneratorWithSetup({
    generator,
    startSetup,
    signal
  });
  const setup = await gen.setup;
  return {
    output: to(gen, setup, ...args),
    setup
  };
}

// ../../node_modules/@langchain/core/dist/utils/fast-json-patch/src/helpers.js
var _hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, key) {
  return _hasOwnProperty.call(obj, key);
}
function _objectKeys(obj) {
  if (Array.isArray(obj)) {
    const keys2 = new Array(obj.length);
    for (let k = 0; k < keys2.length; k++)
      keys2[k] = "" + k;
    return keys2;
  }
  if (Object.keys)
    return Object.keys(obj);
  let keys = [];
  for (let i in obj)
    if (hasOwnProperty(obj, i))
      keys.push(i);
  return keys;
}
function _deepClone(obj) {
  switch (typeof obj) {
    case "object":
      return JSON.parse(JSON.stringify(obj));
    case "undefined":
      return null;
    default:
      return obj;
  }
}
function isInteger(str) {
  let i = 0;
  const len = str.length;
  let charCode;
  while (i < len) {
    charCode = str.charCodeAt(i);
    if (charCode >= 48 && charCode <= 57) {
      i++;
      continue;
    }
    return false;
  }
  return true;
}
function unescapePathComponent(path3) {
  return path3.replace(/~1/g, "/").replace(/~0/g, "~");
}
function hasUndefined(obj) {
  if (obj === void 0)
    return true;
  if (obj) {
    if (Array.isArray(obj)) {
      for (let i2 = 0, len = obj.length; i2 < len; i2++)
        if (hasUndefined(obj[i2]))
          return true;
    } else if (typeof obj === "object") {
      const objKeys = _objectKeys(obj);
      const objKeysLength = objKeys.length;
      for (var i = 0; i < objKeysLength; i++)
        if (hasUndefined(obj[objKeys[i]]))
          return true;
    }
  }
  return false;
}
function patchErrorMessageFormatter(message, args) {
  const messageParts = [message];
  for (const key in args) {
    const value = typeof args[key] === "object" ? JSON.stringify(args[key], null, 2) : args[key];
    if (typeof value !== "undefined")
      messageParts.push(`${key}: ${value}`);
  }
  return messageParts.join("\n");
}
var PatchError = class extends Error {
  constructor(message, name, index, operation, tree) {
    super(patchErrorMessageFormatter(message, {
      name,
      index,
      operation,
      tree
    }));
    this.name = name;
    this.index = index;
    this.operation = operation;
    this.tree = tree;
    Object.setPrototypeOf(this, new.target.prototype);
    this.message = patchErrorMessageFormatter(message, {
      name,
      index,
      operation,
      tree
    });
  }
};

// ../../node_modules/@langchain/core/dist/utils/fast-json-patch/src/core.js
var core_exports = /* @__PURE__ */ __exportAll({
  JsonPatchError: () => JsonPatchError,
  _areEquals: () => _areEquals,
  applyOperation: () => applyOperation,
  applyPatch: () => applyPatch,
  applyReducer: () => applyReducer,
  deepClone: () => deepClone,
  getValueByPointer: () => getValueByPointer,
  validate: () => validate4,
  validator: () => validator
});
var JsonPatchError = PatchError;
var deepClone = _deepClone;
var objOps = {
  add: function(obj, key, document) {
    if (key === "__proto__" || key === "constructor")
      throw new TypeError("JSON-Patch: modifying `__proto__` or `constructor` prop is banned for security reasons");
    obj[key] = this.value;
    return { newDocument: document };
  },
  remove: function(obj, key, document) {
    if (key === "__proto__" || key === "constructor")
      throw new TypeError("JSON-Patch: modifying `__proto__` or `constructor` prop is banned for security reasons");
    var removed = obj[key];
    delete obj[key];
    return {
      newDocument: document,
      removed
    };
  },
  replace: function(obj, key, document) {
    if (key === "__proto__" || key === "constructor")
      throw new TypeError("JSON-Patch: modifying `__proto__` or `constructor` prop is banned for security reasons");
    var removed = obj[key];
    obj[key] = this.value;
    return {
      newDocument: document,
      removed
    };
  },
  move: function(obj, key, document) {
    let removed = getValueByPointer(document, this.path);
    if (removed)
      removed = _deepClone(removed);
    const originalValue = applyOperation(document, {
      op: "remove",
      path: this.from
    }).removed;
    applyOperation(document, {
      op: "add",
      path: this.path,
      value: originalValue
    });
    return {
      newDocument: document,
      removed
    };
  },
  copy: function(obj, key, document) {
    const valueToCopy = getValueByPointer(document, this.from);
    applyOperation(document, {
      op: "add",
      path: this.path,
      value: _deepClone(valueToCopy)
    });
    return { newDocument: document };
  },
  test: function(obj, key, document) {
    return {
      newDocument: document,
      test: _areEquals(obj[key], this.value)
    };
  },
  _get: function(obj, key, document) {
    this.value = obj[key];
    return { newDocument: document };
  }
};
var arrOps = {
  add: function(arr2, i, document) {
    if (isInteger(i))
      arr2.splice(i, 0, this.value);
    else
      arr2[i] = this.value;
    return {
      newDocument: document,
      index: i
    };
  },
  remove: function(arr2, i, document) {
    return {
      newDocument: document,
      removed: arr2.splice(i, 1)[0]
    };
  },
  replace: function(arr2, i, document) {
    var removed = arr2[i];
    arr2[i] = this.value;
    return {
      newDocument: document,
      removed
    };
  },
  move: objOps.move,
  copy: objOps.copy,
  test: objOps.test,
  _get: objOps._get
};
function getValueByPointer(document, pointer) {
  if (pointer == "")
    return document;
  var getOriginalDestination = {
    op: "_get",
    path: pointer
  };
  applyOperation(document, getOriginalDestination);
  return getOriginalDestination.value;
}
function applyOperation(document, operation, validateOperation = false, mutateDocument = true, banPrototypeModifications = true, index = 0) {
  if (validateOperation)
    if (typeof validateOperation == "function")
      validateOperation(operation, 0, document, operation.path);
    else
      validator(operation, 0);
  if (operation.path === "") {
    let returnValue = { newDocument: document };
    if (operation.op === "add") {
      returnValue.newDocument = operation.value;
      return returnValue;
    } else if (operation.op === "replace") {
      returnValue.newDocument = operation.value;
      returnValue.removed = document;
      return returnValue;
    } else if (operation.op === "move" || operation.op === "copy") {
      returnValue.newDocument = getValueByPointer(document, operation.from);
      if (operation.op === "move")
        returnValue.removed = document;
      return returnValue;
    } else if (operation.op === "test") {
      returnValue.test = _areEquals(document, operation.value);
      if (returnValue.test === false)
        throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
      returnValue.newDocument = document;
      return returnValue;
    } else if (operation.op === "remove") {
      returnValue.removed = document;
      returnValue.newDocument = null;
      return returnValue;
    } else if (operation.op === "_get") {
      operation.value = document;
      return returnValue;
    } else if (validateOperation)
      throw new JsonPatchError("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", index, operation, document);
    else
      return returnValue;
  } else {
    if (!mutateDocument)
      document = _deepClone(document);
    const keys = (operation.path || "").split("/");
    let obj = document;
    let t = 1;
    let len = keys.length;
    let existingPathFragment = void 0;
    let key;
    let validateFunction;
    if (typeof validateOperation == "function")
      validateFunction = validateOperation;
    else
      validateFunction = validator;
    while (true) {
      key = keys[t];
      if (key && key.indexOf("~") != -1)
        key = unescapePathComponent(key);
      if (banPrototypeModifications && (key == "__proto__" || key == "prototype" && t > 0 && keys[t - 1] == "constructor"))
        throw new TypeError("JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README");
      if (validateOperation) {
        if (existingPathFragment === void 0) {
          if (obj[key] === void 0)
            existingPathFragment = keys.slice(0, t).join("/");
          else if (t == len - 1)
            existingPathFragment = operation.path;
          if (existingPathFragment !== void 0)
            validateFunction(operation, 0, document, existingPathFragment);
        }
      }
      t++;
      if (Array.isArray(obj)) {
        if (key === "-")
          key = obj.length;
        else if (validateOperation && !isInteger(key))
          throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", index, operation, document);
        else if (isInteger(key))
          key = ~~key;
        if (t >= len) {
          if (validateOperation && operation.op === "add" && key > obj.length)
            throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", index, operation, document);
          const returnValue = arrOps[operation.op].call(operation, obj, key, document);
          if (returnValue.test === false)
            throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
          return returnValue;
        }
      } else if (t >= len) {
        const returnValue = objOps[operation.op].call(operation, obj, key, document);
        if (returnValue.test === false)
          throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
        return returnValue;
      }
      obj = obj[key];
      if (validateOperation && t < len && (!obj || typeof obj !== "object"))
        throw new JsonPatchError("Cannot perform operation at the desired path", "OPERATION_PATH_UNRESOLVABLE", index, operation, document);
    }
  }
}
function applyPatch(document, patch, validateOperation, mutateDocument = true, banPrototypeModifications = true) {
  if (validateOperation) {
    if (!Array.isArray(patch))
      throw new JsonPatchError("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
  }
  if (!mutateDocument)
    document = _deepClone(document);
  const results = new Array(patch.length);
  for (let i = 0, length = patch.length; i < length; i++) {
    results[i] = applyOperation(document, patch[i], validateOperation, true, banPrototypeModifications, i);
    document = results[i].newDocument;
  }
  results.newDocument = document;
  return results;
}
function applyReducer(document, operation, index) {
  const operationResult = applyOperation(document, operation);
  if (operationResult.test === false)
    throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
  return operationResult.newDocument;
}
function validator(operation, index, document, existingPathFragment) {
  if (typeof operation !== "object" || operation === null || Array.isArray(operation))
    throw new JsonPatchError("Operation is not an object", "OPERATION_NOT_AN_OBJECT", index, operation, document);
  else if (!objOps[operation.op])
    throw new JsonPatchError("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", index, operation, document);
  else if (typeof operation.path !== "string")
    throw new JsonPatchError("Operation `path` property is not a string", "OPERATION_PATH_INVALID", index, operation, document);
  else if (operation.path.indexOf("/") !== 0 && operation.path.length > 0)
    throw new JsonPatchError('Operation `path` property must start with "/"', "OPERATION_PATH_INVALID", index, operation, document);
  else if ((operation.op === "move" || operation.op === "copy") && typeof operation.from !== "string")
    throw new JsonPatchError("Operation `from` property is not present (applicable in `move` and `copy` operations)", "OPERATION_FROM_REQUIRED", index, operation, document);
  else if ((operation.op === "add" || operation.op === "replace" || operation.op === "test") && operation.value === void 0)
    throw new JsonPatchError("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_REQUIRED", index, operation, document);
  else if ((operation.op === "add" || operation.op === "replace" || operation.op === "test") && hasUndefined(operation.value))
    throw new JsonPatchError("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED", index, operation, document);
  else if (document) {
    if (operation.op == "add") {
      var pathLen = operation.path.split("/").length;
      var existingPathLen = existingPathFragment.split("/").length;
      if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen)
        throw new JsonPatchError("Cannot perform an `add` operation at the desired path", "OPERATION_PATH_CANNOT_ADD", index, operation, document);
    } else if (operation.op === "replace" || operation.op === "remove" || operation.op === "_get") {
      if (operation.path !== existingPathFragment)
        throw new JsonPatchError("Cannot perform the operation at a path that does not exist", "OPERATION_PATH_UNRESOLVABLE", index, operation, document);
    } else if (operation.op === "move" || operation.op === "copy") {
      var error = validate4([{
        op: "_get",
        path: operation.from,
        value: void 0
      }], document);
      if (error && error.name === "OPERATION_PATH_UNRESOLVABLE")
        throw new JsonPatchError("Cannot perform the operation from a path that does not exist", "OPERATION_FROM_UNRESOLVABLE", index, operation, document);
    }
  }
}
function validate4(sequence, document, externalValidator) {
  try {
    if (!Array.isArray(sequence))
      throw new JsonPatchError("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
    if (document)
      applyPatch(_deepClone(document), _deepClone(sequence), externalValidator || true);
    else {
      externalValidator = externalValidator || validator;
      for (var i = 0; i < sequence.length; i++)
        externalValidator(sequence[i], i, document, void 0);
    }
  } catch (e) {
    if (e instanceof JsonPatchError)
      return e;
    else
      throw e;
  }
}
function _areEquals(a, b) {
  if (a === b)
    return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    var arrA = Array.isArray(a), arrB = Array.isArray(b), i, length, key;
    if (arrA && arrB) {
      length = a.length;
      if (length != b.length)
        return false;
      for (i = length; i-- !== 0; )
        if (!_areEquals(a[i], b[i]))
          return false;
      return true;
    }
    if (arrA != arrB)
      return false;
    var keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length)
      return false;
    for (i = length; i-- !== 0; )
      if (!b.hasOwnProperty(keys[i]))
        return false;
    for (i = length; i-- !== 0; ) {
      key = keys[i];
      if (!_areEquals(a[key], b[key]))
        return false;
    }
    return true;
  }
  return a !== a && b !== b;
}

// ../../node_modules/@langchain/core/dist/utils/fast-json-patch/index.js
({ ...core_exports });

// ../../node_modules/@langchain/core/dist/tracers/log_stream.js
var RunLogPatch = class {
  ops;
  constructor(fields) {
    this.ops = fields.ops ?? [];
  }
  concat(other) {
    const ops = this.ops.concat(other.ops);
    const states = applyPatch({}, ops);
    return new RunLog({
      ops,
      state: states[states.length - 1].newDocument
    });
  }
};
var RunLog = class RunLog2 extends RunLogPatch {
  state;
  constructor(fields) {
    super(fields);
    this.state = fields.state;
  }
  concat(other) {
    const ops = this.ops.concat(other.ops);
    const states = applyPatch(this.state, other.ops);
    return new RunLog2({
      ops,
      state: states[states.length - 1].newDocument
    });
  }
  static fromRunLogPatch(patch) {
    const states = applyPatch({}, patch.ops);
    return new RunLog2({
      ops: patch.ops,
      state: states[states.length - 1].newDocument
    });
  }
};
var isLogStreamHandler = (handler) => handler.name === "log_stream_tracer";
async function _getStandardizedInputs(run, schemaFormat) {
  if (schemaFormat === "original")
    throw new Error("Do not assign inputs with original schema drop the key for now. When inputs are added to streamLog they should be added with standardized schema for streaming events.");
  const { inputs } = run;
  if ([
    "retriever",
    "llm",
    "prompt"
  ].includes(run.run_type))
    return inputs;
  if (Object.keys(inputs).length === 1 && inputs?.input === "")
    return;
  return inputs.input;
}
async function _getStandardizedOutputs(run, schemaFormat) {
  const { outputs } = run;
  if (schemaFormat === "original")
    return outputs;
  if ([
    "retriever",
    "llm",
    "prompt"
  ].includes(run.run_type))
    return outputs;
  if (outputs !== void 0 && Object.keys(outputs).length === 1 && outputs?.output !== void 0)
    return outputs.output;
  return outputs;
}
function isChatGenerationChunk(x) {
  return x !== void 0 && x.message !== void 0;
}
var LogStreamCallbackHandler = class extends BaseTracer {
  autoClose = true;
  includeNames;
  includeTypes;
  includeTags;
  excludeNames;
  excludeTypes;
  excludeTags;
  _schemaFormat = "original";
  rootId;
  keyMapByRunId = {};
  counterMapByRunName = {};
  transformStream;
  writer;
  receiveStream;
  name = "log_stream_tracer";
  lc_prefer_streaming = true;
  constructor(fields) {
    super({
      _awaitHandler: true,
      ...fields
    });
    this.autoClose = fields?.autoClose ?? true;
    this.includeNames = fields?.includeNames;
    this.includeTypes = fields?.includeTypes;
    this.includeTags = fields?.includeTags;
    this.excludeNames = fields?.excludeNames;
    this.excludeTypes = fields?.excludeTypes;
    this.excludeTags = fields?.excludeTags;
    this._schemaFormat = fields?._schemaFormat ?? this._schemaFormat;
    this.transformStream = new TransformStream();
    this.writer = this.transformStream.writable.getWriter();
    this.receiveStream = IterableReadableStream.fromReadableStream(this.transformStream.readable);
  }
  [Symbol.asyncIterator]() {
    return this.receiveStream;
  }
  async persistRun(_run) {
  }
  _includeRun(run) {
    if (run.id === this.rootId)
      return false;
    const runTags = run.tags ?? [];
    let include = this.includeNames === void 0 && this.includeTags === void 0 && this.includeTypes === void 0;
    if (this.includeNames !== void 0)
      include = include || this.includeNames.includes(run.name);
    if (this.includeTypes !== void 0)
      include = include || this.includeTypes.includes(run.run_type);
    if (this.includeTags !== void 0)
      include = include || runTags.find((tag) => this.includeTags?.includes(tag)) !== void 0;
    if (this.excludeNames !== void 0)
      include = include && !this.excludeNames.includes(run.name);
    if (this.excludeTypes !== void 0)
      include = include && !this.excludeTypes.includes(run.run_type);
    if (this.excludeTags !== void 0)
      include = include && runTags.every((tag) => !this.excludeTags?.includes(tag));
    return include;
  }
  async *tapOutputIterable(runId, output) {
    for await (const chunk of output) {
      if (runId !== this.rootId) {
        const key = this.keyMapByRunId[runId];
        if (key)
          await this.writer.write(new RunLogPatch({ ops: [{
            op: "add",
            path: `/logs/${key}/streamed_output/-`,
            value: chunk
          }] }));
      }
      yield chunk;
    }
  }
  async onRunCreate(run) {
    if (this.rootId === void 0) {
      this.rootId = run.id;
      await this.writer.write(new RunLogPatch({ ops: [{
        op: "replace",
        path: "",
        value: {
          id: run.id,
          name: run.name,
          type: run.run_type,
          streamed_output: [],
          final_output: void 0,
          logs: {}
        }
      }] }));
    }
    if (!this._includeRun(run))
      return;
    if (this.counterMapByRunName[run.name] === void 0)
      this.counterMapByRunName[run.name] = 0;
    this.counterMapByRunName[run.name] += 1;
    const count = this.counterMapByRunName[run.name];
    this.keyMapByRunId[run.id] = count === 1 ? run.name : `${run.name}:${count}`;
    const logEntry = {
      id: run.id,
      name: run.name,
      type: run.run_type,
      tags: run.tags ?? [],
      metadata: run.extra?.metadata ?? {},
      start_time: new Date(run.start_time).toISOString(),
      streamed_output: [],
      streamed_output_str: [],
      final_output: void 0,
      end_time: void 0
    };
    if (this._schemaFormat === "streaming_events")
      logEntry.inputs = await _getStandardizedInputs(run, this._schemaFormat);
    await this.writer.write(new RunLogPatch({ ops: [{
      op: "add",
      path: `/logs/${this.keyMapByRunId[run.id]}`,
      value: logEntry
    }] }));
  }
  async onRunUpdate(run) {
    try {
      const runName = this.keyMapByRunId[run.id];
      if (runName === void 0)
        return;
      const ops = [];
      if (this._schemaFormat === "streaming_events")
        ops.push({
          op: "replace",
          path: `/logs/${runName}/inputs`,
          value: await _getStandardizedInputs(run, this._schemaFormat)
        });
      ops.push({
        op: "add",
        path: `/logs/${runName}/final_output`,
        value: await _getStandardizedOutputs(run, this._schemaFormat)
      });
      if (run.end_time !== void 0)
        ops.push({
          op: "add",
          path: `/logs/${runName}/end_time`,
          value: new Date(run.end_time).toISOString()
        });
      const patch = new RunLogPatch({ ops });
      await this.writer.write(patch);
    } finally {
      if (run.id === this.rootId) {
        const patch = new RunLogPatch({ ops: [{
          op: "replace",
          path: "/final_output",
          value: await _getStandardizedOutputs(run, this._schemaFormat)
        }] });
        await this.writer.write(patch);
        if (this.autoClose)
          await this.writer.close();
      }
    }
  }
  async onLLMNewToken(run, token, kwargs) {
    const runName = this.keyMapByRunId[run.id];
    if (runName === void 0)
      return;
    const isChatModel = run.inputs.messages !== void 0;
    let streamedOutputValue;
    if (isChatModel)
      if (isChatGenerationChunk(kwargs?.chunk))
        streamedOutputValue = kwargs?.chunk;
      else
        streamedOutputValue = new AIMessageChunk({
          id: `run-${run.id}`,
          content: token
        });
    else
      streamedOutputValue = token;
    const patch = new RunLogPatch({ ops: [{
      op: "add",
      path: `/logs/${runName}/streamed_output_str/-`,
      value: token
    }, {
      op: "add",
      path: `/logs/${runName}/streamed_output/-`,
      value: streamedOutputValue
    }] });
    await this.writer.write(patch);
  }
};

// ../../node_modules/@langchain/core/dist/outputs.js
var GenerationChunk = class GenerationChunk2 {
  text;
  generationInfo;
  constructor(fields) {
    this.text = fields.text;
    this.generationInfo = fields.generationInfo;
  }
  concat(chunk) {
    return new GenerationChunk2({
      text: this.text + chunk.text,
      generationInfo: {
        ...this.generationInfo,
        ...chunk.generationInfo
      }
    });
  }
};

// ../../node_modules/@langchain/core/dist/tracers/event_stream.js
function assignName({ name, serialized }) {
  if (name !== void 0)
    return name;
  if (serialized?.name !== void 0)
    return serialized.name;
  else if (serialized?.id !== void 0 && Array.isArray(serialized?.id))
    return serialized.id[serialized.id.length - 1];
  return "Unnamed";
}
var isStreamEventsHandler = (handler) => handler.name === "event_stream_tracer";
var EventStreamCallbackHandler = class extends BaseTracer {
  autoClose = true;
  includeNames;
  includeTypes;
  includeTags;
  excludeNames;
  excludeTypes;
  excludeTags;
  runInfoMap = /* @__PURE__ */ new Map();
  tappedPromises = /* @__PURE__ */ new Map();
  transformStream;
  writer;
  receiveStream;
  readableStreamClosed = false;
  name = "event_stream_tracer";
  lc_prefer_streaming = true;
  constructor(fields) {
    super({
      _awaitHandler: true,
      ...fields
    });
    this.autoClose = fields?.autoClose ?? true;
    this.includeNames = fields?.includeNames;
    this.includeTypes = fields?.includeTypes;
    this.includeTags = fields?.includeTags;
    this.excludeNames = fields?.excludeNames;
    this.excludeTypes = fields?.excludeTypes;
    this.excludeTags = fields?.excludeTags;
    this.transformStream = new TransformStream({ flush: () => {
      this.readableStreamClosed = true;
    } });
    this.writer = this.transformStream.writable.getWriter();
    this.receiveStream = IterableReadableStream.fromReadableStream(this.transformStream.readable);
  }
  [Symbol.asyncIterator]() {
    return this.receiveStream;
  }
  async persistRun(_run) {
  }
  _includeRun(run) {
    const runTags = run.tags ?? [];
    let include = this.includeNames === void 0 && this.includeTags === void 0 && this.includeTypes === void 0;
    if (this.includeNames !== void 0)
      include = include || this.includeNames.includes(run.name);
    if (this.includeTypes !== void 0)
      include = include || this.includeTypes.includes(run.runType);
    if (this.includeTags !== void 0)
      include = include || runTags.find((tag) => this.includeTags?.includes(tag)) !== void 0;
    if (this.excludeNames !== void 0)
      include = include && !this.excludeNames.includes(run.name);
    if (this.excludeTypes !== void 0)
      include = include && !this.excludeTypes.includes(run.runType);
    if (this.excludeTags !== void 0)
      include = include && runTags.every((tag) => !this.excludeTags?.includes(tag));
    return include;
  }
  async *tapOutputIterable(runId, outputStream) {
    const firstChunk = await outputStream.next();
    if (firstChunk.done)
      return;
    const runInfo = this.runInfoMap.get(runId);
    if (runInfo === void 0) {
      yield firstChunk.value;
      return;
    }
    function _formatOutputChunk(eventType, data) {
      if (eventType === "llm" && typeof data === "string")
        return new GenerationChunk({ text: data });
      return data;
    }
    let tappedPromise = this.tappedPromises.get(runId);
    if (tappedPromise === void 0) {
      let tappedPromiseResolver;
      tappedPromise = new Promise((resolve3) => {
        tappedPromiseResolver = resolve3;
      });
      this.tappedPromises.set(runId, tappedPromise);
      try {
        const event = {
          event: `on_${runInfo.runType}_stream`,
          run_id: runId,
          name: runInfo.name,
          tags: runInfo.tags,
          metadata: runInfo.metadata,
          data: {}
        };
        await this.send({
          ...event,
          data: { chunk: _formatOutputChunk(runInfo.runType, firstChunk.value) }
        }, runInfo);
        yield firstChunk.value;
        for await (const chunk of outputStream) {
          if (runInfo.runType !== "tool" && runInfo.runType !== "retriever")
            await this.send({
              ...event,
              data: { chunk: _formatOutputChunk(runInfo.runType, chunk) }
            }, runInfo);
          yield chunk;
        }
      } finally {
        tappedPromiseResolver?.();
      }
    } else {
      yield firstChunk.value;
      for await (const chunk of outputStream)
        yield chunk;
    }
  }
  async send(payload, run) {
    if (this.readableStreamClosed)
      return;
    if (this._includeRun(run))
      await this.writer.write(payload);
  }
  async sendEndEvent(payload, run) {
    const tappedPromise = this.tappedPromises.get(payload.run_id);
    if (tappedPromise !== void 0)
      tappedPromise.then(() => {
        this.send(payload, run);
      });
    else
      await this.send(payload, run);
  }
  async onLLMStart(run) {
    const runName = assignName(run);
    const runType = run.inputs.messages !== void 0 ? "chat_model" : "llm";
    const runInfo = {
      tags: run.tags ?? [],
      metadata: run.extra?.metadata ?? {},
      name: runName,
      runType,
      inputs: run.inputs
    };
    this.runInfoMap.set(run.id, runInfo);
    const eventName = `on_${runType}_start`;
    await this.send({
      event: eventName,
      data: { input: run.inputs },
      name: runName,
      tags: run.tags ?? [],
      run_id: run.id,
      metadata: run.extra?.metadata ?? {}
    }, runInfo);
  }
  async onLLMNewToken(run, token, kwargs) {
    const runInfo = this.runInfoMap.get(run.id);
    let chunk;
    let eventName;
    if (runInfo === void 0)
      throw new Error(`onLLMNewToken: Run ID ${run.id} not found in run map.`);
    if (this.runInfoMap.size === 1)
      return;
    if (runInfo.runType === "chat_model") {
      eventName = "on_chat_model_stream";
      if (kwargs?.chunk === void 0)
        chunk = new AIMessageChunk({
          content: token,
          id: `run-${run.id}`
        });
      else
        chunk = kwargs.chunk.message;
    } else if (runInfo.runType === "llm") {
      eventName = "on_llm_stream";
      if (kwargs?.chunk === void 0)
        chunk = new GenerationChunk({ text: token });
      else
        chunk = kwargs.chunk;
    } else
      throw new Error(`Unexpected run type ${runInfo.runType}`);
    await this.send({
      event: eventName,
      data: { chunk },
      run_id: run.id,
      name: runInfo.name,
      tags: runInfo.tags,
      metadata: runInfo.metadata
    }, runInfo);
  }
  async onLLMEnd(run) {
    const runInfo = this.runInfoMap.get(run.id);
    this.runInfoMap.delete(run.id);
    let eventName;
    if (runInfo === void 0)
      throw new Error(`onLLMEnd: Run ID ${run.id} not found in run map.`);
    const generations = run.outputs?.generations;
    let output;
    if (runInfo.runType === "chat_model") {
      for (const generation of generations ?? []) {
        if (output !== void 0)
          break;
        output = generation[0]?.message;
      }
      eventName = "on_chat_model_end";
    } else if (runInfo.runType === "llm") {
      output = {
        generations: generations?.map((generation) => {
          return generation.map((chunk) => {
            return {
              text: chunk.text,
              generationInfo: chunk.generationInfo
            };
          });
        }),
        llmOutput: run.outputs?.llmOutput ?? {}
      };
      eventName = "on_llm_end";
    } else
      throw new Error(`onLLMEnd: Unexpected run type: ${runInfo.runType}`);
    await this.sendEndEvent({
      event: eventName,
      data: {
        output,
        input: runInfo.inputs
      },
      run_id: run.id,
      name: runInfo.name,
      tags: runInfo.tags,
      metadata: runInfo.metadata
    }, runInfo);
  }
  async onChainStart(run) {
    const runName = assignName(run);
    const runType = run.run_type ?? "chain";
    const runInfo = {
      tags: run.tags ?? [],
      metadata: run.extra?.metadata ?? {},
      name: runName,
      runType: run.run_type
    };
    let eventData = {};
    if (run.inputs.input === "" && Object.keys(run.inputs).length === 1) {
      eventData = {};
      runInfo.inputs = {};
    } else if (run.inputs.input !== void 0) {
      eventData.input = run.inputs.input;
      runInfo.inputs = run.inputs.input;
    } else {
      eventData.input = run.inputs;
      runInfo.inputs = run.inputs;
    }
    this.runInfoMap.set(run.id, runInfo);
    await this.send({
      event: `on_${runType}_start`,
      data: eventData,
      name: runName,
      tags: run.tags ?? [],
      run_id: run.id,
      metadata: run.extra?.metadata ?? {}
    }, runInfo);
  }
  async onChainEnd(run) {
    const runInfo = this.runInfoMap.get(run.id);
    this.runInfoMap.delete(run.id);
    if (runInfo === void 0)
      throw new Error(`onChainEnd: Run ID ${run.id} not found in run map.`);
    const eventName = `on_${run.run_type}_end`;
    const inputs = run.inputs ?? runInfo.inputs ?? {};
    const data = {
      output: run.outputs?.output ?? run.outputs,
      input: inputs
    };
    if (inputs.input && Object.keys(inputs).length === 1) {
      data.input = inputs.input;
      runInfo.inputs = inputs.input;
    }
    await this.sendEndEvent({
      event: eventName,
      data,
      run_id: run.id,
      name: runInfo.name,
      tags: runInfo.tags,
      metadata: runInfo.metadata ?? {}
    }, runInfo);
  }
  async onToolStart(run) {
    const runName = assignName(run);
    const runInfo = {
      tags: run.tags ?? [],
      metadata: run.extra?.metadata ?? {},
      name: runName,
      runType: "tool",
      inputs: run.inputs ?? {}
    };
    this.runInfoMap.set(run.id, runInfo);
    await this.send({
      event: "on_tool_start",
      data: { input: run.inputs ?? {} },
      name: runName,
      run_id: run.id,
      tags: run.tags ?? [],
      metadata: run.extra?.metadata ?? {}
    }, runInfo);
  }
  async onToolEnd(run) {
    const runInfo = this.runInfoMap.get(run.id);
    this.runInfoMap.delete(run.id);
    if (runInfo === void 0)
      throw new Error(`onToolEnd: Run ID ${run.id} not found in run map.`);
    if (runInfo.inputs === void 0)
      throw new Error(`onToolEnd: Run ID ${run.id} is a tool call, and is expected to have traced inputs.`);
    const output = run.outputs?.output === void 0 ? run.outputs : run.outputs.output;
    await this.sendEndEvent({
      event: "on_tool_end",
      data: {
        output,
        input: runInfo.inputs
      },
      run_id: run.id,
      name: runInfo.name,
      tags: runInfo.tags,
      metadata: runInfo.metadata
    }, runInfo);
  }
  async onToolError(run) {
    const runInfo = this.runInfoMap.get(run.id);
    this.runInfoMap.delete(run.id);
    if (runInfo === void 0)
      throw new Error(`onToolEnd: Run ID ${run.id} not found in run map.`);
    if (runInfo.inputs === void 0)
      throw new Error(`onToolEnd: Run ID ${run.id} is a tool call, and is expected to have traced inputs.`);
    await this.sendEndEvent({
      event: "on_tool_error",
      data: {
        input: runInfo.inputs,
        error: run.error
      },
      run_id: run.id,
      name: runInfo.name,
      tags: runInfo.tags,
      metadata: runInfo.metadata
    }, runInfo);
  }
  async onRetrieverStart(run) {
    const runName = assignName(run);
    const runInfo = {
      tags: run.tags ?? [],
      metadata: run.extra?.metadata ?? {},
      name: runName,
      runType: "retriever",
      inputs: { query: run.inputs.query }
    };
    this.runInfoMap.set(run.id, runInfo);
    await this.send({
      event: "on_retriever_start",
      data: { input: { query: run.inputs.query } },
      name: runName,
      tags: run.tags ?? [],
      run_id: run.id,
      metadata: run.extra?.metadata ?? {}
    }, runInfo);
  }
  async onRetrieverEnd(run) {
    const runInfo = this.runInfoMap.get(run.id);
    this.runInfoMap.delete(run.id);
    if (runInfo === void 0)
      throw new Error(`onRetrieverEnd: Run ID ${run.id} not found in run map.`);
    await this.sendEndEvent({
      event: "on_retriever_end",
      data: {
        output: run.outputs?.documents ?? run.outputs,
        input: runInfo.inputs
      },
      run_id: run.id,
      name: runInfo.name,
      tags: runInfo.tags,
      metadata: runInfo.metadata
    }, runInfo);
  }
  async handleCustomEvent(eventName, data, runId) {
    const runInfo = this.runInfoMap.get(runId);
    if (runInfo === void 0)
      throw new Error(`handleCustomEvent: Run ID ${runId} not found in run map.`);
    await this.send({
      event: "on_custom_event",
      run_id: runId,
      name: eventName,
      tags: runInfo.tags,
      metadata: runInfo.metadata,
      data
    }, runInfo);
  }
  async finish() {
    const pendingPromises = [...this.tappedPromises.values()];
    Promise.all(pendingPromises).finally(() => {
      this.writer.close();
    });
  }
};

// ../../node_modules/@langchain/core/dist/utils/is-network-error/index.js
var objectToString2 = Object.prototype.toString;
var isError2 = (value) => objectToString2.call(value) === "[object Error]";
var errorMessages2 = /* @__PURE__ */ new Set([
  "network error",
  "Failed to fetch",
  "NetworkError when attempting to fetch resource.",
  "The Internet connection appears to be offline.",
  "Network request failed",
  "fetch failed",
  "terminated",
  " A network error occurred.",
  "Network connection lost"
]);
function isNetworkError2(error) {
  if (!(error && isError2(error) && error.name === "TypeError" && typeof error.message === "string"))
    return false;
  const { message, stack } = error;
  if (message === "Load failed")
    return stack === void 0 || "__sentry_captured__" in error;
  if (message.startsWith("error sending request for url"))
    return true;
  return errorMessages2.has(message);
}

// ../../node_modules/@langchain/core/dist/utils/p-retry/index.js
function validateRetries2(retries) {
  if (typeof retries === "number") {
    if (retries < 0)
      throw new TypeError("Expected `retries` to be a non-negative number.");
    if (Number.isNaN(retries))
      throw new TypeError("Expected `retries` to be a valid number or Infinity, got NaN.");
  } else if (retries !== void 0)
    throw new TypeError("Expected `retries` to be a number or Infinity.");
}
function validateNumberOption2(name, value, { min = 0, allowInfinity = false } = {}) {
  if (value === void 0)
    return;
  if (typeof value !== "number" || Number.isNaN(value))
    throw new TypeError(`Expected \`${name}\` to be a number${allowInfinity ? " or Infinity" : ""}.`);
  if (!allowInfinity && !Number.isFinite(value))
    throw new TypeError(`Expected \`${name}\` to be a finite number.`);
  if (value < min)
    throw new TypeError(`Expected \`${name}\` to be \u2265 ${min}.`);
}
var AbortError2 = class extends Error {
  constructor(message) {
    super();
    if (message instanceof Error) {
      this.originalError = message;
      ({ message } = message);
    } else {
      this.originalError = new Error(message);
      this.originalError.stack = this.stack;
    }
    this.name = "AbortError";
    this.message = message;
  }
};
function calculateDelay2(retriesConsumed, options) {
  const attempt = Math.max(1, retriesConsumed + 1);
  const random = options.randomize ? Math.random() + 1 : 1;
  let timeout = Math.round(random * options.minTimeout * options.factor ** (attempt - 1));
  timeout = Math.min(timeout, options.maxTimeout);
  return timeout;
}
function calculateRemainingTime2(start, max) {
  if (!Number.isFinite(max))
    return max;
  return max - (performance.now() - start);
}
async function onAttemptFailure2({ error, attemptNumber, retriesConsumed, startTime, options }) {
  const normalizedError = error instanceof Error ? error : /* @__PURE__ */ new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`);
  if (normalizedError instanceof AbortError2)
    throw normalizedError.originalError;
  const retriesLeft = Number.isFinite(options.retries) ? Math.max(0, options.retries - retriesConsumed) : options.retries;
  const maxRetryTime = options.maxRetryTime ?? Number.POSITIVE_INFINITY;
  const context = Object.freeze({
    error: normalizedError,
    attemptNumber,
    retriesLeft,
    retriesConsumed
  });
  await options.onFailedAttempt(context);
  if (calculateRemainingTime2(startTime, maxRetryTime) <= 0)
    throw normalizedError;
  const consumeRetry = await options.shouldConsumeRetry(context);
  const remainingTime = calculateRemainingTime2(startTime, maxRetryTime);
  if (remainingTime <= 0 || retriesLeft <= 0)
    throw normalizedError;
  if (normalizedError instanceof TypeError && !isNetworkError2(normalizedError)) {
    if (consumeRetry)
      throw normalizedError;
    options.signal?.throwIfAborted();
    return false;
  }
  if (!await options.shouldRetry(context))
    throw normalizedError;
  if (!consumeRetry) {
    options.signal?.throwIfAborted();
    return false;
  }
  const delayTime = calculateDelay2(retriesConsumed, options);
  const finalDelay = Math.min(delayTime, remainingTime);
  if (finalDelay > 0)
    await new Promise((resolve3, reject) => {
      const onAbort = () => {
        clearTimeout(timeoutToken);
        options.signal?.removeEventListener("abort", onAbort);
        reject(options.signal.reason);
      };
      const timeoutToken = setTimeout(() => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve3();
      }, finalDelay);
      if (options.unref)
        timeoutToken.unref?.();
      options.signal?.addEventListener("abort", onAbort, { once: true });
    });
  options.signal?.throwIfAborted();
  return true;
}
async function pRetry2(input, options = {}) {
  options = { ...options };
  validateRetries2(options.retries);
  if (Object.hasOwn(options, "forever"))
    throw new Error("The `forever` option is no longer supported. For many use-cases, you can set `retries: Infinity` instead.");
  options.retries ??= 10;
  options.factor ??= 2;
  options.minTimeout ??= 1e3;
  options.maxTimeout ??= Number.POSITIVE_INFINITY;
  options.maxRetryTime ??= Number.POSITIVE_INFINITY;
  options.randomize ??= false;
  options.onFailedAttempt ??= () => {
  };
  options.shouldRetry ??= () => true;
  options.shouldConsumeRetry ??= () => true;
  validateNumberOption2("factor", options.factor, {
    min: 0,
    allowInfinity: false
  });
  validateNumberOption2("minTimeout", options.minTimeout, {
    min: 0,
    allowInfinity: false
  });
  validateNumberOption2("maxTimeout", options.maxTimeout, {
    min: 0,
    allowInfinity: true
  });
  validateNumberOption2("maxRetryTime", options.maxRetryTime, {
    min: 0,
    allowInfinity: true
  });
  if (!(options.factor > 0))
    options.factor = 1;
  options.signal?.throwIfAborted();
  let attemptNumber = 0;
  let retriesConsumed = 0;
  const startTime = performance.now();
  while (Number.isFinite(options.retries) ? retriesConsumed <= options.retries : true) {
    attemptNumber++;
    try {
      options.signal?.throwIfAborted();
      const result = await input(attemptNumber);
      options.signal?.throwIfAborted();
      return result;
    } catch (error) {
      if (await onAttemptFailure2({
        error,
        attemptNumber,
        retriesConsumed,
        startTime,
        options
      }))
        retriesConsumed++;
    }
  }
  throw new Error("Retry attempts exhausted without throwing an error.");
}

// ../../node_modules/@langchain/core/dist/utils/async_caller.js
var import_p_queue4 = __toESM(require_dist(), 1);
var STATUS_NO_RETRY = [
  400,
  401,
  402,
  403,
  404,
  405,
  406,
  407,
  409
];
var defaultFailedAttemptHandler = (error) => {
  if (typeof error !== "object" || error === null)
    return;
  if ("message" in error && typeof error.message === "string" && (error.message.startsWith("Cancel") || error.message.startsWith("AbortError")) || "name" in error && typeof error.name === "string" && error.name === "AbortError")
    throw error;
  if ("code" in error && typeof error.code === "string" && error.code === "ECONNABORTED")
    throw error;
  const responseStatus = "response" in error && typeof error.response === "object" && error.response !== null && "status" in error.response && typeof error.response.status === "number" ? error.response.status : void 0;
  const directStatus = "status" in error && typeof error.status === "number" ? error.status : void 0;
  const status = responseStatus ?? directStatus;
  if (status && STATUS_NO_RETRY.includes(+status))
    throw error;
  if (("error" in error && typeof error.error === "object" && error.error !== null && "code" in error.error && typeof error.error.code === "string" ? error.error.code : void 0) === "insufficient_quota") {
    const err = new Error("message" in error && typeof error.message === "string" ? error.message : "Insufficient quota");
    err.name = "InsufficientQuotaError";
    throw err;
  }
};
var AsyncCaller2 = class {
  maxConcurrency;
  maxRetries;
  onFailedAttempt;
  queue;
  constructor(params) {
    this.maxConcurrency = params.maxConcurrency ?? Infinity;
    this.maxRetries = params.maxRetries ?? 6;
    this.onFailedAttempt = params.onFailedAttempt ?? defaultFailedAttemptHandler;
    const PQueue2 = "default" in import_p_queue4.default ? import_p_queue4.default.default : import_p_queue4.default;
    this.queue = new PQueue2({ concurrency: this.maxConcurrency });
  }
  async call(callable, ...args) {
    return this.queue.add(() => pRetry2(() => callable(...args).catch((error) => {
      if (error instanceof Error)
        throw error;
      else
        throw new Error(error);
    }), {
      onFailedAttempt: ({ error }) => this.onFailedAttempt?.(error),
      retries: this.maxRetries,
      randomize: true
    }), { throwOnTimeout: true });
  }
  callWithOptions(options, callable, ...args) {
    if (options.signal) {
      let listener;
      return Promise.race([this.call(callable, ...args), new Promise((_, reject) => {
        listener = () => {
          reject(getAbortSignalError(options.signal));
        };
        options.signal?.addEventListener("abort", listener, { once: true });
      })]).finally(() => {
        if (options.signal && listener)
          options.signal.removeEventListener("abort", listener);
      });
    }
    return this.call(callable, ...args);
  }
  fetch(...args) {
    return this.call(() => fetch(...args).then((res) => res.ok ? res : Promise.reject(res)));
  }
};

// ../../node_modules/@langchain/core/dist/tracers/root_listener.js
var RootListenersTracer = class extends BaseTracer {
  name = "RootListenersTracer";
  /** The Run's ID. Type UUID */
  rootId;
  config;
  argOnStart;
  argOnEnd;
  argOnError;
  constructor({ config: config2, onStart, onEnd, onError }) {
    super({ _awaitHandler: true });
    this.config = config2;
    this.argOnStart = onStart;
    this.argOnEnd = onEnd;
    this.argOnError = onError;
  }
  /**
  * This is a legacy method only called once for an entire run tree
  * therefore not useful here
  * @param {Run} _ Not used
  */
  persistRun(_) {
    return Promise.resolve();
  }
  async onRunCreate(run) {
    if (this.rootId)
      return;
    this.rootId = run.id;
    if (this.argOnStart)
      await this.argOnStart(run, this.config);
  }
  async onRunUpdate(run) {
    if (run.id !== this.rootId)
      return;
    if (!run.error) {
      if (this.argOnEnd)
        await this.argOnEnd(run, this.config);
    } else if (this.argOnError)
      await this.argOnError(run, this.config);
  }
};

// ../../node_modules/@langchain/core/dist/runnables/utils.js
function isRunnableInterface(thing) {
  return thing ? thing.lc_runnable : false;
}
var _RootEventFilter = class {
  includeNames;
  includeTypes;
  includeTags;
  excludeNames;
  excludeTypes;
  excludeTags;
  constructor(fields) {
    this.includeNames = fields.includeNames;
    this.includeTypes = fields.includeTypes;
    this.includeTags = fields.includeTags;
    this.excludeNames = fields.excludeNames;
    this.excludeTypes = fields.excludeTypes;
    this.excludeTags = fields.excludeTags;
  }
  includeEvent(event, rootType) {
    let include = this.includeNames === void 0 && this.includeTypes === void 0 && this.includeTags === void 0;
    const eventTags = event.tags ?? [];
    if (this.includeNames !== void 0)
      include = include || this.includeNames.includes(event.name);
    if (this.includeTypes !== void 0)
      include = include || this.includeTypes.includes(rootType);
    if (this.includeTags !== void 0)
      include = include || eventTags.some((tag) => this.includeTags?.includes(tag));
    if (this.excludeNames !== void 0)
      include = include && !this.excludeNames.includes(event.name);
    if (this.excludeTypes !== void 0)
      include = include && !this.excludeTypes.includes(rootType);
    if (this.excludeTags !== void 0)
      include = include && eventTags.every((tag) => !this.excludeTags?.includes(tag));
    return include;
  }
};
var toBase64Url = (str) => {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// ../../node_modules/zod/v4/core/core.js
var NEVER = Object.freeze({
  status: "aborted"
});
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer2, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _,
          traits: /* @__PURE__ */ new Set()
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer2(inst, def);
    const proto = _.prototype;
    const keys = Object.keys(proto);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a2;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var globalConfig = {};
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// ../../node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set = false;
  return {
    get value() {
      if (!set) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
var EVALUATING = Symbol("evaluating");
function defineLazy(object, key, getter) {
  let value = void 0;
  Object.defineProperty(object, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
var allowsEval = cached(() => {
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    const message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
    full.message = message;
  }
  delete full.inst;
  delete full.continue;
  if (!ctx?.reportInput) {
    delete full.input;
  }
  return full;
}

// ../../node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });

// ../../node_modules/zod/v4/core/parse.js
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);

// ../../node_modules/zod/v4/core/regexes.js
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);

// ../../node_modules/zod/v4/core/versions.js
var version2 = {
  major: 4,
  minor: 3,
  patch: 6
};

// ../../node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a2;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version2;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted2 = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted2) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted2)
              isAborted2 = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted2)
            isAborted2 = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});

// ../../node_modules/zod/v4/core/registries.js
var _a;
var $output = Symbol("ZodOutput");
var $input = Symbol("ZodInput");
var $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f3 = { ...pm, ...this._map.get(schema) };
      return Object.keys(f3).length ? f3 : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;

// ../../node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}

// ../../node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? void 0
  };
}
function process2(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a2;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema, result);
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process2(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema);
  if (meta)
    Object.assign(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && result.schema._prefault)
    (_a2 = result.schema).default ?? (_a2.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        Object.assign(schema2, refSchema);
      }
      Object.assign(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema2[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  process2(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};

// ../../node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
var stringProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format: format2, patterns, contentEncoding } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format2) {
    json.format = formatMap[format2] ?? format2;
    if (json.format === "")
      delete json.format;
    if (format2 === "time") {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const regexes = [...patterns];
    if (regexes.length === 1)
      json.pattern = regexes[0].source;
    else if (regexes.length > 1) {
      json.allOf = [
        ...regexes.map((regex2) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex2.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  const { minimum, maximum, format: format2, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
  if (typeof format2 === "string" && format2.includes("int"))
    json.type = "integer";
  else
    json.type = "number";
  if (typeof exclusiveMinimum === "number") {
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  }
  if (typeof minimum === "number") {
    json.minimum = minimum;
    if (typeof exclusiveMinimum === "number" && ctx.target !== "draft-04") {
      if (exclusiveMinimum >= minimum)
        delete json.minimum;
      else
        delete json.exclusiveMinimum;
    }
  }
  if (typeof exclusiveMaximum === "number") {
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  }
  if (typeof maximum === "number") {
    json.maximum = maximum;
    if (typeof exclusiveMaximum === "number" && ctx.target !== "draft-04") {
      if (exclusiveMaximum <= maximum)
        delete json.maximum;
      else
        delete json.exclusiveMaximum;
    }
  }
  if (typeof multipleOf === "number")
    json.multipleOf = multipleOf;
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var bigintProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("BigInt cannot be represented in JSON Schema");
  }
};
var symbolProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Symbols cannot be represented in JSON Schema");
  }
};
var nullProcessor = (_schema, ctx, json, _params) => {
  if (ctx.target === "openapi-3.0") {
    json.type = "string";
    json.nullable = true;
    json.enum = [null];
  } else {
    json.type = "null";
  }
};
var undefinedProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Undefined cannot be represented in JSON Schema");
  }
};
var voidProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Void cannot be represented in JSON Schema");
  }
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var anyProcessor = (_schema, _ctx, _json, _params) => {
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {
};
var dateProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Date cannot be represented in JSON Schema");
  }
};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var literalProcessor = (schema, ctx, json, _params) => {
  const def = schema._zod.def;
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Literal `undefined` cannot be represented in JSON Schema");
      } else {
      }
    } else if (typeof val === "bigint") {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      } else {
        vals.push(Number(val));
      }
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
var nanProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("NaN cannot be represented in JSON Schema");
  }
};
var templateLiteralProcessor = (schema, _ctx, json, _params) => {
  const _json = json;
  const pattern = schema._zod.pattern;
  if (!pattern)
    throw new Error("Pattern not found in template literal");
  _json.type = "string";
  _json.pattern = pattern.source;
};
var fileProcessor = (schema, _ctx, json, _params) => {
  const _json = json;
  const file = {
    type: "string",
    format: "binary",
    contentEncoding: "binary"
  };
  const { minimum, maximum, mime } = schema._zod.bag;
  if (minimum !== void 0)
    file.minLength = minimum;
  if (maximum !== void 0)
    file.maxLength = maximum;
  if (mime) {
    if (mime.length === 1) {
      file.contentMediaType = mime[0];
      Object.assign(_json, file);
    } else {
      Object.assign(_json, file);
      _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
    }
  } else {
    Object.assign(_json, file);
  }
};
var successProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var customProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
};
var functionProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Function types cannot be represented in JSON Schema");
  }
};
var transformProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Transforms cannot be represented in JSON Schema");
  }
};
var mapProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Map cannot be represented in JSON Schema");
  }
};
var setProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Set cannot be represented in JSON Schema");
  }
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = process2(def.element, ctx, { ...params, path: [...params.path, "items"] });
};
var objectProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  json.properties = {};
  const shape = def.shape;
  for (const key in shape) {
    json.properties[key] = process2(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key) => {
    const v = def.shape[key]._zod;
    if (ctx.io === "input") {
      return v.optin === void 0;
    } else {
      return v.optout === void 0;
    }
  }));
  if (requiredKeys.size > 0) {
    json.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = process2(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => process2(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = process2(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = process2(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
};
var tupleProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
  const prefixItems = def.items.map((x, i) => process2(x, ctx, {
    ...params,
    path: [...params.path, prefixPath, i]
  }));
  const rest = def.rest ? process2(def.rest, ctx, {
    ...params,
    path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
  }) : null;
  if (ctx.target === "draft-2020-12") {
    json.prefixItems = prefixItems;
    if (rest) {
      json.items = rest;
    }
  } else if (ctx.target === "openapi-3.0") {
    json.items = {
      anyOf: prefixItems
    };
    if (rest) {
      json.items.anyOf.push(rest);
    }
    json.minItems = prefixItems.length;
    if (!rest) {
      json.maxItems = prefixItems.length;
    }
  } else {
    json.items = prefixItems;
    if (rest) {
      json.additionalItems = rest;
    }
  }
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
};
var recordProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const keyBag = keyType._zod.bag;
  const patterns = keyBag?.patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = process2(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      json.patternProperties[pattern.source] = valueSchema;
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json.propertyNames = process2(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
    }
    json.additionalProperties = process2(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  if (keyValues) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues;
    }
  }
};
var nullableProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var defaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
var prefaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io === "input")
    json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
var catchProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const innerType = ctx.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
  process2(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var promiseProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  process2(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var allProcessors = {
  string: stringProcessor,
  number: numberProcessor,
  boolean: booleanProcessor,
  bigint: bigintProcessor,
  symbol: symbolProcessor,
  null: nullProcessor,
  undefined: undefinedProcessor,
  void: voidProcessor,
  never: neverProcessor,
  any: anyProcessor,
  unknown: unknownProcessor,
  date: dateProcessor,
  enum: enumProcessor,
  literal: literalProcessor,
  nan: nanProcessor,
  template_literal: templateLiteralProcessor,
  file: fileProcessor,
  success: successProcessor,
  custom: customProcessor,
  function: functionProcessor,
  transform: transformProcessor,
  map: mapProcessor,
  set: setProcessor,
  array: arrayProcessor,
  object: objectProcessor,
  union: unionProcessor,
  intersection: intersectionProcessor,
  tuple: tupleProcessor,
  record: recordProcessor,
  nullable: nullableProcessor,
  nonoptional: nonoptionalProcessor,
  default: defaultProcessor,
  prefault: prefaultProcessor,
  catch: catchProcessor,
  pipe: pipeProcessor,
  readonly: readonlyProcessor,
  promise: promiseProcessor,
  optional: optionalProcessor,
  lazy: lazyProcessor
};
function toJSONSchema(input, params) {
  if ("_idmap" in input) {
    const registry2 = input;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_, schema] = entry;
      process2(schema, ctx2);
    }
    const schemas = {};
    const external = {
      registry: registry2,
      uri: params?.uri,
      defs
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      schemas[key] = finalize(ctx2, schema);
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  process2(input, ctx);
  extractDefs(ctx, input);
  return finalize(ctx, input);
}

// ../../node_modules/@langchain/core/dist/utils/types/zod.js
function isZodSchemaV4(schema) {
  if (typeof schema !== "object" || schema === null)
    return false;
  const obj = schema;
  if (!("_zod" in obj))
    return false;
  const zod = obj._zod;
  return typeof zod === "object" && zod !== null && "def" in zod;
}
function isZodSchemaV3(schema) {
  if (typeof schema !== "object" || schema === null)
    return false;
  const obj = schema;
  if (!("_def" in obj) || "_zod" in obj)
    return false;
  const def = obj._def;
  return typeof def === "object" && def != null && "typeName" in def;
}
function isInteropZodSchema(input) {
  if (!input)
    return false;
  if (typeof input !== "object")
    return false;
  if (Array.isArray(input))
    return false;
  if (isZodSchemaV4(input) || isZodSchemaV3(input))
    return true;
  return false;
}
async function interopParseAsync(schema, input) {
  if (isZodSchemaV4(schema))
    return await parseAsync(schema, input);
  if (isZodSchemaV3(schema))
    return await schema.parseAsync(input);
  throw new Error("Schema must be an instance of z3.ZodType or z4.$ZodType");
}
function getSchemaDescription(schema) {
  if (isZodSchemaV4(schema))
    return globalRegistry.get(schema)?.description;
  if (isZodSchemaV3(schema))
    return schema.description;
  if ("description" in schema && typeof schema.description === "string")
    return schema.description;
}
function isSimpleStringZodSchema(schema) {
  if (!isInteropZodSchema(schema))
    return false;
  if (isZodSchemaV3(schema))
    return schema._def.typeName === "ZodString";
  if (isZodSchemaV4(schema))
    return schema._zod.def.type === "string";
  return false;
}
function isZodObjectV3(obj) {
  if (typeof obj === "object" && obj !== null && "_def" in obj && typeof obj._def === "object" && obj._def !== null && "typeName" in obj._def && obj._def.typeName === "ZodObject")
    return true;
  return false;
}
function isZodObjectV4(obj) {
  if (!isZodSchemaV4(obj))
    return false;
  if (typeof obj === "object" && obj !== null && "_zod" in obj && typeof obj._zod === "object" && obj._zod !== null && "def" in obj._zod && typeof obj._zod.def === "object" && obj._zod.def !== null && "type" in obj._zod.def && obj._zod.def.type === "object")
    return true;
  return false;
}
function isZodArrayV4(obj) {
  if (!isZodSchemaV4(obj))
    return false;
  if (typeof obj === "object" && obj !== null && "_zod" in obj && typeof obj._zod === "object" && obj._zod !== null && "def" in obj._zod && typeof obj._zod.def === "object" && obj._zod.def !== null && "type" in obj._zod.def && obj._zod.def.type === "array")
    return true;
  return false;
}
function isZodOptionalV4(obj) {
  if (!isZodSchemaV4(obj))
    return false;
  if (typeof obj === "object" && obj !== null && "_zod" in obj && typeof obj._zod === "object" && obj._zod !== null && "def" in obj._zod && typeof obj._zod.def === "object" && obj._zod.def !== null && "type" in obj._zod.def && obj._zod.def.type === "optional")
    return true;
  return false;
}
function isZodNullableV4(obj) {
  if (!isZodSchemaV4(obj))
    return false;
  if (typeof obj === "object" && obj !== null && "_zod" in obj && typeof obj._zod === "object" && obj._zod !== null && "def" in obj._zod && typeof obj._zod.def === "object" && obj._zod.def !== null && "type" in obj._zod.def && obj._zod.def.type === "nullable")
    return true;
  return false;
}
function interopZodObjectStrict(schema, recursive = false) {
  if (isZodObjectV3(schema))
    return schema.strict();
  if (isZodObjectV4(schema)) {
    const outputShape = schema._zod.def.shape;
    if (recursive)
      for (const [key, keySchema] of Object.entries(schema._zod.def.shape)) {
        if (isZodObjectV4(keySchema))
          outputShape[key] = interopZodObjectStrict(keySchema, recursive);
        else if (isZodArrayV4(keySchema)) {
          let elementSchema = keySchema._zod.def.element;
          if (isZodObjectV4(elementSchema))
            elementSchema = interopZodObjectStrict(elementSchema, recursive);
          outputShape[key] = clone(keySchema, {
            ...keySchema._zod.def,
            element: elementSchema
          });
        } else
          outputShape[key] = keySchema;
        const meta2 = globalRegistry.get(keySchema);
        if (meta2)
          globalRegistry.add(outputShape[key], meta2);
      }
    const modifiedSchema = clone(schema, {
      ...schema._zod.def,
      shape: outputShape,
      catchall: _never($ZodNever)
    });
    const meta = globalRegistry.get(schema);
    if (meta)
      globalRegistry.add(modifiedSchema, meta);
    return modifiedSchema;
  }
  throw new Error("Schema must be an instance of z3.ZodObject or z4.$ZodObject");
}
function isZodTransformV3(schema) {
  return isZodSchemaV3(schema) && "typeName" in schema._def && schema._def.typeName === "ZodEffects";
}
function isZodTransformV4(schema) {
  return isZodSchemaV4(schema) && schema._zod.def.type === "pipe";
}
function interopZodTransformInputSchemaImpl(schema, recursive, cache) {
  const cached2 = cache.get(schema);
  if (cached2 !== void 0)
    return cached2;
  if (isZodSchemaV3(schema)) {
    if (isZodTransformV3(schema))
      return interopZodTransformInputSchemaImpl(schema._def.schema, recursive, cache);
    return schema;
  }
  if (isZodSchemaV4(schema)) {
    let outputSchema = schema;
    if (isZodTransformV4(schema))
      outputSchema = interopZodTransformInputSchemaImpl(schema._zod.def.in, recursive, cache);
    if (recursive) {
      if (isZodObjectV4(outputSchema)) {
        const outputShape = {};
        for (const [key, keySchema] of Object.entries(outputSchema._zod.def.shape))
          outputShape[key] = interopZodTransformInputSchemaImpl(keySchema, recursive, cache);
        outputSchema = clone(outputSchema, {
          ...outputSchema._zod.def,
          shape: outputShape
        });
      } else if (isZodArrayV4(outputSchema)) {
        const elementSchema = interopZodTransformInputSchemaImpl(outputSchema._zod.def.element, recursive, cache);
        outputSchema = clone(outputSchema, {
          ...outputSchema._zod.def,
          element: elementSchema
        });
      } else if (isZodOptionalV4(outputSchema)) {
        const innerSchema = interopZodTransformInputSchemaImpl(outputSchema._zod.def.innerType, recursive, cache);
        outputSchema = clone(outputSchema, {
          ...outputSchema._zod.def,
          innerType: innerSchema
        });
      } else if (isZodNullableV4(outputSchema)) {
        const innerSchema = interopZodTransformInputSchemaImpl(outputSchema._zod.def.innerType, recursive, cache);
        outputSchema = clone(outputSchema, {
          ...outputSchema._zod.def,
          innerType: innerSchema
        });
      }
    }
    const meta = globalRegistry.get(schema);
    if (meta)
      globalRegistry.add(outputSchema, meta);
    cache.set(schema, outputSchema);
    return outputSchema;
  }
  throw new Error("Schema must be an instance of z3.ZodType or z4.$ZodType");
}
function interopZodTransformInputSchema(schema, recursive = false) {
  return interopZodTransformInputSchemaImpl(schema, recursive, /* @__PURE__ */ new WeakMap());
}

// ../../node_modules/@langchain/core/dist/runnables/graph_mermaid.js
function _escapeNodeLabel(nodeLabel) {
  return nodeLabel.replace(/[^a-zA-Z-_0-9]/g, "_");
}
var MARKDOWN_SPECIAL_CHARS = [
  "*",
  "_",
  "`"
];
function _generateMermaidGraphStyles(nodeColors) {
  let styles2 = "";
  for (const [className, color2] of Object.entries(nodeColors))
    styles2 += `	classDef ${className} ${color2};
`;
  return styles2;
}
function drawMermaid(nodes, edges, config2) {
  const { firstNode, lastNode, nodeColors, withStyles = true, curveStyle = "linear", wrapLabelNWords = 9 } = config2 ?? {};
  let mermaidGraph = withStyles ? `%%{init: {'flowchart': {'curve': '${curveStyle}'}}}%%
graph TD;
` : "graph TD;\n";
  if (withStyles) {
    const defaultClassLabel = "default";
    const formatDict = { [defaultClassLabel]: "{0}({1})" };
    if (firstNode !== void 0)
      formatDict[firstNode] = "{0}([{1}]):::first";
    if (lastNode !== void 0)
      formatDict[lastNode] = "{0}([{1}]):::last";
    for (const [key, node] of Object.entries(nodes)) {
      const nodeName = node.name.split(":").pop() ?? "";
      let finalLabel = MARKDOWN_SPECIAL_CHARS.some((char) => nodeName.startsWith(char) && nodeName.endsWith(char)) ? `<p>${nodeName}</p>` : nodeName;
      if (Object.keys(node.metadata ?? {}).length)
        finalLabel += `<hr/><small><em>${Object.entries(node.metadata ?? {}).map(([k, v]) => `${k} = ${v}`).join("\n")}</em></small>`;
      const nodeLabel = (formatDict[key] ?? formatDict[defaultClassLabel]).replace("{0}", _escapeNodeLabel(key)).replace("{1}", finalLabel);
      mermaidGraph += `	${nodeLabel}
`;
    }
  }
  const edgeGroups = {};
  for (const edge of edges) {
    const srcParts = edge.source.split(":");
    const tgtParts = edge.target.split(":");
    const commonPrefix = srcParts.filter((src, i) => src === tgtParts[i]).join(":");
    if (!edgeGroups[commonPrefix])
      edgeGroups[commonPrefix] = [];
    edgeGroups[commonPrefix].push(edge);
  }
  const seenSubgraphs = /* @__PURE__ */ new Set();
  function sortPrefixesByDepth(prefixes) {
    return [...prefixes].sort((a, b) => {
      return a.split(":").length - b.split(":").length;
    });
  }
  function addSubgraph(edges2, prefix) {
    const selfLoop = edges2.length === 1 && edges2[0].source === edges2[0].target;
    if (prefix && !selfLoop) {
      const subgraph = prefix.split(":").pop();
      if (seenSubgraphs.has(prefix))
        throw new Error(`Found duplicate subgraph '${subgraph}' at '${prefix} -- this likely means that you're reusing a subgraph node with the same name. Please adjust your graph to have subgraph nodes with unique names.`);
      seenSubgraphs.add(prefix);
      mermaidGraph += `	subgraph ${subgraph}
`;
    }
    const nestedPrefixes = sortPrefixesByDepth(Object.keys(edgeGroups).filter((nestedPrefix) => nestedPrefix.startsWith(`${prefix}:`) && nestedPrefix !== prefix && nestedPrefix.split(":").length === prefix.split(":").length + 1));
    for (const nestedPrefix of nestedPrefixes)
      addSubgraph(edgeGroups[nestedPrefix], nestedPrefix);
    for (const edge of edges2) {
      const { source, target, data, conditional } = edge;
      let edgeLabel = "";
      if (data !== void 0) {
        let edgeData = data;
        const words = edgeData.split(" ");
        if (words.length > wrapLabelNWords)
          edgeData = Array.from({ length: Math.ceil(words.length / wrapLabelNWords) }, (_, i) => words.slice(i * wrapLabelNWords, (i + 1) * wrapLabelNWords).join(" ")).join("&nbsp;<br>&nbsp;");
        edgeLabel = conditional ? ` -. &nbsp;${edgeData}&nbsp; .-> ` : ` -- &nbsp;${edgeData}&nbsp; --> `;
      } else
        edgeLabel = conditional ? " -.-> " : " --> ";
      mermaidGraph += `	${_escapeNodeLabel(source)}${edgeLabel}${_escapeNodeLabel(target)};
`;
    }
    if (prefix && !selfLoop)
      mermaidGraph += "	end\n";
  }
  addSubgraph(edgeGroups[""] ?? [], "");
  for (const prefix in edgeGroups)
    if (!prefix.includes(":") && prefix !== "")
      addSubgraph(edgeGroups[prefix], prefix);
  if (withStyles)
    mermaidGraph += _generateMermaidGraphStyles(nodeColors ?? {});
  return mermaidGraph;
}
async function drawMermaidImage(mermaidSyntax, config2) {
  let backgroundColor = config2?.backgroundColor ?? "white";
  const imageType = config2?.imageType ?? "png";
  const mermaidSyntaxEncoded = toBase64Url(mermaidSyntax);
  if (backgroundColor !== void 0) {
    if (!/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(backgroundColor))
      backgroundColor = `!${backgroundColor}`;
  }
  const imageUrl = `https://mermaid.ink/img/${mermaidSyntaxEncoded}?bgColor=${backgroundColor}&type=${imageType}`;
  const res = await fetch(imageUrl);
  if (!res.ok)
    throw new Error([
      `Failed to render the graph using the Mermaid.INK API.`,
      `Status code: ${res.status}`,
      `Status text: ${res.statusText}`
    ].join("\n"));
  return await res.blob();
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions2 = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
  ...defaultOptions2,
  name: options
} : {
  ...defaultOptions2,
  ...options
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/Refs.js
var getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== void 0 ? [
    ..._options.basePath,
    _options.definitionPath,
    _options.name
  ] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: false },
    currentPath,
    propertyPath: void 0,
    seen: new Map(Object.entries(_options.definitions).map(([name, def]) => [def._def, {
      def: def._def,
      path: [
        ..._options.basePath,
        _options.definitionPath,
        name
      ],
      jsonSchema: void 0
    }]))
  };
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/getRelativePath.js
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length; i++)
    if (pathA[i] !== pathB[i])
      break;
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/any.js
function parseAnyDef(refs) {
  if (refs.target !== "openAi")
    return {};
  const anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  refs.flags.hasReferencedOpenAiAnyType = true;
  return { $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/") };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/errorMessages.js
function addErrorMessage(res, key, errorMessage, refs) {
  if (!refs?.errorMessages)
    return;
  if (errorMessage)
    res.errorMessage = {
      ...res.errorMessage,
      [key]: errorMessage
    };
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value;
  addErrorMessage(res, key, errorMessage, refs);
}

// ../../node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER2,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default2,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// ../../node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr2, checker) => {
    for (const item of arr2) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues2(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues2;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue2) {
      return issue2.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue2 of error.issues) {
        if (issue2.code === "invalid_union") {
          issue2.unionErrors.map(processError);
        } else if (issue2.code === "invalid_return_type") {
          processError(issue2.returnTypeError);
        } else if (issue2.code === "invalid_arguments") {
          processError(issue2.argumentsError);
        } else if (issue2.path.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue2.path.length) {
            const el = issue2.path[i];
            const terminal = i === issue2.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue2) => issue2.message) {
    const fieldErrors = /* @__PURE__ */ Object.create(null);
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/zod/v3/locales/en.js
var errorMap = (issue2, _ctx) => {
  let message;
  switch (issue2.code) {
    case ZodIssueCode.invalid_type:
      if (issue2.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue2.expected}, received ${issue2.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue2.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue2.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue2.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue2.options)}, received '${issue2.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue2.validation === "object") {
        if ("includes" in issue2.validation) {
          message = `Invalid input: must include "${issue2.validation.includes}"`;
          if (typeof issue2.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue2.validation.position}`;
          }
        } else if ("startsWith" in issue2.validation) {
          message = `Invalid input: must start with "${issue2.validation.startsWith}"`;
        } else if ("endsWith" in issue2.validation) {
          message = `Invalid input: must end with "${issue2.validation.endsWith}"`;
        } else {
          util.assertNever(issue2.validation);
        }
      } else if (issue2.validation !== "regex") {
        message = `Invalid ${issue2.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue2.type === "array")
        message = `Array must contain ${issue2.exact ? "exactly" : issue2.inclusive ? `at least` : `more than`} ${issue2.minimum} element(s)`;
      else if (issue2.type === "string")
        message = `String must contain ${issue2.exact ? "exactly" : issue2.inclusive ? `at least` : `over`} ${issue2.minimum} character(s)`;
      else if (issue2.type === "number")
        message = `Number must be ${issue2.exact ? `exactly equal to ` : issue2.inclusive ? `greater than or equal to ` : `greater than `}${issue2.minimum}`;
      else if (issue2.type === "bigint")
        message = `Number must be ${issue2.exact ? `exactly equal to ` : issue2.inclusive ? `greater than or equal to ` : `greater than `}${issue2.minimum}`;
      else if (issue2.type === "date")
        message = `Date must be ${issue2.exact ? `exactly equal to ` : issue2.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue2.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue2.type === "array")
        message = `Array must contain ${issue2.exact ? `exactly` : issue2.inclusive ? `at most` : `less than`} ${issue2.maximum} element(s)`;
      else if (issue2.type === "string")
        message = `String must contain ${issue2.exact ? `exactly` : issue2.inclusive ? `at most` : `under`} ${issue2.maximum} character(s)`;
      else if (issue2.type === "number")
        message = `Number must be ${issue2.exact ? `exactly` : issue2.inclusive ? `less than or equal to` : `less than`} ${issue2.maximum}`;
      else if (issue2.type === "bigint")
        message = `BigInt must be ${issue2.exact ? `exactly` : issue2.inclusive ? `less than or equal to` : `less than`} ${issue2.maximum}`;
      else if (issue2.type === "date")
        message = `Date must be ${issue2.exact ? `exactly` : issue2.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue2.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue2.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue2);
  }
  return { message };
};
var en_default2 = errorMap;

// ../../node_modules/zod/v3/errors.js
var overrideErrorMap = en_default2;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// ../../node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path3, errorMaps, issueData } = params;
  const fullPath = [...path3, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue2 = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default2 ? void 0 : en_default2
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue2);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path3, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path3;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex2 = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex2 = `${regex2}(${opts.join("|")})`;
  return new RegExp(`^${regex2}$`);
}
function isValidIP(ip, version3) {
  if ((version3 === "v4" || !version3) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version3 === "v6" || !version3) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base643 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base643));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version3) {
  if ((version3 === "v4" || !version3) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version3 === "v6" || !version3) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex2 = datetimeRegex(check);
        if (!regex2.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex2 = dateRegex;
        if (!regex2.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex2 = timeRegex(check);
        if (!regex2.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex2, validation, message) {
    return this.refinement((data) => regex2.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex2, message) {
    return this._addCheck({
      kind: "regex",
      regex: regex2,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder2(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder2(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue2, ctx) => {
          const defaultError = this._def.errorMap?.(issue2, ctx).message ?? ctx.defaultError;
          if (issue2.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default2].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType2 = this._getType(input);
    if (parsedType2 !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER2 = INVALID;

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/array.js
function parseArrayDef(def, refs) {
  const res = { type: "array" };
  if (def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny)
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  if (def.minLength)
    setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
  if (def.maxLength)
    setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
  if (def.exactLength) {
    setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
    setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
  }
  return res;
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/bigint.js
function parseBigintDef(def, refs) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks)
    switch (check.kind) {
      case "min":
        if (refs.target === "jsonSchema7")
          if (check.inclusive)
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          else
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
        else {
          if (!check.inclusive)
            res.exclusiveMinimum = true;
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7")
          if (check.inclusive)
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          else
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
        else {
          if (!check.inclusive)
            res.exclusiveMaximum = true;
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  return res;
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/boolean.js
function parseBooleanDef() {
  return { type: "boolean" };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/branded.js
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/catch.js
var parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/date.js
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy))
    return { anyOf: strategy.map((item) => parseDateDef(def, refs, item)) };
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
var integerDateParser = (def, refs) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3")
    return res;
  for (const check of def.checks)
    switch (check.kind) {
      case "min":
        setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        break;
      case "max":
        setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        break;
    }
  return res;
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/default.js
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/effects.js
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/enum.js
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/intersection.js
var isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string")
    return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [parseDef(def.left._def, {
    ...refs,
    currentPath: [
      ...refs.currentPath,
      "allOf",
      "0"
    ]
  }), parseDef(def.right._def, {
    ...refs,
    currentPath: [
      ...refs.currentPath,
      "allOf",
      "1"
    ]
  })].filter((x) => !!x);
  let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : void 0;
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
      if (schema.unevaluatedProperties === void 0)
        unevaluatedProperties = void 0;
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else
        unevaluatedProperties = void 0;
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : void 0;
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/literal.js
function parseLiteralDef(def, refs) {
  const parsedType2 = typeof def.value;
  if (parsedType2 !== "bigint" && parsedType2 !== "number" && parsedType2 !== "boolean" && parsedType2 !== "string")
    return { type: Array.isArray(def.value) ? "array" : "object" };
  if (refs.target === "openApi3")
    return {
      type: parsedType2 === "bigint" ? "integer" : parsedType2,
      enum: [def.value]
    };
  return {
    type: parsedType2 === "bigint" ? "integer" : parsedType2,
    const: def.value
  };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/string.js
var emojiRegex2 = void 0;
var zodPatterns = {
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  emoji: () => {
    if (emojiRegex2 === void 0)
      emojiRegex2 = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
    return emojiRegex2;
  },
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = { type: "string" };
  if (def.checks)
    for (const check of def.checks)
      switch (check.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "includes":
          addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
          break;
        case "ip":
          if (check.version !== "v6")
            addFormat(res, "ipv4", check.message, refs);
          if (check.version !== "v4")
            addFormat(res, "ipv6", check.message, refs);
          break;
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr":
          if (check.version !== "v6")
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          if (check.version !== "v4")
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          break;
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid":
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        case "base64":
          switch (refs.base64Strategy) {
            case "format:binary":
              addFormat(res, "binary", check.message, refs);
              break;
            case "contentEncoding:base64":
              setResponseValueAndErrors(res, "contentEncoding", "base64", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
          }
          break;
        case "nanoid":
          addPattern(res, zodPatterns.nanoid, check.message, refs);
          break;
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
          /* @__PURE__ */ ((_) => {
          })(check);
      }
  return res;
}
function escapeLiteralCheckValue(literal, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = /* @__PURE__ */ new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0; i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i]))
      result += "\\";
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  if (schema.format || schema.anyOf?.some((x) => x.format)) {
    if (!schema.anyOf)
      schema.anyOf = [];
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format,
        ...schema.errorMessage && refs.errorMessages && { errorMessage: { format: schema.errorMessage.format } }
      });
      delete schema.format;
      if (schema.errorMessage) {
        delete schema.errorMessage.format;
        if (Object.keys(schema.errorMessage).length === 0)
          delete schema.errorMessage;
      }
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else
    setResponseValueAndErrors(schema, "format", value, message, refs);
}
function addPattern(schema, regex2, message, refs) {
  if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
    if (!schema.allOf)
      schema.allOf = [];
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern,
        ...schema.errorMessage && refs.errorMessages && { errorMessage: { pattern: schema.errorMessage.pattern } }
      });
      delete schema.pattern;
      if (schema.errorMessage) {
        delete schema.errorMessage.pattern;
        if (Object.keys(schema.errorMessage).length === 0)
          delete schema.errorMessage;
      }
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex2, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else
    setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex2, refs), message, refs);
}
function stringifyRegExpWithFlags(regex2, refs) {
  if (!refs.applyRegexFlags || !regex2.flags)
    return regex2.source;
  const flags = {
    i: regex2.flags.includes("i"),
    m: regex2.flags.includes("m"),
    s: regex2.flags.includes("s")
  };
  const source = flags.i ? regex2.source.toLowerCase() : regex2.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/)) {
            pattern += source[i];
            inCharRange = true;
          } else
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\")
      isEscaped = true;
    else if (inCharGroup && source[i] === "]")
      inCharGroup = false;
    else if (!inCharGroup && source[i] === "[")
      inCharGroup = true;
  }
  try {
    new RegExp(pattern);
  } catch {
    console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
    return regex2.source;
  }
  return pattern;
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/record.js
function parseRecordDef(def, refs) {
  if (refs.target === "openAi")
    console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.");
  if (refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum)
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [
            ...refs.currentPath,
            "properties",
            key
          ]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  const schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3")
    return schema;
  if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.checks?.length) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum)
    return {
      ...schema,
      propertyNames: { enum: def.keyType._def.values }
    };
  else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.type._def.checks?.length) {
    const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/map.js
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record")
    return parseRecordDef(def, refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [parseDef(def.keyType._def, {
        ...refs,
        currentPath: [
          ...refs.currentPath,
          "items",
          "items",
          "0"
        ]
      }) || parseAnyDef(refs), parseDef(def.valueType._def, {
        ...refs,
        currentPath: [
          ...refs.currentPath,
          "items",
          "items",
          "1"
        ]
      }) || parseAnyDef(refs)],
      minItems: 2,
      maxItems: 2
    }
  };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/nativeEnum.js
function parseNativeEnumDef(def) {
  const object = def.values;
  const actualValues = Object.keys(def.values).filter((key) => {
    return typeof object[object[key]] !== "number";
  }).map((key) => object[key]);
  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/never.js
function parseNeverDef(refs) {
  return refs.target === "openAi" ? void 0 : { not: parseAnyDef({
    ...refs,
    currentPath: [...refs.currentPath, "not"]
  }) };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/null.js
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: true
  } : { type: "null" };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/union.js
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return { type: types.length > 1 ? types : types[0] };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce((acc, x) => {
      const type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
          return acc;
        default:
          return acc;
      }
    }, []);
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum"))
    return {
      type: "string",
      enum: options.reduce((acc, x) => [...acc, ...x._def.values.filter((x2) => !acc.includes(x2))], [])
    };
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [
      ...refs.currentPath,
      "anyOf",
      `${i}`
    ]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : void 0;
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/nullable.js
function parseNullableDef(def, refs) {
  if ([
    "ZodString",
    "ZodNumber",
    "ZodBigInt",
    "ZodBoolean",
    "ZodNull"
  ].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    if (refs.target === "openApi3")
      return {
        type: primitiveMappings[def.innerType._def.typeName],
        nullable: true
      };
    return { type: [primitiveMappings[def.innerType._def.typeName], "null"] };
  }
  if (refs.target === "openApi3") {
    const base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    if (base2 && "$ref" in base2)
      return {
        allOf: [base2],
        nullable: true
      };
    return base2 && {
      ...base2,
      nullable: true
    };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [
      ...refs.currentPath,
      "anyOf",
      "0"
    ]
  });
  return base && { anyOf: [base, { type: "null" }] };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/number.js
function parseNumberDef(def, refs) {
  const res = { type: "number" };
  if (!def.checks)
    return res;
  for (const check of def.checks)
    switch (check.kind) {
      case "int":
        res.type = "integer";
        addErrorMessage(res, "type", check.message, refs);
        break;
      case "min":
        if (refs.target === "jsonSchema7")
          if (check.inclusive)
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          else
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
        else {
          if (!check.inclusive)
            res.exclusiveMinimum = true;
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7")
          if (check.inclusive)
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          else
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
        else {
          if (!check.inclusive)
            res.exclusiveMaximum = true;
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  return res;
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/object.js
function parseObjectDef(def, refs) {
  const forceOptionalIntoNullable = refs.target === "openAi";
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0)
      continue;
    let propOptional = safeIsOptional(propDef);
    if (propOptional && forceOptionalIntoNullable) {
      if (propDef._def.typeName === "ZodOptional")
        propDef = propDef._def.innerType;
      if (!propDef.isNullable())
        propDef = propDef.nullable();
      propOptional = false;
    }
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [
        ...refs.currentPath,
        "properties",
        propName
      ],
      propertyPath: [
        ...refs.currentPath,
        "properties",
        propName
      ]
    });
    if (parsedDef === void 0)
      continue;
    result.properties[propName] = parsedDef;
    if (!propOptional)
      required.push(propName);
  }
  if (required.length)
    result.required = required;
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0)
    result.additionalProperties = additionalProperties;
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever")
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return true;
  }
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/optional.js
var parseOptionalDef = (def, refs) => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString())
    return parseDef(def.innerType._def, refs);
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [
      ...refs.currentPath,
      "anyOf",
      "1"
    ]
  });
  return innerSchema ? { anyOf: [{ not: parseAnyDef(refs) }, innerSchema] } : parseAnyDef(refs);
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/pipeline.js
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input")
    return parseDef(def.in._def, refs);
  else if (refs.pipeStrategy === "output")
    return parseDef(def.out._def, refs);
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [
      ...refs.currentPath,
      "allOf",
      "0"
    ]
  });
  return { allOf: [a, parseDef(def.out._def, {
    ...refs,
    currentPath: [
      ...refs.currentPath,
      "allOf",
      a ? "1" : "0"
    ]
  })].filter((x) => x !== void 0) };
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/promise.js
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/set.js
function parseSetDef(def, refs) {
  const schema = {
    type: "array",
    uniqueItems: true,
    items: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    })
  };
  if (def.minSize)
    setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
  if (def.maxSize)
    setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
  return schema;
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/tuple.js
function parseTupleDef(def, refs) {
  if (def.rest)
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [
          ...refs.currentPath,
          "items",
          `${i}`
        ]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  else
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [
          ...refs.currentPath,
          "items",
          `${i}`
        ]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
    };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/undefined.js
function parseUndefinedDef(refs) {
  return { not: parseAnyDef(refs) };
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/unknown.js
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parsers/readonly.js
var parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/selectParser.js
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return;
    default:
      return ((_) => void 0)(typeName);
  }
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/parseDef.js
function parseDef(def, refs, forceResolution = false) {
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride)
      return overrideResult;
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0)
      return seenSchema;
  }
  const newItem = {
    def,
    path: refs.currentPath,
    jsonSchema: void 0
  };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema)
    addMeta(def, refs, jsonSchema);
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema, def, refs);
    newItem.jsonSchema = jsonSchema;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema;
  return jsonSchema;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen":
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
        return parseAnyDef(refs);
      }
      return refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
  }
};
var addMeta = (def, refs, jsonSchema) => {
  if (def.description) {
    jsonSchema.description = def.description;
    if (refs.markdownDescription)
      jsonSchema.markdownDescription = def.description;
  }
  return jsonSchema;
};

// ../../node_modules/@langchain/core/dist/utils/zod-to-json-schema/zodToJsonSchema.js
var zodToJsonSchema = (schema, options) => {
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name2, schema2]) => ({
    ...acc,
    [name2]: parseDef(schema2._def, {
      ...refs,
      currentPath: [
        ...refs.basePath,
        refs.definitionPath,
        name2
      ]
    }, true) ?? parseAnyDef(refs)
  }), {}) : void 0;
  const name = typeof options === "string" ? options : options?.nameStrategy === "title" ? void 0 : options?.name;
  const main = parseDef(schema._def, name === void 0 ? refs : {
    ...refs,
    currentPath: [
      ...refs.basePath,
      refs.definitionPath,
      name
    ]
  }, false) ?? parseAnyDef(refs);
  const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
  if (title !== void 0)
    main.title = title;
  if (refs.flags.hasReferencedOpenAiAnyType) {
    if (!definitions)
      definitions = {};
    if (!definitions[refs.openAiAnyTypeName])
      definitions[refs.openAiAnyTypeName] = {
        type: [
          "string",
          "number",
          "integer",
          "boolean",
          "array",
          "null"
        ],
        items: { $ref: refs.$refStrategy === "relative" ? "1" : [
          ...refs.basePath,
          refs.definitionPath,
          refs.openAiAnyTypeName
        ].join("/") }
      };
  }
  const combined = name === void 0 ? definitions ? {
    ...main,
    [refs.definitionPath]: definitions
  } : main : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name]: main
    }
  };
  if (refs.target === "jsonSchema7")
    combined.$schema = "http://json-schema.org/draft-07/schema#";
  else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi")
    combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
  if (refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type)))
    console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.");
  return combined;
};

// ../../node_modules/@langchain/core/dist/utils/standard_schema.js
function isStandardJsonSchema(schema) {
  return (typeof schema === "object" || typeof schema === "function") && schema !== null && "~standard" in schema && typeof schema["~standard"] === "object" && schema["~standard"] !== null && "jsonSchema" in schema["~standard"];
}

// ../../node_modules/@cfworker/json-schema/dist/esm/dereference.js
var initialBaseURI = typeof self !== "undefined" && self.location && self.location.origin !== "null" ? new URL(self.location.origin + self.location.pathname + location.search) : new URL("https://github.com/cfworker");

// ../../node_modules/@cfworker/json-schema/dist/esm/format.js
var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
var URL_ = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
var EMAIL = (input) => {
  if (input[0] === '"')
    return false;
  const [name, host, ...rest] = input.split("@");
  if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253)
    return false;
  if (name[0] === "." || name.endsWith(".") || name.includes(".."))
    return false;
  if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name))
    return false;
  return host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
};
var IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
var IPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
var DURATION = (input) => input.length > 1 && input.length < 80 && (/^P\d+([.,]\d+)?W$/.test(input) || /^P[\dYMDTHS]*(\d[.,]\d+)?[YMDHS]$/.test(input) && /^P([.,\d]+Y)?([.,\d]+M)?([.,\d]+D)?(T([.,\d]+H)?([.,\d]+M)?([.,\d]+S)?)?$/.test(input));
function bind(r) {
  return r.test.bind(r);
}
var format = {
  date: date2,
  time: time2.bind(void 0, false),
  "date-time": date_time,
  duration: DURATION,
  uri,
  "uri-reference": bind(URIREF),
  "uri-template": bind(URITEMPLATE),
  url: bind(URL_),
  email: EMAIL,
  hostname: bind(HOSTNAME),
  ipv4: bind(IPV4),
  ipv6: bind(IPV6),
  regex,
  uuid: bind(UUID),
  "json-pointer": bind(JSON_POINTER),
  "json-pointer-uri-fragment": bind(JSON_POINTER_URI_FRAGMENT),
  "relative-json-pointer": bind(RELATIVE_JSON_POINTER)
};
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function date2(str) {
  const matches = str.match(DATE);
  if (!matches)
    return false;
  const year = +matches[1];
  const month = +matches[2];
  const day = +matches[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
function time2(full, str) {
  const matches = str.match(TIME);
  if (!matches)
    return false;
  const hour = +matches[1];
  const minute = +matches[2];
  const second = +matches[3];
  const timeZone = !!matches[5];
  return (hour <= 23 && minute <= 59 && second <= 59 || hour == 23 && minute == 59 && second == 60) && (!full || timeZone);
}
var DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
  const dateTime = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length == 2 && date2(dateTime[0]) && time2(true, dateTime[1]);
}
var NOT_URI_FRAGMENT = /\/|:/;
var URI_PATTERN = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
  return NOT_URI_FRAGMENT.test(str) && URI_PATTERN.test(str);
}
var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str))
    return false;
  try {
    new RegExp(str, "u");
    return true;
  } catch (e) {
    return false;
  }
}

// ../../node_modules/@cfworker/json-schema/dist/esm/types.js
var OutputFormat;
(function(OutputFormat2) {
  OutputFormat2[OutputFormat2["Flag"] = 1] = "Flag";
  OutputFormat2[OutputFormat2["Basic"] = 2] = "Basic";
  OutputFormat2[OutputFormat2["Detailed"] = 4] = "Detailed";
})(OutputFormat || (OutputFormat = {}));

// ../../node_modules/@langchain/core/dist/utils/json_schema.js
var _jsonSchemaCache = /* @__PURE__ */ new WeakMap();
function toJsonSchema(schema, params) {
  const canCache = !params && schema != null && typeof schema === "object";
  if (canCache) {
    const cached2 = _jsonSchemaCache.get(schema);
    if (cached2)
      return cached2;
  }
  let result;
  if (isStandardJsonSchema(schema) && !isZodSchemaV4(schema))
    result = schema["~standard"].jsonSchema.input({ target: "draft-07" });
  else if (isZodSchemaV4(schema)) {
    const inputSchema = interopZodTransformInputSchema(schema, true);
    if (isZodObjectV4(inputSchema))
      result = toJSONSchema(interopZodObjectStrict(inputSchema, true), params);
    else
      result = toJSONSchema(schema, params);
  } else if (isZodSchemaV3(schema))
    result = zodToJsonSchema(schema);
  else
    result = schema;
  if (canCache && result != null && typeof result === "object")
    _jsonSchemaCache.set(schema, result);
  return result;
}

// ../../node_modules/@langchain/core/dist/runnables/graph.js
function nodeDataStr(id, data) {
  if (id !== void 0 && !validate2(id))
    return id;
  else if (isRunnableInterface(data))
    try {
      let dataStr = data.getName();
      dataStr = dataStr.startsWith("Runnable") ? dataStr.slice(8) : dataStr;
      return dataStr;
    } catch {
      return data.getName();
    }
  else
    return data.name ?? "UnknownSchema";
}
function nodeDataJson(node) {
  if (isRunnableInterface(node.data))
    return {
      type: "runnable",
      data: {
        id: node.data.lc_id,
        name: node.data.getName()
      }
    };
  else
    return {
      type: "schema",
      data: {
        ...toJsonSchema(node.data.schema),
        title: node.data.name
      }
    };
}
var Graph = class Graph2 {
  nodes = {};
  edges = [];
  constructor(params) {
    this.nodes = params?.nodes ?? this.nodes;
    this.edges = params?.edges ?? this.edges;
  }
  toJSON() {
    const stableNodeIds = {};
    Object.values(this.nodes).forEach((node, i) => {
      stableNodeIds[node.id] = validate2(node.id) ? i : node.id;
    });
    return {
      nodes: Object.values(this.nodes).map((node) => ({
        id: stableNodeIds[node.id],
        ...nodeDataJson(node)
      })),
      edges: this.edges.map((edge) => {
        const item = {
          source: stableNodeIds[edge.source],
          target: stableNodeIds[edge.target]
        };
        if (typeof edge.data !== "undefined")
          item.data = edge.data;
        if (typeof edge.conditional !== "undefined")
          item.conditional = edge.conditional;
        return item;
      })
    };
  }
  addNode(data, id, metadata) {
    if (id !== void 0 && this.nodes[id] !== void 0)
      throw new Error(`Node with id ${id} already exists`);
    const nodeId = id ?? v42();
    const node = {
      id: nodeId,
      data,
      name: nodeDataStr(id, data),
      metadata
    };
    this.nodes[nodeId] = node;
    return node;
  }
  removeNode(node) {
    delete this.nodes[node.id];
    this.edges = this.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
  }
  addEdge(source, target, data, conditional) {
    if (this.nodes[source.id] === void 0)
      throw new Error(`Source node ${source.id} not in graph`);
    if (this.nodes[target.id] === void 0)
      throw new Error(`Target node ${target.id} not in graph`);
    const edge = {
      source: source.id,
      target: target.id,
      data,
      conditional
    };
    this.edges.push(edge);
    return edge;
  }
  firstNode() {
    return _firstNode(this);
  }
  lastNode() {
    return _lastNode(this);
  }
  /**
  * Add all nodes and edges from another graph.
  * Note this doesn't check for duplicates, nor does it connect the graphs.
  */
  extend(graph, prefix = "") {
    let finalPrefix = prefix;
    if (Object.values(graph.nodes).map((node) => node.id).every(validate2))
      finalPrefix = "";
    const prefixed = (id) => {
      return finalPrefix ? `${finalPrefix}:${id}` : id;
    };
    Object.entries(graph.nodes).forEach(([key, value]) => {
      this.nodes[prefixed(key)] = {
        ...value,
        id: prefixed(key)
      };
    });
    const newEdges = graph.edges.map((edge) => {
      return {
        ...edge,
        source: prefixed(edge.source),
        target: prefixed(edge.target)
      };
    });
    this.edges = [...this.edges, ...newEdges];
    const first = graph.firstNode();
    const last = graph.lastNode();
    return [first ? {
      id: prefixed(first.id),
      data: first.data
    } : void 0, last ? {
      id: prefixed(last.id),
      data: last.data
    } : void 0];
  }
  trimFirstNode() {
    const firstNode = this.firstNode();
    if (firstNode && _firstNode(this, [firstNode.id]))
      this.removeNode(firstNode);
  }
  trimLastNode() {
    const lastNode = this.lastNode();
    if (lastNode && _lastNode(this, [lastNode.id]))
      this.removeNode(lastNode);
  }
  /**
  * Return a new graph with all nodes re-identified,
  * using their unique, readable names where possible.
  */
  reid() {
    const nodeLabels = Object.fromEntries(Object.values(this.nodes).map((node) => [node.id, node.name]));
    const nodeLabelCounts = /* @__PURE__ */ new Map();
    Object.values(nodeLabels).forEach((label) => {
      nodeLabelCounts.set(label, (nodeLabelCounts.get(label) || 0) + 1);
    });
    const getNodeId = (nodeId) => {
      const label = nodeLabels[nodeId];
      if (validate2(nodeId) && nodeLabelCounts.get(label) === 1)
        return label;
      else
        return nodeId;
    };
    return new Graph2({
      nodes: Object.fromEntries(Object.entries(this.nodes).map(([id, node]) => [getNodeId(id), {
        ...node,
        id: getNodeId(id)
      }])),
      edges: this.edges.map((edge) => ({
        ...edge,
        source: getNodeId(edge.source),
        target: getNodeId(edge.target)
      }))
    });
  }
  drawMermaid(params) {
    const { withStyles, curveStyle, nodeColors = {
      default: "fill:#f2f0ff,line-height:1.2",
      first: "fill-opacity:0",
      last: "fill:#bfb6fc"
    }, wrapLabelNWords } = params ?? {};
    const graph = this.reid();
    const firstNode = graph.firstNode();
    const lastNode = graph.lastNode();
    return drawMermaid(graph.nodes, graph.edges, {
      firstNode: firstNode?.id,
      lastNode: lastNode?.id,
      withStyles,
      curveStyle,
      nodeColors,
      wrapLabelNWords
    });
  }
  async drawMermaidPng(params) {
    return drawMermaidImage(this.drawMermaid(params), { backgroundColor: params?.backgroundColor });
  }
};
function _firstNode(graph, exclude = []) {
  const targets = new Set(graph.edges.filter((edge) => !exclude.includes(edge.source)).map((edge) => edge.target));
  const found = [];
  for (const node of Object.values(graph.nodes))
    if (!exclude.includes(node.id) && !targets.has(node.id))
      found.push(node);
  return found.length === 1 ? found[0] : void 0;
}
function _lastNode(graph, exclude = []) {
  const sources = new Set(graph.edges.filter((edge) => !exclude.includes(edge.target)).map((edge) => edge.source));
  const found = [];
  for (const node of Object.values(graph.nodes))
    if (!exclude.includes(node.id) && !sources.has(node.id))
      found.push(node);
  return found.length === 1 ? found[0] : void 0;
}

// ../../node_modules/@langchain/core/dist/runnables/wrappers.js
function convertToHttpEventStream(stream) {
  const encoder2 = new TextEncoder();
  const finalStream = new ReadableStream({ async start(controller) {
    for await (const chunk of stream)
      controller.enqueue(encoder2.encode(`event: data
data: ${JSON.stringify(chunk)}

`));
    controller.enqueue(encoder2.encode("event: end\n\n"));
    controller.close();
  } });
  return IterableReadableStream.fromReadableStream(finalStream);
}

// ../../node_modules/@langchain/core/dist/runnables/iter.js
function isIterableIterator(thing) {
  return typeof thing === "object" && thing !== null && typeof thing[Symbol.iterator] === "function" && typeof thing.next === "function";
}
var isIterator = (x) => x != null && typeof x === "object" && "next" in x && typeof x.next === "function";
function isAsyncIterable(thing) {
  return typeof thing === "object" && thing !== null && typeof thing[Symbol.asyncIterator] === "function";
}
function* consumeIteratorInContext(context, iter) {
  while (true) {
    const { value, done } = AsyncLocalStorageProviderSingleton2.runWithConfig(pickRunnableConfigKeys(context), iter.next.bind(iter), true);
    if (done)
      break;
    else
      yield value;
  }
}
async function* consumeAsyncIterableInContext(context, iter) {
  const iterator = iter[Symbol.asyncIterator]();
  while (true) {
    const { value, done } = await AsyncLocalStorageProviderSingleton2.runWithConfig(pickRunnableConfigKeys(context), iterator.next.bind(iter), true);
    if (done)
      break;
    else
      yield value;
  }
}

// ../../node_modules/@langchain/core/dist/runnables/base.js
function _coerceToDict2(value, defaultKey) {
  return value && !Array.isArray(value) && !(value instanceof Date) && typeof value === "object" ? value : { [defaultKey]: value };
}
var Runnable = class extends Serializable {
  lc_runnable = true;
  name;
  getName(suffix) {
    const name = this.name ?? this.constructor.lc_name() ?? this.constructor.name;
    return suffix ? `${name}${suffix}` : name;
  }
  /**
  * Add retry logic to an existing runnable.
  * @param fields.stopAfterAttempt The number of attempts to retry.
  * @param fields.onFailedAttempt A function that is called when a retry fails.
  * @returns A new RunnableRetry that, when invoked, will retry according to the parameters.
  */
  withRetry(fields) {
    return new RunnableRetry({
      bound: this,
      kwargs: {},
      config: {},
      maxAttemptNumber: fields?.stopAfterAttempt,
      ...fields
    });
  }
  /**
  * Bind config to a Runnable, returning a new Runnable.
  * @param config New configuration parameters to attach to the new runnable.
  * @returns A new RunnableBinding with a config matching what's passed.
  */
  withConfig(config2) {
    return new RunnableBinding({
      bound: this,
      config: config2,
      kwargs: {}
    });
  }
  /**
  * Create a new runnable from the current one that will try invoking
  * other passed fallback runnables if the initial invocation fails.
  * @param fields.fallbacks Other runnables to call if the runnable errors.
  * @returns A new RunnableWithFallbacks.
  */
  withFallbacks(fields) {
    const fallbacks = Array.isArray(fields) ? fields : fields.fallbacks;
    return new RunnableWithFallbacks({
      runnable: this,
      fallbacks
    });
  }
  _getOptionsList(options, length = 0) {
    if (Array.isArray(options) && options.length !== length)
      throw new Error(`Passed "options" must be an array with the same length as the inputs, but got ${options.length} options for ${length} inputs`);
    if (Array.isArray(options))
      return options.map(ensureConfig);
    if (length > 1 && !Array.isArray(options) && options.runId) {
      console.warn("Provided runId will be used only for the first element of the batch.");
      const subsequent = Object.fromEntries(Object.entries(options).filter(([key]) => key !== "runId"));
      return Array.from({ length }, (_, i) => ensureConfig(i === 0 ? options : subsequent));
    }
    return Array.from({ length }, () => ensureConfig(options));
  }
  async batch(inputs, options, batchOptions) {
    const configList = this._getOptionsList(options ?? {}, inputs.length);
    const caller = new AsyncCaller2({
      maxConcurrency: configList[0]?.maxConcurrency ?? batchOptions?.maxConcurrency,
      onFailedAttempt: (e) => {
        throw e;
      }
    });
    const batchCalls = inputs.map((input, i) => caller.call(async () => {
      try {
        return await this.invoke(input, configList[i]);
      } catch (e) {
        if (batchOptions?.returnExceptions)
          return e;
        throw e;
      }
    }));
    return Promise.all(batchCalls);
  }
  /**
  * Default streaming implementation.
  * Subclasses should override this method if they support streaming output.
  * @param input
  * @param options
  */
  async *_streamIterator(input, options) {
    yield this.invoke(input, options);
  }
  /**
  * Stream output in chunks.
  * @param input
  * @param options
  * @returns A readable stream that is also an iterable.
  */
  async stream(input, options) {
    const config2 = ensureConfig(options);
    const wrappedGenerator = new AsyncGeneratorWithSetup({
      generator: this._streamIterator(input, config2),
      config: config2
    });
    await wrappedGenerator.setup;
    return IterableReadableStream.fromAsyncGenerator(wrappedGenerator);
  }
  _separateRunnableConfigFromCallOptions(options) {
    let runnableConfig;
    if (options === void 0)
      runnableConfig = ensureConfig(options);
    else
      runnableConfig = ensureConfig({
        callbacks: options.callbacks,
        tags: options.tags,
        metadata: options.metadata,
        runName: options.runName,
        configurable: options.configurable,
        recursionLimit: options.recursionLimit,
        maxConcurrency: options.maxConcurrency,
        runId: options.runId,
        timeout: options.timeout,
        signal: options.signal
      });
    const callOptions = { ...options };
    delete callOptions.callbacks;
    delete callOptions.tags;
    delete callOptions.metadata;
    delete callOptions.runName;
    delete callOptions.configurable;
    delete callOptions.recursionLimit;
    delete callOptions.maxConcurrency;
    delete callOptions.runId;
    delete callOptions.timeout;
    delete callOptions.signal;
    return [runnableConfig, callOptions];
  }
  async _callWithConfig(func, input, options) {
    const config2 = ensureConfig(options);
    const runManager = await (await getCallbackManagerForConfig(config2))?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"), config2.runId, config2?.runType, void 0, void 0, config2?.runName ?? this.getName());
    delete config2.runId;
    let output;
    try {
      output = await raceWithSignal(func.call(this, input, config2, runManager), config2.signal);
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(_coerceToDict2(output, "output"));
    return output;
  }
  /**
  * Internal method that handles batching and configuration for a runnable
  * It takes a function, input values, and optional configuration, and
  * returns a promise that resolves to the output values.
  * @param func The function to be executed for each input value.
  * @param input The input values to be processed.
  * @param config Optional configuration for the function execution.
  * @returns A promise that resolves to the output values.
  */
  async _batchWithConfig(func, inputs, options, batchOptions) {
    const optionsList = this._getOptionsList(options ?? {}, inputs.length);
    const callbackManagers = await Promise.all(optionsList.map(getCallbackManagerForConfig));
    const runManagers = await Promise.all(callbackManagers.map(async (callbackManager, i) => {
      const handleStartRes = await callbackManager?.handleChainStart(this.toJSON(), _coerceToDict2(inputs[i], "input"), optionsList[i].runId, optionsList[i].runType, void 0, void 0, optionsList[i].runName ?? this.getName());
      delete optionsList[i].runId;
      return handleStartRes;
    }));
    let outputs;
    try {
      outputs = await raceWithSignal(func.call(this, inputs, optionsList, runManagers, batchOptions), optionsList?.[0]?.signal);
    } catch (e) {
      await Promise.all(runManagers.map((runManager) => runManager?.handleChainError(e)));
      throw e;
    }
    await Promise.all(runManagers.map((runManager) => runManager?.handleChainEnd(_coerceToDict2(outputs, "output"))));
    return outputs;
  }
  /** @internal */
  _concatOutputChunks(first, second) {
    return concat(first, second);
  }
  /**
  * Helper method to transform an Iterator of Input values into an Iterator of
  * Output values, with callbacks.
  * Use this to implement `stream()` or `transform()` in Runnable subclasses.
  */
  async *_transformStreamWithConfig(inputGenerator, transformer, options) {
    let finalInput;
    let finalInputSupported = true;
    let finalOutput;
    let finalOutputSupported = true;
    const config2 = ensureConfig(options);
    const callbackManager_ = await getCallbackManagerForConfig(config2);
    const outerThis = this;
    async function* wrapInputForTracing() {
      for await (const chunk of inputGenerator) {
        if (finalInputSupported)
          if (finalInput === void 0)
            finalInput = chunk;
          else
            try {
              finalInput = outerThis._concatOutputChunks(finalInput, chunk);
            } catch {
              finalInput = void 0;
              finalInputSupported = false;
            }
        yield chunk;
      }
    }
    let runManager;
    try {
      const pipe = await pipeGeneratorWithSetup(transformer.bind(this), wrapInputForTracing(), async () => callbackManager_?.handleChainStart(this.toJSON(), { input: "" }, config2.runId, config2.runType, void 0, void 0, config2.runName ?? this.getName(), void 0, { lc_defers_inputs: true }), config2.signal, config2);
      delete config2.runId;
      runManager = pipe.setup;
      const streamEventsHandler = runManager?.handlers.find(isStreamEventsHandler);
      let iterator = pipe.output;
      if (streamEventsHandler !== void 0 && runManager !== void 0)
        iterator = streamEventsHandler.tapOutputIterable(runManager.runId, iterator);
      const streamLogHandler = runManager?.handlers.find(isLogStreamHandler);
      if (streamLogHandler !== void 0 && runManager !== void 0)
        iterator = streamLogHandler.tapOutputIterable(runManager.runId, iterator);
      for await (const chunk of iterator) {
        yield chunk;
        if (finalOutputSupported)
          if (finalOutput === void 0)
            finalOutput = chunk;
          else
            try {
              finalOutput = this._concatOutputChunks(finalOutput, chunk);
            } catch {
              finalOutput = void 0;
              finalOutputSupported = false;
            }
      }
    } catch (e) {
      await runManager?.handleChainError(e, void 0, void 0, void 0, { inputs: _coerceToDict2(finalInput, "input") });
      throw e;
    }
    await runManager?.handleChainEnd(finalOutput ?? {}, void 0, void 0, void 0, { inputs: _coerceToDict2(finalInput, "input") });
  }
  getGraph(_) {
    const graph = new Graph();
    const inputNode = graph.addNode({
      name: `${this.getName()}Input`,
      schema: external_exports.any()
    });
    const runnableNode = graph.addNode(this);
    const outputNode = graph.addNode({
      name: `${this.getName()}Output`,
      schema: external_exports.any()
    });
    graph.addEdge(inputNode, runnableNode);
    graph.addEdge(runnableNode, outputNode);
    return graph;
  }
  /**
  * Create a new runnable sequence that runs each individual runnable in series,
  * piping the output of one runnable into another runnable or runnable-like.
  * @param coerceable A runnable, function, or object whose values are functions or runnables.
  * @returns A new runnable sequence.
  */
  pipe(coerceable) {
    return new RunnableSequence({
      first: this,
      last: _coerceToRunnable(coerceable)
    });
  }
  /**
  * Pick keys from the dict output of this runnable. Returns a new runnable.
  */
  pick(keys) {
    return this.pipe(new RunnablePick(keys));
  }
  /**
  * Assigns new fields to the dict output of this runnable. Returns a new runnable.
  */
  assign(mapping) {
    return this.pipe(new RunnableAssign(new RunnableMap({ steps: mapping })));
  }
  /**
  * Default implementation of transform, which buffers input and then calls stream.
  * Subclasses should override this method if they can start producing output while
  * input is still being generated.
  * @param generator
  * @param options
  */
  async *transform(generator, options) {
    let finalChunk;
    for await (const chunk of generator)
      if (finalChunk === void 0)
        finalChunk = chunk;
      else
        finalChunk = this._concatOutputChunks(finalChunk, chunk);
    yield* this._streamIterator(finalChunk, ensureConfig(options));
  }
  /**
  * Stream all output from a runnable, as reported to the callback system.
  * This includes all inner runs of LLMs, Retrievers, Tools, etc.
  * Output is streamed as Log objects, which include a list of
  * jsonpatch ops that describe how the state of the run has changed in each
  * step, and the final state of the run.
  * The jsonpatch ops can be applied in order to construct state.
  *
  * @deprecated Use `.stream()` instead.
  *
  * @param input
  * @param options
  * @param streamOptions
  */
  async *streamLog(input, options, streamOptions) {
    const logStreamCallbackHandler = new LogStreamCallbackHandler({
      ...streamOptions,
      autoClose: false,
      _schemaFormat: "original"
    });
    const config2 = ensureConfig(options);
    yield* this._streamLog(input, logStreamCallbackHandler, config2);
  }
  async *_streamLog(input, logStreamCallbackHandler, config2) {
    const { callbacks } = config2;
    if (callbacks === void 0)
      config2.callbacks = [logStreamCallbackHandler];
    else if (Array.isArray(callbacks))
      config2.callbacks = callbacks.concat([logStreamCallbackHandler]);
    else {
      const copiedCallbacks = callbacks.copy();
      copiedCallbacks.addHandler(logStreamCallbackHandler, true);
      config2.callbacks = copiedCallbacks;
    }
    const runnableStreamPromise = this.stream(input, config2);
    async function consumeRunnableStream() {
      try {
        const runnableStream = await runnableStreamPromise;
        for await (const chunk of runnableStream) {
          const patch = new RunLogPatch({ ops: [{
            op: "add",
            path: "/streamed_output/-",
            value: chunk
          }] });
          await logStreamCallbackHandler.writer.write(patch);
        }
      } finally {
        await logStreamCallbackHandler.writer.close();
      }
    }
    const runnableStreamConsumePromise = consumeRunnableStream();
    try {
      for await (const log of logStreamCallbackHandler)
        yield log;
    } finally {
      await runnableStreamConsumePromise;
    }
  }
  streamEvents(input, options, streamOptions) {
    let stream;
    if (options.version === "v1")
      stream = this._streamEventsV1(input, options, streamOptions);
    else if (options.version === "v2")
      stream = this._streamEventsV2(input, options, streamOptions);
    else
      throw new Error(`Only versions "v1" and "v2" of the schema are currently supported.`);
    if (options.encoding === "text/event-stream")
      return convertToHttpEventStream(stream);
    else
      return IterableReadableStream.fromAsyncGenerator(stream);
  }
  async *_streamEventsV2(input, options, streamOptions) {
    const eventStreamer = new EventStreamCallbackHandler({
      ...streamOptions,
      autoClose: false
    });
    const config2 = ensureConfig(options);
    const runId = config2.runId ?? v72();
    config2.runId = runId;
    const callbacks = config2.callbacks;
    if (callbacks === void 0)
      config2.callbacks = [eventStreamer];
    else if (Array.isArray(callbacks))
      config2.callbacks = callbacks.concat(eventStreamer);
    else {
      const copiedCallbacks = callbacks.copy();
      copiedCallbacks.addHandler(eventStreamer, true);
      config2.callbacks = copiedCallbacks;
    }
    const abortController = new AbortController();
    const outerThis = this;
    async function consumeRunnableStream() {
      let signal;
      try {
        if (config2.signal)
          if ("any" in AbortSignal)
            signal = AbortSignal.any([abortController.signal, config2.signal]);
          else {
            const composed = new AbortController();
            config2.signal.addEventListener("abort", () => composed.abort(), { once: true });
            abortController.signal.addEventListener("abort", () => composed.abort(), { once: true });
            signal = composed.signal;
          }
        else
          signal = abortController.signal;
        const runnableStream = await outerThis.stream(input, {
          ...config2,
          signal
        });
        const tappedStream = eventStreamer.tapOutputIterable(runId, runnableStream);
        for await (const _ of tappedStream)
          if (abortController.signal.aborted)
            break;
      } finally {
        await eventStreamer.finish();
      }
    }
    const runnableStreamConsumePromise = consumeRunnableStream();
    let firstEventSent = false;
    let firstEventRunId;
    try {
      for await (const event of eventStreamer) {
        if (!firstEventSent) {
          event.data.input = input;
          firstEventSent = true;
          firstEventRunId = event.run_id;
          yield event;
          continue;
        }
        if (event.run_id === firstEventRunId && event.event.endsWith("_end")) {
          if (event.data?.input)
            delete event.data.input;
        }
        yield event;
      }
    } finally {
      abortController.abort();
      await runnableStreamConsumePromise;
    }
  }
  async *_streamEventsV1(input, options, streamOptions) {
    let runLog;
    let hasEncounteredStartEvent = false;
    const config2 = ensureConfig(options);
    const rootTags = config2.tags ?? [];
    const rootMetadata = config2.metadata ?? {};
    const rootName = config2.runName ?? this.getName();
    const logStreamCallbackHandler = new LogStreamCallbackHandler({
      ...streamOptions,
      autoClose: false,
      _schemaFormat: "streaming_events"
    });
    const rootEventFilter = new _RootEventFilter({ ...streamOptions });
    const logStream = this._streamLog(input, logStreamCallbackHandler, config2);
    for await (const log of logStream) {
      if (!runLog)
        runLog = RunLog.fromRunLogPatch(log);
      else
        runLog = runLog.concat(log);
      if (runLog.state === void 0)
        throw new Error(`Internal error: "streamEvents" state is missing. Please open a bug report.`);
      if (!hasEncounteredStartEvent) {
        hasEncounteredStartEvent = true;
        const state3 = { ...runLog.state };
        const event = {
          run_id: state3.id,
          event: `on_${state3.type}_start`,
          name: rootName,
          tags: rootTags,
          metadata: rootMetadata,
          data: { input }
        };
        if (rootEventFilter.includeEvent(event, state3.type))
          yield event;
      }
      const paths = log.ops.filter((op) => op.path.startsWith("/logs/")).map((op) => op.path.split("/")[2]);
      const dedupedPaths = [...new Set(paths)];
      for (const path3 of dedupedPaths) {
        let eventType;
        let data = {};
        const logEntry = runLog.state.logs[path3];
        if (logEntry.end_time === void 0)
          if (logEntry.streamed_output.length > 0)
            eventType = "stream";
          else
            eventType = "start";
        else
          eventType = "end";
        if (eventType === "start") {
          if (logEntry.inputs !== void 0)
            data.input = logEntry.inputs;
        } else if (eventType === "end") {
          if (logEntry.inputs !== void 0)
            data.input = logEntry.inputs;
          data.output = logEntry.final_output;
        } else if (eventType === "stream") {
          const chunkCount = logEntry.streamed_output.length;
          if (chunkCount !== 1)
            throw new Error(`Expected exactly one chunk of streamed output, got ${chunkCount} instead. Encountered in: "${logEntry.name}"`);
          data = { chunk: logEntry.streamed_output[0] };
          logEntry.streamed_output = [];
        }
        yield {
          event: `on_${logEntry.type}_${eventType}`,
          name: logEntry.name,
          run_id: logEntry.id,
          tags: logEntry.tags,
          metadata: logEntry.metadata,
          data
        };
      }
      const { state: state2 } = runLog;
      if (state2.streamed_output.length > 0) {
        const chunkCount = state2.streamed_output.length;
        if (chunkCount !== 1)
          throw new Error(`Expected exactly one chunk of streamed output, got ${chunkCount} instead. Encountered in: "${state2.name}"`);
        const data = { chunk: state2.streamed_output[0] };
        state2.streamed_output = [];
        const event = {
          event: `on_${state2.type}_stream`,
          run_id: state2.id,
          tags: rootTags,
          metadata: rootMetadata,
          name: rootName,
          data
        };
        if (rootEventFilter.includeEvent(event, state2.type))
          yield event;
      }
    }
    const state = runLog?.state;
    if (state !== void 0) {
      const event = {
        event: `on_${state.type}_end`,
        name: rootName,
        run_id: state.id,
        tags: rootTags,
        metadata: rootMetadata,
        data: { output: state.final_output }
      };
      if (rootEventFilter.includeEvent(event, state.type))
        yield event;
    }
  }
  static isRunnable(thing) {
    return isRunnableInterface(thing);
  }
  /**
  * Bind lifecycle listeners to a Runnable, returning a new Runnable.
  * The Run object contains information about the run, including its id,
  * type, input, output, error, startTime, endTime, and any tags or metadata
  * added to the run.
  *
  * @param {Object} params - The object containing the callback functions.
  * @param {(run: Run) => void} params.onStart - Called before the runnable starts running, with the Run object.
  * @param {(run: Run) => void} params.onEnd - Called after the runnable finishes running, with the Run object.
  * @param {(run: Run) => void} params.onError - Called if the runnable throws an error, with the Run object.
  */
  withListeners({ onStart, onEnd, onError }) {
    return new RunnableBinding({
      bound: this,
      config: {},
      configFactories: [(config2) => ({ callbacks: [new RootListenersTracer({
        config: config2,
        onStart,
        onEnd,
        onError
      })] })]
    });
  }
  /**
  * Convert a runnable to a tool. Return a new instance of `RunnableToolLike`
  * which contains the runnable, name, description and schema.
  *
  * @template {T extends RunInput = RunInput} RunInput - The input type of the runnable. Should be the same as the `RunInput` type of the runnable.
  *
  * @param fields
  * @param {string | undefined} [fields.name] The name of the tool. If not provided, it will default to the name of the runnable.
  * @param {string | undefined} [fields.description] The description of the tool. Falls back to the description on the Zod schema if not provided, or undefined if neither are provided.
  * @param {z.ZodType<T>} [fields.schema] The Zod schema for the input of the tool. Infers the Zod type from the input type of the runnable.
  * @returns {RunnableToolLike<z.ZodType<T>, RunOutput>} An instance of `RunnableToolLike` which is a runnable that can be used as a tool.
  */
  asTool(fields) {
    return convertRunnableToTool(this, fields);
  }
};
var RunnableBinding = class RunnableBinding2 extends Runnable {
  static lc_name() {
    return "RunnableBinding";
  }
  lc_namespace = ["langchain_core", "runnables"];
  lc_serializable = true;
  bound;
  config;
  kwargs;
  configFactories;
  constructor(fields) {
    super(fields);
    this.bound = fields.bound;
    this.kwargs = fields.kwargs;
    this.config = fields.config;
    this.configFactories = fields.configFactories;
  }
  getName(suffix) {
    return this.bound.getName(suffix);
  }
  async _mergeConfig(...options) {
    const config2 = mergeConfigs(this.config, ...options);
    return mergeConfigs(config2, ...this.configFactories ? await Promise.all(this.configFactories.map(async (configFactory) => await configFactory(config2))) : []);
  }
  withConfig(config2) {
    return new this.constructor({
      bound: this.bound,
      kwargs: this.kwargs,
      config: {
        ...this.config,
        ...config2
      }
    });
  }
  withRetry(fields) {
    return new RunnableRetry({
      bound: this.bound,
      kwargs: this.kwargs,
      config: this.config,
      maxAttemptNumber: fields?.stopAfterAttempt,
      ...fields
    });
  }
  async invoke(input, options) {
    return this.bound.invoke(input, await this._mergeConfig(options, this.kwargs));
  }
  async batch(inputs, options, batchOptions) {
    const mergedOptions = Array.isArray(options) ? await Promise.all(options.map(async (individualOption) => this._mergeConfig(ensureConfig(individualOption), this.kwargs))) : await this._mergeConfig(ensureConfig(options), this.kwargs);
    return this.bound.batch(inputs, mergedOptions, batchOptions);
  }
  /** @internal */
  _concatOutputChunks(first, second) {
    return this.bound._concatOutputChunks(first, second);
  }
  async *_streamIterator(input, options) {
    yield* this.bound._streamIterator(input, await this._mergeConfig(ensureConfig(options), this.kwargs));
  }
  async stream(input, options) {
    return this.bound.stream(input, await this._mergeConfig(ensureConfig(options), this.kwargs));
  }
  async *transform(generator, options) {
    yield* this.bound.transform(generator, await this._mergeConfig(ensureConfig(options), this.kwargs));
  }
  streamEvents(input, options, streamOptions) {
    const outerThis = this;
    const generator = async function* () {
      yield* outerThis.bound.streamEvents(input, {
        ...await outerThis._mergeConfig(ensureConfig(options), outerThis.kwargs),
        version: options.version
      }, streamOptions);
    };
    return IterableReadableStream.fromAsyncGenerator(generator());
  }
  static isRunnableBinding(thing) {
    return thing.bound && Runnable.isRunnable(thing.bound);
  }
  /**
  * Bind lifecycle listeners to a Runnable, returning a new Runnable.
  * The Run object contains information about the run, including its id,
  * type, input, output, error, startTime, endTime, and any tags or metadata
  * added to the run.
  *
  * @param {Object} params - The object containing the callback functions.
  * @param {(run: Run) => void} params.onStart - Called before the runnable starts running, with the Run object.
  * @param {(run: Run) => void} params.onEnd - Called after the runnable finishes running, with the Run object.
  * @param {(run: Run) => void} params.onError - Called if the runnable throws an error, with the Run object.
  */
  withListeners({ onStart, onEnd, onError }) {
    return new RunnableBinding2({
      bound: this.bound,
      kwargs: this.kwargs,
      config: this.config,
      configFactories: [(config2) => ({ callbacks: [new RootListenersTracer({
        config: config2,
        onStart,
        onEnd,
        onError
      })] })]
    });
  }
};
var RunnableRetry = class extends RunnableBinding {
  static lc_name() {
    return "RunnableRetry";
  }
  lc_namespace = ["langchain_core", "runnables"];
  maxAttemptNumber = 3;
  onFailedAttempt = () => {
  };
  constructor(fields) {
    super(fields);
    this.maxAttemptNumber = fields.maxAttemptNumber ?? this.maxAttemptNumber;
    this.onFailedAttempt = fields.onFailedAttempt ?? this.onFailedAttempt;
  }
  _patchConfigForRetry(attempt, config2, runManager) {
    const tag = attempt > 1 ? `retry:attempt:${attempt}` : void 0;
    return patchConfig(config2, { callbacks: runManager?.getChild(tag) });
  }
  async _invoke(input, config2, runManager) {
    return pRetry2((attemptNumber) => super.invoke(input, this._patchConfigForRetry(attemptNumber, config2, runManager)), {
      onFailedAttempt: ({ error }) => this.onFailedAttempt(error, input),
      retries: Math.max(this.maxAttemptNumber - 1, 0),
      randomize: true
    });
  }
  /**
  * Method that invokes the runnable with the specified input, run manager,
  * and config. It handles the retry logic by catching any errors and
  * recursively invoking itself with the updated config for the next retry
  * attempt.
  * @param input The input for the runnable.
  * @param runManager The run manager for the runnable.
  * @param config The config for the runnable.
  * @returns A promise that resolves to the output of the runnable.
  */
  async invoke(input, config2) {
    return this._callWithConfig(this._invoke.bind(this), input, config2);
  }
  async _batch(inputs, configs, runManagers, batchOptions) {
    const resultsMap = {};
    try {
      await pRetry2(async (attemptNumber) => {
        const remainingIndexes = inputs.map((_, i) => i).filter((i) => resultsMap[i.toString()] === void 0 || resultsMap[i.toString()] instanceof Error);
        const remainingInputs = remainingIndexes.map((i) => inputs[i]);
        const patchedConfigs = remainingIndexes.map((i) => this._patchConfigForRetry(attemptNumber, configs?.[i], runManagers?.[i]));
        const results = await super.batch(remainingInputs, patchedConfigs, {
          ...batchOptions,
          returnExceptions: true
        });
        let firstException;
        for (let i = 0; i < results.length; i += 1) {
          const result = results[i];
          const resultMapIndex = remainingIndexes[i];
          if (result instanceof Error) {
            if (firstException === void 0) {
              firstException = result;
              firstException.input = remainingInputs[i];
            }
          }
          resultsMap[resultMapIndex.toString()] = result;
        }
        if (firstException)
          throw firstException;
        return results;
      }, {
        onFailedAttempt: ({ error }) => this.onFailedAttempt(error, error.input),
        retries: Math.max(this.maxAttemptNumber - 1, 0),
        randomize: true
      });
    } catch (e) {
      if (batchOptions?.returnExceptions !== true)
        throw e;
    }
    return Object.keys(resultsMap).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map((key) => resultsMap[parseInt(key, 10)]);
  }
  async batch(inputs, options, batchOptions) {
    return this._batchWithConfig(this._batch.bind(this), inputs, options, batchOptions);
  }
};
var RunnableSequence = class RunnableSequence2 extends Runnable {
  static lc_name() {
    return "RunnableSequence";
  }
  first;
  middle = [];
  last;
  omitSequenceTags = false;
  lc_serializable = true;
  lc_namespace = ["langchain_core", "runnables"];
  constructor(fields) {
    super(fields);
    this.first = fields.first;
    this.middle = fields.middle ?? this.middle;
    this.last = fields.last;
    this.name = fields.name;
    this.omitSequenceTags = fields.omitSequenceTags ?? this.omitSequenceTags;
  }
  get steps() {
    return [
      this.first,
      ...this.middle,
      this.last
    ];
  }
  async invoke(input, options) {
    const config2 = ensureConfig(options);
    const runManager = await (await getCallbackManagerForConfig(config2))?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"), config2.runId, void 0, void 0, void 0, config2?.runName);
    delete config2.runId;
    let nextStepInput = input;
    let finalOutput;
    try {
      const initialSteps = [this.first, ...this.middle];
      for (let i = 0; i < initialSteps.length; i += 1)
        nextStepInput = await raceWithSignal(initialSteps[i].invoke(nextStepInput, patchConfig(config2, { callbacks: runManager?.getChild(this.omitSequenceTags ? void 0 : `seq:step:${i + 1}`) })), config2.signal);
      if (config2.signal?.aborted)
        throw getAbortSignalError(config2.signal);
      finalOutput = await this.last.invoke(nextStepInput, patchConfig(config2, { callbacks: runManager?.getChild(this.omitSequenceTags ? void 0 : `seq:step:${this.steps.length}`) }));
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(_coerceToDict2(finalOutput, "output"));
    return finalOutput;
  }
  async batch(inputs, options, batchOptions) {
    const configList = this._getOptionsList(options ?? {}, inputs.length);
    const callbackManagers = await Promise.all(configList.map(getCallbackManagerForConfig));
    const runManagers = await Promise.all(callbackManagers.map(async (callbackManager, i) => {
      const handleStartRes = await callbackManager?.handleChainStart(this.toJSON(), _coerceToDict2(inputs[i], "input"), configList[i].runId, void 0, void 0, void 0, configList[i].runName);
      delete configList[i].runId;
      return handleStartRes;
    }));
    let nextStepInputs = inputs;
    try {
      for (let i = 0; i < this.steps.length; i += 1)
        nextStepInputs = await raceWithSignal(this.steps[i].batch(nextStepInputs, runManagers.map((runManager, j) => {
          const childRunManager = runManager?.getChild(this.omitSequenceTags ? void 0 : `seq:step:${i + 1}`);
          return patchConfig(configList[j], { callbacks: childRunManager });
        }), batchOptions), configList[0]?.signal);
    } catch (e) {
      await Promise.all(runManagers.map((runManager) => runManager?.handleChainError(e)));
      throw e;
    }
    await Promise.all(runManagers.map((runManager) => runManager?.handleChainEnd(_coerceToDict2(nextStepInputs, "output"))));
    return nextStepInputs;
  }
  /** @internal */
  _concatOutputChunks(first, second) {
    return this.last._concatOutputChunks(first, second);
  }
  async *_streamIterator(input, options) {
    const callbackManager_ = await getCallbackManagerForConfig(options);
    const { runId, ...otherOptions } = options ?? {};
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"), runId, void 0, void 0, void 0, otherOptions?.runName);
    const steps = [
      this.first,
      ...this.middle,
      this.last
    ];
    let concatSupported = true;
    let finalOutput;
    async function* inputGenerator() {
      yield input;
    }
    try {
      let finalGenerator = steps[0].transform(inputGenerator(), patchConfig(otherOptions, { callbacks: runManager?.getChild(this.omitSequenceTags ? void 0 : `seq:step:1`) }));
      for (let i = 1; i < steps.length; i += 1)
        finalGenerator = await steps[i].transform(finalGenerator, patchConfig(otherOptions, { callbacks: runManager?.getChild(this.omitSequenceTags ? void 0 : `seq:step:${i + 1}`) }));
      for await (const chunk of finalGenerator) {
        options?.signal?.throwIfAborted();
        yield chunk;
        if (concatSupported)
          if (finalOutput === void 0)
            finalOutput = chunk;
          else
            try {
              finalOutput = this._concatOutputChunks(finalOutput, chunk);
            } catch {
              finalOutput = void 0;
              concatSupported = false;
            }
      }
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(_coerceToDict2(finalOutput, "output"));
  }
  getGraph(config2) {
    const graph = new Graph();
    let currentLastNode = null;
    this.steps.forEach((step, index) => {
      const stepGraph = step.getGraph(config2);
      if (index !== 0)
        stepGraph.trimFirstNode();
      if (index !== this.steps.length - 1)
        stepGraph.trimLastNode();
      graph.extend(stepGraph);
      const stepFirstNode = stepGraph.firstNode();
      if (!stepFirstNode)
        throw new Error(`Runnable ${step} has no first node`);
      if (currentLastNode)
        graph.addEdge(currentLastNode, stepFirstNode);
      currentLastNode = stepGraph.lastNode();
    });
    return graph;
  }
  pipe(coerceable) {
    if (RunnableSequence2.isRunnableSequence(coerceable))
      return new RunnableSequence2({
        first: this.first,
        middle: this.middle.concat([
          this.last,
          coerceable.first,
          ...coerceable.middle
        ]),
        last: coerceable.last,
        name: this.name ?? coerceable.name
      });
    else
      return new RunnableSequence2({
        first: this.first,
        middle: [...this.middle, this.last],
        last: _coerceToRunnable(coerceable),
        name: this.name
      });
  }
  static isRunnableSequence(thing) {
    return Array.isArray(thing.middle) && Runnable.isRunnable(thing);
  }
  static from([first, ...runnables], nameOrFields) {
    let extra = {};
    if (typeof nameOrFields === "string")
      extra.name = nameOrFields;
    else if (nameOrFields !== void 0)
      extra = nameOrFields;
    return new RunnableSequence2({
      ...extra,
      first: _coerceToRunnable(first),
      middle: runnables.slice(0, -1).map(_coerceToRunnable),
      last: _coerceToRunnable(runnables[runnables.length - 1])
    });
  }
};
var RunnableMap = class RunnableMap2 extends Runnable {
  static lc_name() {
    return "RunnableMap";
  }
  lc_namespace = ["langchain_core", "runnables"];
  lc_serializable = true;
  steps;
  getStepsKeys() {
    return Object.keys(this.steps);
  }
  constructor(fields) {
    super(fields);
    this.steps = {};
    for (const [key, value] of Object.entries(fields.steps))
      this.steps[key] = _coerceToRunnable(value);
  }
  static from(steps) {
    return new RunnableMap2({ steps });
  }
  async invoke(input, options) {
    const config2 = ensureConfig(options);
    const runManager = await (await getCallbackManagerForConfig(config2))?.handleChainStart(this.toJSON(), { input }, config2.runId, void 0, void 0, void 0, config2?.runName);
    delete config2.runId;
    const output = {};
    try {
      const promises2 = Object.entries(this.steps).map(async ([key, runnable]) => {
        output[key] = await runnable.invoke(input, patchConfig(config2, { callbacks: runManager?.getChild(`map:key:${key}`) }));
      });
      await raceWithSignal(Promise.all(promises2), config2.signal);
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(output);
    return output;
  }
  async *_transform(generator, runManager, options) {
    const steps = { ...this.steps };
    const inputCopies = atee(generator, Object.keys(steps).length);
    const tasks = new Map(Object.entries(steps).map(([key, runnable], i) => {
      const gen = runnable.transform(inputCopies[i], patchConfig(options, { callbacks: runManager?.getChild(`map:key:${key}`) }));
      return [key, gen.next().then((result) => ({
        key,
        gen,
        result
      }))];
    }));
    while (tasks.size) {
      const { key, result, gen } = await raceWithSignal(Promise.race(tasks.values()), options?.signal);
      tasks.delete(key);
      if (!result.done) {
        yield { [key]: result.value };
        tasks.set(key, gen.next().then((result2) => ({
          key,
          gen,
          result: result2
        })));
      }
    }
  }
  transform(generator, options) {
    return this._transformStreamWithConfig(generator, this._transform.bind(this), options);
  }
  async stream(input, options) {
    async function* generator() {
      yield input;
    }
    const config2 = ensureConfig(options);
    const wrappedGenerator = new AsyncGeneratorWithSetup({
      generator: this.transform(generator(), config2),
      config: config2
    });
    await wrappedGenerator.setup;
    return IterableReadableStream.fromAsyncGenerator(wrappedGenerator);
  }
};
var RunnableTraceable = class RunnableTraceable2 extends Runnable {
  lc_serializable = false;
  lc_namespace = ["langchain_core", "runnables"];
  func;
  constructor(fields) {
    super(fields);
    if (!isTraceableFunction(fields.func))
      throw new Error("RunnableTraceable requires a function that is wrapped in traceable higher-order function");
    this.func = fields.func;
  }
  async invoke(input, options) {
    const [config2] = this._getOptionsList(options ?? {}, 1);
    const callbacks = await getCallbackManagerForConfig(config2);
    return raceWithSignal(this.func(patchConfig(config2, { callbacks }), input), config2?.signal);
  }
  async *_streamIterator(input, options) {
    const [config2] = this._getOptionsList(options ?? {}, 1);
    const result = await this.invoke(input, options);
    if (isAsyncIterable(result)) {
      for await (const item of result) {
        config2?.signal?.throwIfAborted();
        yield item;
      }
      return;
    }
    if (isIterator(result)) {
      while (true) {
        config2?.signal?.throwIfAborted();
        const state = result.next();
        if (state.done)
          break;
        yield state.value;
      }
      return;
    }
    yield result;
  }
  static from(func) {
    return new RunnableTraceable2({ func });
  }
};
function assertNonTraceableFunction(func) {
  if (isTraceableFunction(func))
    throw new Error("RunnableLambda requires a function that is not wrapped in traceable higher-order function. This shouldn't happen.");
}
var RunnableLambda = class RunnableLambda2 extends Runnable {
  static lc_name() {
    return "RunnableLambda";
  }
  lc_namespace = ["langchain_core", "runnables"];
  func;
  constructor(fields) {
    if (isTraceableFunction(fields.func))
      return RunnableTraceable.from(fields.func);
    super(fields);
    assertNonTraceableFunction(fields.func);
    this.func = fields.func;
  }
  static from(func) {
    return new RunnableLambda2({ func });
  }
  async _invoke(input, config2, runManager) {
    return new Promise((resolve3, reject) => {
      const childConfig = patchConfig(config2, {
        callbacks: runManager?.getChild(),
        recursionLimit: (config2?.recursionLimit ?? 25) - 1
      });
      AsyncLocalStorageProviderSingleton2.runWithConfig(pickRunnableConfigKeys(childConfig), async () => {
        try {
          let output = await this.func(input, { ...childConfig });
          if (output && Runnable.isRunnable(output)) {
            if (config2?.recursionLimit === 0)
              throw new Error("Recursion limit reached.");
            output = await output.invoke(input, {
              ...childConfig,
              recursionLimit: (childConfig.recursionLimit ?? 25) - 1
            });
          } else if (isAsyncIterable(output)) {
            let finalOutput;
            for await (const chunk of consumeAsyncIterableInContext(childConfig, output)) {
              config2?.signal?.throwIfAborted();
              if (finalOutput === void 0)
                finalOutput = chunk;
              else
                try {
                  finalOutput = this._concatOutputChunks(finalOutput, chunk);
                } catch {
                  finalOutput = chunk;
                }
            }
            output = finalOutput;
          } else if (isIterableIterator(output)) {
            let finalOutput;
            for (const chunk of consumeIteratorInContext(childConfig, output)) {
              config2?.signal?.throwIfAborted();
              if (finalOutput === void 0)
                finalOutput = chunk;
              else
                try {
                  finalOutput = this._concatOutputChunks(finalOutput, chunk);
                } catch {
                  finalOutput = chunk;
                }
            }
            output = finalOutput;
          }
          resolve3(output);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
  async invoke(input, options) {
    return this._callWithConfig(this._invoke.bind(this), input, options);
  }
  async *_transform(generator, runManager, config2) {
    let finalChunk;
    for await (const chunk of generator)
      if (finalChunk === void 0)
        finalChunk = chunk;
      else
        try {
          finalChunk = this._concatOutputChunks(finalChunk, chunk);
        } catch {
          finalChunk = chunk;
        }
    const childConfig = patchConfig(config2, {
      callbacks: runManager?.getChild(),
      recursionLimit: (config2?.recursionLimit ?? 25) - 1
    });
    const output = await new Promise((resolve3, reject) => {
      AsyncLocalStorageProviderSingleton2.runWithConfig(pickRunnableConfigKeys(childConfig), async () => {
        try {
          resolve3(await this.func(finalChunk, {
            ...childConfig,
            config: childConfig
          }));
        } catch (e) {
          reject(e);
        }
      });
    });
    if (output && Runnable.isRunnable(output)) {
      if (config2?.recursionLimit === 0)
        throw new Error("Recursion limit reached.");
      const stream = await output.stream(finalChunk, childConfig);
      for await (const chunk of stream)
        yield chunk;
    } else if (isAsyncIterable(output))
      for await (const chunk of consumeAsyncIterableInContext(childConfig, output)) {
        config2?.signal?.throwIfAborted();
        yield chunk;
      }
    else if (isIterableIterator(output))
      for (const chunk of consumeIteratorInContext(childConfig, output)) {
        config2?.signal?.throwIfAborted();
        yield chunk;
      }
    else
      yield output;
  }
  transform(generator, options) {
    return this._transformStreamWithConfig(generator, this._transform.bind(this), options);
  }
  async stream(input, options) {
    async function* generator() {
      yield input;
    }
    const config2 = ensureConfig(options);
    const wrappedGenerator = new AsyncGeneratorWithSetup({
      generator: this.transform(generator(), config2),
      config: config2
    });
    await wrappedGenerator.setup;
    return IterableReadableStream.fromAsyncGenerator(wrappedGenerator);
  }
};
var RunnableWithFallbacks = class extends Runnable {
  static lc_name() {
    return "RunnableWithFallbacks";
  }
  lc_namespace = ["langchain_core", "runnables"];
  lc_serializable = true;
  runnable;
  fallbacks;
  constructor(fields) {
    super(fields);
    this.runnable = fields.runnable;
    this.fallbacks = fields.fallbacks;
  }
  *runnables() {
    yield this.runnable;
    for (const fallback of this.fallbacks)
      yield fallback;
  }
  async invoke(input, options) {
    const config2 = ensureConfig(options);
    const callbackManager_ = await getCallbackManagerForConfig(config2);
    const { runId, ...otherConfigFields } = config2;
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"), runId, void 0, void 0, void 0, otherConfigFields?.runName);
    const childConfig = patchConfig(otherConfigFields, { callbacks: runManager?.getChild() });
    return await AsyncLocalStorageProviderSingleton2.runWithConfig(childConfig, async () => {
      let firstError;
      for (const runnable of this.runnables()) {
        config2?.signal?.throwIfAborted();
        try {
          const output = await runnable.invoke(input, childConfig);
          await runManager?.handleChainEnd(_coerceToDict2(output, "output"));
          return output;
        } catch (e) {
          if (firstError === void 0)
            firstError = e;
        }
      }
      if (firstError === void 0)
        throw new Error("No error stored at end of fallback.");
      await runManager?.handleChainError(firstError);
      throw firstError;
    });
  }
  async *_streamIterator(input, options) {
    const config2 = ensureConfig(options);
    const callbackManager_ = await getCallbackManagerForConfig(config2);
    const { runId, ...otherConfigFields } = config2;
    const runManager = await callbackManager_?.handleChainStart(this.toJSON(), _coerceToDict2(input, "input"), runId, void 0, void 0, void 0, otherConfigFields?.runName);
    let firstError;
    let stream;
    for (const runnable of this.runnables()) {
      config2?.signal?.throwIfAborted();
      const childConfig = patchConfig(otherConfigFields, { callbacks: runManager?.getChild() });
      try {
        stream = consumeAsyncIterableInContext(childConfig, await runnable.stream(input, childConfig));
        break;
      } catch (e) {
        if (firstError === void 0)
          firstError = e;
      }
    }
    if (stream === void 0) {
      const error = firstError ?? /* @__PURE__ */ new Error("No error stored at end of fallback.");
      await runManager?.handleChainError(error);
      throw error;
    }
    let output;
    try {
      for await (const chunk of stream) {
        yield chunk;
        try {
          output = output === void 0 ? output : this._concatOutputChunks(output, chunk);
        } catch {
          output = void 0;
        }
      }
    } catch (e) {
      await runManager?.handleChainError(e);
      throw e;
    }
    await runManager?.handleChainEnd(_coerceToDict2(output, "output"));
  }
  async batch(inputs, options, batchOptions) {
    if (batchOptions?.returnExceptions)
      throw new Error("Not implemented.");
    const configList = this._getOptionsList(options ?? {}, inputs.length);
    const callbackManagers = await Promise.all(configList.map((config2) => getCallbackManagerForConfig(config2)));
    const runManagers = await Promise.all(callbackManagers.map(async (callbackManager, i) => {
      const handleStartRes = await callbackManager?.handleChainStart(this.toJSON(), _coerceToDict2(inputs[i], "input"), configList[i].runId, void 0, void 0, void 0, configList[i].runName);
      delete configList[i].runId;
      return handleStartRes;
    }));
    let firstError;
    for (const runnable of this.runnables()) {
      configList[0].signal?.throwIfAborted();
      try {
        const outputs = await runnable.batch(inputs, runManagers.map((runManager, j) => patchConfig(configList[j], { callbacks: runManager?.getChild() })), batchOptions);
        await Promise.all(runManagers.map((runManager, i) => runManager?.handleChainEnd(_coerceToDict2(outputs[i], "output"))));
        return outputs;
      } catch (e) {
        if (firstError === void 0)
          firstError = e;
      }
    }
    if (!firstError)
      throw new Error("No error stored at end of fallbacks.");
    await Promise.all(runManagers.map((runManager) => runManager?.handleChainError(firstError)));
    throw firstError;
  }
};
function _coerceToRunnable(coerceable) {
  if (typeof coerceable === "function")
    return new RunnableLambda({ func: coerceable });
  else if (Runnable.isRunnable(coerceable))
    return coerceable;
  else if (!Array.isArray(coerceable) && typeof coerceable === "object") {
    const runnables = {};
    for (const [key, value] of Object.entries(coerceable))
      runnables[key] = _coerceToRunnable(value);
    return new RunnableMap({ steps: runnables });
  } else
    throw new Error(`Expected a Runnable, function or object.
Instead got an unsupported type.`);
}
var RunnableAssign = class extends Runnable {
  static lc_name() {
    return "RunnableAssign";
  }
  lc_namespace = ["langchain_core", "runnables"];
  lc_serializable = true;
  mapper;
  constructor(fields) {
    if (fields instanceof RunnableMap)
      fields = { mapper: fields };
    super(fields);
    this.mapper = fields.mapper;
  }
  async invoke(input, options) {
    const mapperResult = await this.mapper.invoke(input, options);
    return {
      ...input,
      ...mapperResult
    };
  }
  async *_transform(generator, runManager, options) {
    const mapperKeys = this.mapper.getStepsKeys();
    const [forPassthrough, forMapper] = atee(generator);
    const mapperOutput = this.mapper.transform(forMapper, patchConfig(options, { callbacks: runManager?.getChild() }));
    const firstMapperChunkPromise = mapperOutput.next();
    for await (const chunk of forPassthrough) {
      if (typeof chunk !== "object" || Array.isArray(chunk))
        throw new Error(`RunnableAssign can only be used with objects as input, got ${typeof chunk}`);
      const filtered = Object.fromEntries(Object.entries(chunk).filter(([key]) => !mapperKeys.includes(key)));
      if (Object.keys(filtered).length > 0)
        yield filtered;
    }
    yield (await firstMapperChunkPromise).value;
    for await (const chunk of mapperOutput)
      yield chunk;
  }
  transform(generator, options) {
    return this._transformStreamWithConfig(generator, this._transform.bind(this), options);
  }
  async stream(input, options) {
    async function* generator() {
      yield input;
    }
    const config2 = ensureConfig(options);
    const wrappedGenerator = new AsyncGeneratorWithSetup({
      generator: this.transform(generator(), config2),
      config: config2
    });
    await wrappedGenerator.setup;
    return IterableReadableStream.fromAsyncGenerator(wrappedGenerator);
  }
};
var RunnablePick = class extends Runnable {
  static lc_name() {
    return "RunnablePick";
  }
  lc_namespace = ["langchain_core", "runnables"];
  lc_serializable = true;
  keys;
  constructor(fields) {
    if (typeof fields === "string" || Array.isArray(fields))
      fields = { keys: fields };
    super(fields);
    this.keys = fields.keys;
  }
  async _pick(input) {
    if (typeof this.keys === "string")
      return input[this.keys];
    else {
      const picked = this.keys.map((key) => [key, input[key]]).filter((v) => v[1] !== void 0);
      return picked.length === 0 ? void 0 : Object.fromEntries(picked);
    }
  }
  async invoke(input, options) {
    return this._callWithConfig(this._pick.bind(this), input, options);
  }
  async *_transform(generator) {
    for await (const chunk of generator) {
      const picked = await this._pick(chunk);
      if (picked !== void 0)
        yield picked;
    }
  }
  transform(generator, options) {
    return this._transformStreamWithConfig(generator, this._transform.bind(this), options);
  }
  async stream(input, options) {
    async function* generator() {
      yield input;
    }
    const config2 = ensureConfig(options);
    const wrappedGenerator = new AsyncGeneratorWithSetup({
      generator: this.transform(generator(), config2),
      config: config2
    });
    await wrappedGenerator.setup;
    return IterableReadableStream.fromAsyncGenerator(wrappedGenerator);
  }
};
var RunnableToolLike = class extends RunnableBinding {
  name;
  description;
  schema;
  constructor(fields) {
    const sequence = RunnableSequence.from([RunnableLambda.from(async (input) => {
      let toolInput;
      if (_isToolCall(input))
        try {
          toolInput = await interopParseAsync(this.schema, input.args);
        } catch {
          throw new ToolInputParsingException(`Received tool input did not match expected schema`, JSON.stringify(input.args));
        }
      else
        toolInput = input;
      return toolInput;
    }).withConfig({ runName: `${fields.name}:parse_input` }), fields.bound]).withConfig({ runName: fields.name });
    super({
      bound: sequence,
      config: fields.config ?? {}
    });
    this.name = fields.name;
    this.description = fields.description;
    this.schema = fields.schema;
  }
  static lc_name() {
    return "RunnableToolLike";
  }
};
function convertRunnableToTool(runnable, fields) {
  const name = fields.name ?? runnable.getName();
  const description = fields.description ?? getSchemaDescription(fields.schema);
  if (isSimpleStringZodSchema(fields.schema))
    return new RunnableToolLike({
      name,
      description,
      schema: external_exports.object({ input: external_exports.string() }).transform((input) => input.input),
      bound: runnable
    });
  return new RunnableToolLike({
    name,
    description,
    schema: fields.schema,
    bound: runnable
  });
}

// ../../node_modules/@langchain/core/dist/documents/transformers.js
var BaseDocumentTransformer = class extends Runnable {
  lc_namespace = [
    "langchain_core",
    "documents",
    "transformers"
  ];
  /**
  * Method to invoke the document transformation. This method calls the
  * transformDocuments method with the provided input.
  * @param input The input documents to be transformed.
  * @param _options Optional configuration object to customize the behavior of callbacks.
  * @returns A Promise that resolves to the transformed documents.
  */
  invoke(input, _options) {
    return this.transformDocuments(input);
  }
};

// ../../node_modules/js-tiktoken/dist/chunk-VL2OQCWN.js
var import_base64_js = __toESM(require_base64_js(), 1);
var __defProp3 = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function bytePairMerge(piece, ranks) {
  let parts = Array.from(
    { length: piece.length },
    (_, i) => ({ start: i, end: i + 1 })
  );
  while (parts.length > 1) {
    let minRank = null;
    for (let i = 0; i < parts.length - 1; i++) {
      const slice = piece.slice(parts[i].start, parts[i + 1].end);
      const rank = ranks.get(slice.join(","));
      if (rank == null)
        continue;
      if (minRank == null || rank < minRank[0]) {
        minRank = [rank, i];
      }
    }
    if (minRank != null) {
      const i = minRank[1];
      parts[i] = { start: parts[i].start, end: parts[i + 1].end };
      parts.splice(i + 1, 1);
    } else {
      break;
    }
  }
  return parts;
}
function bytePairEncode(piece, ranks) {
  if (piece.length === 1)
    return [ranks.get(piece.join(","))];
  return bytePairMerge(piece, ranks).map((p) => ranks.get(piece.slice(p.start, p.end).join(","))).filter((x) => x != null);
}
function escapeRegex2(str) {
  return str.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}
var _Tiktoken = class {
  /** @internal */
  specialTokens;
  /** @internal */
  inverseSpecialTokens;
  /** @internal */
  patStr;
  /** @internal */
  textEncoder = new TextEncoder();
  /** @internal */
  textDecoder = new TextDecoder("utf-8");
  /** @internal */
  rankMap = /* @__PURE__ */ new Map();
  /** @internal */
  textMap = /* @__PURE__ */ new Map();
  constructor(ranks, extendedSpecialTokens) {
    this.patStr = ranks.pat_str;
    const uncompressed = ranks.bpe_ranks.split("\n").filter(Boolean).reduce((memo, x) => {
      const [_, offsetStr, ...tokens] = x.split(" ");
      const offset = Number.parseInt(offsetStr, 10);
      tokens.forEach((token, i) => memo[token] = offset + i);
      return memo;
    }, {});
    for (const [token, rank] of Object.entries(uncompressed)) {
      const bytes = import_base64_js.default.toByteArray(token);
      this.rankMap.set(bytes.join(","), rank);
      this.textMap.set(rank, bytes);
    }
    this.specialTokens = { ...ranks.special_tokens, ...extendedSpecialTokens };
    this.inverseSpecialTokens = Object.entries(this.specialTokens).reduce((memo, [text, rank]) => {
      memo[rank] = this.textEncoder.encode(text);
      return memo;
    }, {});
  }
  encode(text, allowedSpecial = [], disallowedSpecial = "all") {
    const regexes = new RegExp(this.patStr, "ug");
    const specialRegex = _Tiktoken.specialTokenRegex(
      Object.keys(this.specialTokens)
    );
    const ret = [];
    const allowedSpecialSet = new Set(
      allowedSpecial === "all" ? Object.keys(this.specialTokens) : allowedSpecial
    );
    const disallowedSpecialSet = new Set(
      disallowedSpecial === "all" ? Object.keys(this.specialTokens).filter(
        (x) => !allowedSpecialSet.has(x)
      ) : disallowedSpecial
    );
    if (disallowedSpecialSet.size > 0) {
      const disallowedSpecialRegex = _Tiktoken.specialTokenRegex([
        ...disallowedSpecialSet
      ]);
      const specialMatch = text.match(disallowedSpecialRegex);
      if (specialMatch != null) {
        throw new Error(
          `The text contains a special token that is not allowed: ${specialMatch[0]}`
        );
      }
    }
    let start = 0;
    while (true) {
      let nextSpecial = null;
      let startFind = start;
      while (true) {
        specialRegex.lastIndex = startFind;
        nextSpecial = specialRegex.exec(text);
        if (nextSpecial == null || allowedSpecialSet.has(nextSpecial[0]))
          break;
        startFind = nextSpecial.index + 1;
      }
      const end = nextSpecial?.index ?? text.length;
      for (const match of text.substring(start, end).matchAll(regexes)) {
        const piece = this.textEncoder.encode(match[0]);
        const token2 = this.rankMap.get(piece.join(","));
        if (token2 != null) {
          ret.push(token2);
          continue;
        }
        ret.push(...bytePairEncode(piece, this.rankMap));
      }
      if (nextSpecial == null)
        break;
      let token = this.specialTokens[nextSpecial[0]];
      ret.push(token);
      start = nextSpecial.index + nextSpecial[0].length;
    }
    return ret;
  }
  decode(tokens) {
    const res = [];
    let length = 0;
    for (let i2 = 0; i2 < tokens.length; ++i2) {
      const token = tokens[i2];
      const bytes = this.textMap.get(token) ?? this.inverseSpecialTokens[token];
      if (bytes != null) {
        res.push(bytes);
        length += bytes.length;
      }
    }
    const mergedArray = new Uint8Array(length);
    let i = 0;
    for (const bytes of res) {
      mergedArray.set(bytes, i);
      i += bytes.length;
    }
    return this.textDecoder.decode(mergedArray);
  }
};
var Tiktoken = _Tiktoken;
__publicField(Tiktoken, "specialTokenRegex", (tokens) => {
  return new RegExp(tokens.map((i) => escapeRegex2(i)).join("|"), "g");
});

// ../../node_modules/@langchain/textsplitters/dist/text_splitter.js
var TextSplitter = class extends BaseDocumentTransformer {
  lc_namespace = [
    "langchain",
    "document_transformers",
    "text_splitters"
  ];
  chunkSize = 1e3;
  chunkOverlap = 200;
  keepSeparator = false;
  lengthFunction;
  constructor(fields) {
    super(fields);
    this.chunkSize = fields?.chunkSize ?? this.chunkSize;
    this.chunkOverlap = fields?.chunkOverlap ?? this.chunkOverlap;
    this.keepSeparator = fields?.keepSeparator ?? this.keepSeparator;
    this.lengthFunction = fields?.lengthFunction ?? ((text) => text.length);
    if (this.chunkOverlap >= this.chunkSize)
      throw new Error("Cannot have chunkOverlap >= chunkSize");
  }
  async transformDocuments(documents, chunkHeaderOptions = {}) {
    return this.splitDocuments(documents, chunkHeaderOptions);
  }
  splitOnSeparator(text, separator) {
    let splits;
    if (separator)
      if (this.keepSeparator) {
        const regexEscapedSeparator = separator.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
        splits = text.split(/* @__PURE__ */ new RegExp(`(?=${regexEscapedSeparator})`));
      } else
        splits = text.split(separator);
    else
      splits = text.split("");
    return splits.filter((s) => s !== "");
  }
  async createDocuments(texts, metadatas = [], chunkHeaderOptions = {}) {
    const _metadatas = metadatas.length > 0 ? metadatas : [...Array(texts.length)].map(() => ({}));
    const { chunkHeader = "", chunkOverlapHeader = "(cont'd) ", appendChunkOverlapHeader = false } = chunkHeaderOptions;
    const documents = new Array();
    for (let i = 0; i < texts.length; i += 1) {
      const text = texts[i];
      let lineCounterIndex = 1;
      let prevChunk = null;
      let indexPrevChunk = -1;
      for (const chunk of await this.splitText(text)) {
        let pageContent = chunkHeader;
        const indexChunk = text.indexOf(chunk, indexPrevChunk + 1);
        if (prevChunk === null) {
          const newLinesBeforeFirstChunk = this.numberOfNewLines(text, 0, indexChunk);
          lineCounterIndex += newLinesBeforeFirstChunk;
        } else {
          const indexEndPrevChunk = indexPrevChunk + await this.lengthFunction(prevChunk);
          if (indexEndPrevChunk < indexChunk) {
            const numberOfIntermediateNewLines = this.numberOfNewLines(text, indexEndPrevChunk, indexChunk);
            lineCounterIndex += numberOfIntermediateNewLines;
          } else if (indexEndPrevChunk > indexChunk) {
            const numberOfIntermediateNewLines = this.numberOfNewLines(text, indexChunk, indexEndPrevChunk);
            lineCounterIndex -= numberOfIntermediateNewLines;
          }
          if (appendChunkOverlapHeader)
            pageContent += chunkOverlapHeader;
        }
        const newLinesCount = this.numberOfNewLines(chunk);
        const loc = _metadatas[i].loc && typeof _metadatas[i].loc === "object" ? { ..._metadatas[i].loc } : {};
        loc.lines = {
          from: lineCounterIndex,
          to: lineCounterIndex + newLinesCount
        };
        const metadataWithLinesNumber = {
          ..._metadatas[i],
          loc
        };
        pageContent += chunk;
        documents.push(new Document({
          pageContent,
          metadata: metadataWithLinesNumber
        }));
        lineCounterIndex += newLinesCount;
        prevChunk = chunk;
        indexPrevChunk = indexChunk;
      }
    }
    return documents;
  }
  numberOfNewLines(text, start, end) {
    const textSection = text.slice(start, end);
    return (textSection.match(/\n/g) || []).length;
  }
  async splitDocuments(documents, chunkHeaderOptions = {}) {
    const selectedDocuments = documents.filter((doc) => doc.pageContent !== void 0);
    const texts = selectedDocuments.map((doc) => doc.pageContent);
    const metadatas = selectedDocuments.map((doc) => doc.metadata);
    return this.createDocuments(texts, metadatas, chunkHeaderOptions);
  }
  joinDocs(docs, separator) {
    const text = docs.join(separator).trim();
    return text === "" ? null : text;
  }
  async mergeSplits(splits, separator) {
    const docs = [];
    const currentDoc = [];
    let total = 0;
    for (const d of splits) {
      const _len = await this.lengthFunction(d);
      if (total + _len + currentDoc.length * separator.length > this.chunkSize) {
        if (total > this.chunkSize)
          console.warn(`Created a chunk of size ${total}, +
which is longer than the specified ${this.chunkSize}`);
        if (currentDoc.length > 0) {
          const doc$1 = this.joinDocs(currentDoc, separator);
          if (doc$1 !== null)
            docs.push(doc$1);
          while (total > this.chunkOverlap || total + _len + currentDoc.length * separator.length > this.chunkSize && total > 0) {
            total -= await this.lengthFunction(currentDoc[0]);
            currentDoc.shift();
          }
        }
      }
      currentDoc.push(d);
      total += _len;
    }
    const doc = this.joinDocs(currentDoc, separator);
    if (doc !== null)
      docs.push(doc);
    return docs;
  }
};
var RecursiveCharacterTextSplitter = class RecursiveCharacterTextSplitter2 extends TextSplitter {
  static lc_name() {
    return "RecursiveCharacterTextSplitter";
  }
  separators = [
    "\n\n",
    "\n",
    " ",
    ""
  ];
  constructor(fields) {
    super(fields);
    this.separators = fields?.separators ?? this.separators;
    this.keepSeparator = fields?.keepSeparator ?? true;
  }
  async _splitText(text, separators) {
    const finalChunks = [];
    let separator = separators[separators.length - 1];
    let newSeparators;
    for (let i = 0; i < separators.length; i += 1) {
      const s = separators[i];
      if (s === "") {
        separator = s;
        break;
      }
      if (text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }
    const splits = this.splitOnSeparator(text, separator);
    let goodSplits = [];
    const _separator = this.keepSeparator ? "" : separator;
    for (const s of splits)
      if (await this.lengthFunction(s) < this.chunkSize)
        goodSplits.push(s);
      else {
        if (goodSplits.length) {
          const mergedText = await this.mergeSplits(goodSplits, _separator);
          finalChunks.push(...mergedText);
          goodSplits = [];
        }
        if (!newSeparators)
          finalChunks.push(s);
        else {
          const otherInfo = await this._splitText(s, newSeparators);
          finalChunks.push(...otherInfo);
        }
      }
    if (goodSplits.length) {
      const mergedText = await this.mergeSplits(goodSplits, _separator);
      finalChunks.push(...mergedText);
    }
    return finalChunks;
  }
  async splitText(text) {
    return this._splitText(text, this.separators);
  }
  static fromLanguage(language, options) {
    return new RecursiveCharacterTextSplitter2({
      ...options,
      separators: RecursiveCharacterTextSplitter2.getSeparatorsForLanguage(language)
    });
  }
  static getSeparatorsForLanguage(language) {
    if (language === "cpp")
      return [
        "\nclass ",
        "\nvoid ",
        "\nint ",
        "\nfloat ",
        "\ndouble ",
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nswitch ",
        "\ncase ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "go")
      return [
        "\nfunc ",
        "\nvar ",
        "\nconst ",
        "\ntype ",
        "\nif ",
        "\nfor ",
        "\nswitch ",
        "\ncase ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "java")
      return [
        "\nclass ",
        "\npublic ",
        "\nprotected ",
        "\nprivate ",
        "\nstatic ",
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nswitch ",
        "\ncase ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "js")
      return [
        "\nfunction ",
        "\nconst ",
        "\nlet ",
        "\nvar ",
        "\nclass ",
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nswitch ",
        "\ncase ",
        "\ndefault ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "php")
      return [
        "\nfunction ",
        "\nclass ",
        "\nif ",
        "\nforeach ",
        "\nwhile ",
        "\ndo ",
        "\nswitch ",
        "\ncase ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "proto")
      return [
        "\nmessage ",
        "\nservice ",
        "\nenum ",
        "\noption ",
        "\nimport ",
        "\nsyntax ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "python")
      return [
        "\nclass ",
        "\ndef ",
        "\n	def ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "rst")
      return [
        "\n===\n",
        "\n---\n",
        "\n***\n",
        "\n.. ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "ruby")
      return [
        "\ndef ",
        "\nclass ",
        "\nif ",
        "\nunless ",
        "\nwhile ",
        "\nfor ",
        "\ndo ",
        "\nbegin ",
        "\nrescue ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "rust")
      return [
        "\nfn ",
        "\nconst ",
        "\nlet ",
        "\nif ",
        "\nwhile ",
        "\nfor ",
        "\nloop ",
        "\nmatch ",
        "\nconst ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "scala")
      return [
        "\nclass ",
        "\nobject ",
        "\ndef ",
        "\nval ",
        "\nvar ",
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\nmatch ",
        "\ncase ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "swift")
      return [
        "\nfunc ",
        "\nclass ",
        "\nstruct ",
        "\nenum ",
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\ndo ",
        "\nswitch ",
        "\ncase ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "markdown")
      return [
        "\n## ",
        "\n### ",
        "\n#### ",
        "\n##### ",
        "\n###### ",
        "```\n\n",
        "\n\n***\n\n",
        "\n\n---\n\n",
        "\n\n___\n\n",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "latex")
      return [
        "\n\\chapter{",
        "\n\\section{",
        "\n\\subsection{",
        "\n\\subsubsection{",
        "\n\\begin{enumerate}",
        "\n\\begin{itemize}",
        "\n\\begin{description}",
        "\n\\begin{list}",
        "\n\\begin{quote}",
        "\n\\begin{quotation}",
        "\n\\begin{verse}",
        "\n\\begin{verbatim}",
        "\n\\begin{align}",
        "$$",
        "$",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else if (language === "html")
      return [
        "<body>",
        "<div>",
        "<p>",
        "<br>",
        "<li>",
        "<h1>",
        "<h2>",
        "<h3>",
        "<h4>",
        "<h5>",
        "<h6>",
        "<span>",
        "<table>",
        "<tr>",
        "<td>",
        "<th>",
        "<ul>",
        "<ol>",
        "<header>",
        "<footer>",
        "<nav>",
        "<head>",
        "<style>",
        "<script>",
        "<meta>",
        "<title>",
        " ",
        ""
      ];
    else if (language === "sol")
      return [
        "\npragma ",
        "\nusing ",
        "\ncontract ",
        "\ninterface ",
        "\nlibrary ",
        "\nconstructor ",
        "\ntype ",
        "\nfunction ",
        "\nevent ",
        "\nmodifier ",
        "\nerror ",
        "\nstruct ",
        "\nenum ",
        "\nif ",
        "\nfor ",
        "\nwhile ",
        "\ndo while ",
        "\nassembly ",
        "\n\n",
        "\n",
        " ",
        ""
      ];
    else
      throw new Error(`Language ${language} is not supported.`);
  }
};

// src/services/embedding.service.ts
import { LiteParse } from "@llamaindex/liteparse";
import * as fs from "fs";
import * as path2 from "path";

// src/services/sanitization.service.ts
function limparOCR(texto) {
  let r = texto;
  r = r.replace(/\uFEFF/g, "");
  r = r.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  r = r.replace(/\uFFFD/g, "");
  r = r.replace(/\u00AD/g, "");
  r = r.replace(/[\u200B-\u200D\u2060\uFE0F]/g, "");
  r = r.replace(/\f/g, "\n");
  return r;
}
function juntarHifenizacao(texto) {
  return texto.replace(/(\w)-\n([a-záàâãéêíóôõúüç])/gi, (_, antes, depois) => {
    const prefixos = /(?:pr[eé]|p[oó]s|semi|anti|auto|contra|extra|infra|inter|intra|macro|micro|mini|multi|neo|proto|pseudo|sobre|sub|super|supra|ultra)$/i;
    if (prefixos.test(antes)) {
      return `${antes}-${depois}`;
    }
    return `${antes}${depois}`;
  });
}
var RE_CABECALHOS = [
  // Cabeçalho institucional completo (pode aparecer em 1 a 4 linhas)
  /SERVI[CÇ]O\s+P[UÚ]BLICO\s+FEDERAL/gi,
  /MINIST[EÉ]RIO\s+DA\s+EDUCA[CÇ][AÃ]O/gi,
  /INSTITUTO\s+FEDERAL\s+DE\s+EDUCA[CÇ][AÃ]O[\s,]*CI[EÊ]NCIA\s+E\s+TECNOLOGIA\s+DE\s+MINAS\s+GERAIS/gi,
  /SECRETARIA\s+DE\s+EDUCA[CÇ][AÃ]O\s+PROFISSIONAL\s+E\s+TECNOL[OÓ]GICA/gi,
  // Variação abreviada: "IFMG - Campus Ouro Branco" ou "IFMG – Campus Ouro Branco"
  /IFMG\s*[-–—]\s*Campus\s+Ouro\s+Branco/gi,
  /Campus\s+Ouro\s+Branco/gi,
  // Endereço institucional (Rua/Av. Afonso Sardinha, nº, bairro, CEP)
  /(?:Rua|Av\.?|Avenida)\s+Afonso\s+Sardinha[^\n]*/gi,
  /CEP[\s.:]*\d{2}\.?\d{3}[-.]?\d{3}/gi,
  // Telefone institucional: (31) 3938-xxxx, 31-3938-xxxx, etc.
  /(?:\(\d{2}\)\s*|\d{2}[-\s])\d{4}[-.\s]\d{4}/g,
  // E-mails institucionais do IFMG
  /[\w.-]+@ifmg\.edu\.br/gi,
  // URLs institucionais
  /(?:https?:\/\/)?(?:www\.)?ifmg\.edu\.br[^\s]*/gi,
  // Rodapés tipo "Página X de Y" ou "X/Y"
  /P[aá]gina\s+\d+\s+de\s+\d+/gi,
  /^\s*\d{1,4}\s*\/\s*\d{1,4}\s*$/gm
];
function removerCabecalhosRodapes(texto) {
  let r = texto;
  for (const regex2 of RE_CABECALHOS) {
    regex2.lastIndex = 0;
    r = r.replace(regex2, "");
  }
  return r;
}
function podarAnexos(texto) {
  const match = texto.match(
    /^[\t ]*(?:ANEXO|AP[EÊ]NDICE)\s+[IVXLCDM\dA-Z]+/im
  );
  if (match && match.index !== void 0) {
    const textoPodado = texto.slice(0, match.index).trim();
    const descartado = texto.length - textoPodado.length;
    console.log(
      `\u2702\uFE0F  [Sanitiza\xE7\xE3o] Anexo detectado ("${match[0].trim()}"). Descartados ${descartado} chars de formul\xE1rios/anexos.`
    );
    return textoPodado;
  }
  return texto;
}
function prepararChunkingJuridico(texto) {
  let r = texto;
  r = r.replace(/([^\n])\n(?!\n)([^\n])/g, (_, antes, depois) => {
    if (/^(?:Art\.\s|CAP[IÍ]TULO|T[IÍ]TULO|Se[cç][aã]o|RESOLU[CÇ])/i.test(depois + r.charAt(0))) {
      return `${antes}

${depois}`;
    }
    return `${antes} ${depois}`;
  });
  const marcadores = [
    /(?<!\n\n)(?=^[\t ]*Art\.\s)/gm,
    // Art. 1º, Art. 2º, ...
    /(?<!\n\n)(?=^[\t ]*CAP[IÍ]TULO\s)/gm,
    // CAPÍTULO I, II, ...
    /(?<!\n\n)(?=^[\t ]*T[IÍ]TULO\s)/gm,
    // TÍTULO I, II, ...
    /(?<!\n\n)(?=^[\t ]*Se[cç][aã]o\s)/gm,
    // Seção I, Seção II, ...
    /(?<!\n\n)(?=^[\t ]*RESOLU[CÇ][AÃ]O\s)/gm,
    // RESOLUÇÃO Nº ...
    /(?<!\n\n)(?=^[\t ]*DAS?\s+DISPOSI[CÇ][OÕ]ES\s)/gm,
    // DAS DISPOSIÇÕES ...
    /(?<!\n\n)(?=^[\t ]*DO\s+REGIME\s)/gm,
    // DO REGIME ...
    /(?<!\n\n)(?=^[\t ]*DA\s+ORGANIZA[CÇ][AÃ]O\s)/gm,
    // DA ORGANIZAÇÃO ...
    /(?<!\n\n)(?=^[\t ]*DOS?\s+DIREITOS?\s)/gm,
    // DOS DIREITOS ...
    /(?<!\n\n)(?=^[\t ]*DOS?\s+DEVERES?\s)/gm
    // DOS DEVERES ...
  ];
  for (const regex2 of marcadores) {
    r = r.replace(regex2, "\n\n");
  }
  return r;
}
var RE = {
  // Marcadores de página inseridos pela extração: "--- Página 5 ---"
  marcadorPagina: /---\s*P[aá]gina\s+\d+\s*---/gi,
  // Pilcrow (¶) e símbolos de parágrafo PDF
  pilcrow: /[¶§]/g,
  // Superíndices e subíndices numéricos unicode (notas de rodapé)
  superSubIndices: /[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g,
  // Separadores decorativos de linha: "||", "| |", "___", "---", "==="
  separadoresDecorativos: /^[\s|_\-=]{3,}$/gm,
  // Linhas que são só pipe e espaço (resíduo de tabela sem conteúdo)
  linhasSoPipe: /^\s*\|[\s|]*\|\s*$/gm,
  // Número de página solto: linha com apenas 1-4 dígitos
  numeroPaginaSolto: /^\s*\d{1,4}\s*$/gm,
  // Sequências de pontuação repetida decorativa: ".....", "-----"
  pontuacaoRepetida: /([.!?=\-_])\1{3,}/g,
  // Aspas tipográficas → ASCII
  aspasCurvas: /[\u201C\u201D]/g,
  aspasSimples: /[\u2018\u2019]/g,
  travessao: /[\u2013\u2014]/g,
  // Múltiplos espaços e tabs → espaço único
  espacosMultiplos: /[ \t]{2,}/g,
  // Mais de 2 quebras de linha consecutivas → parágrafo duplo
  quebrasDeLinhaTriplas: /\n{3,}/g,
  // Linhas com menos de 3 caracteres não-espaço (ruído puro)
  linhasRuido: /^.{0,2}\n/gm
};
function tabelaMarkdownParaTexto(linha) {
  if (!linha.includes("|"))
    return linha;
  if (/^\|[\s\-:|]+\|/.test(linha))
    return "";
  return linha.split("|").map((c) => c.trim()).filter((c) => c.length > 0 && !/^[-:]+$/.test(c)).join(" ");
}
function normalizarLinhasTabela(texto) {
  return texto.split("\n").map(
    (linha) => linha.includes("|") ? tabelaMarkdownParaTexto(linha) : linha
  ).filter((l) => l.trim().length > 0).join("\n");
}
function sanitizarTexto(texto) {
  const tamanhoOriginal = texto.length;
  let r = texto;
  r = limparOCR(r);
  r = juntarHifenizacao(r);
  r = removerCabecalhosRodapes(r);
  r = podarAnexos(r);
  r = r.replace(RE.marcadorPagina, "");
  r = r.replace(RE.pilcrow, "");
  r = r.replace(RE.superSubIndices, "");
  r = r.replace(RE.separadoresDecorativos, "");
  r = r.replace(RE.linhasSoPipe, "");
  r = normalizarLinhasTabela(r);
  r = r.replace(RE.numeroPaginaSolto, "");
  r = r.replace(RE.pontuacaoRepetida, "$1");
  r = r.replace(RE.aspasCurvas, '"');
  r = r.replace(RE.aspasSimples, "'");
  r = r.replace(RE.travessao, "-");
  r = prepararChunkingJuridico(r);
  r = r.replace(RE.espacosMultiplos, " ");
  r = r.replace(RE.linhasRuido, "");
  r = r.replace(RE.quebrasDeLinhaTriplas, "\n\n");
  r = r.trim();
  const reducao = ((tamanhoOriginal - r.length) / tamanhoOriginal * 100).toFixed(1);
  console.log(
    `\u{1F9F9} [Sanitiza\xE7\xE3o] ${tamanhoOriginal} \u2192 ${r.length} chars (redu\xE7\xE3o: ${reducao}%)`
  );
  return r;
}

// src/services/embedding.service.ts
var EMBEDDING_MAX_CHARS = 4e3;
var CHUNK_SIZE_GERAL = 2048;
var CHUNK_OVERLAP_GERAL = 256;
var TABELA_MAX_LINHAS_POR_CHUNK = 30;
var BATCH_SIZE = 32;
async function extrairTextoPDF(buffer, filename) {
  console.log(`\u{1F4C4} [Extra\xE7\xE3o] Iniciando extra\xE7\xE3o avan\xE7ada com LiteParse em "${filename}"...`);
  const tempFilename = `temp_${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const tempPath = path2.resolve(tempFilename);
  await fs.promises.writeFile(tempPath, buffer);
  try {
    const parser = new LiteParse();
    const result = await parser.parse(tempPath);
    const textoFinal = result.text || JSON.stringify(result);
    console.log(`\u{1F4C4} [Extra\xE7\xE3o] Conclu\xEDdo via LiteParse: ${textoFinal.length} caracteres extra\xEDdos de "${filename}"`);
    return textoFinal;
  } catch (error) {
    console.error(`\u274C [Extra\xE7\xE3o] Erro no LiteParse ao processar "${filename}":`, error);
    throw error;
  } finally {
    await fs.promises.unlink(tempPath).catch(() => console.warn(`\u26A0\uFE0F N\xE3o foi poss\xEDvel apagar o arquivo tempor\xE1rio: ${tempPath}`));
  }
}
async function extrairTextoImagem(buffer, filename) {
  console.log(`\u{1F50D} [OCR] Iniciando OCR de "${filename}"...`);
  const worker = await createWorker("por");
  try {
    const { data: { text } } = await worker.recognize(buffer);
    console.log(`\u{1F50D} [OCR] Conclu\xEDdo: ${text.length} caracteres extra\xEDdos de "${filename}"`);
    return text;
  } finally {
    await worker.terminate();
  }
}
async function extrairTextoWord(buffer, filename) {
  console.log(`\u{1F4DD} [Extra\xE7\xE3o] Iniciando extra\xE7\xE3o de documento Word "${filename}"...`);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
async function extrairTextoPlanilha(buffer, filename) {
  console.log(`\u{1F4CA} [Extra\xE7\xE3o] Iniciando extra\xE7\xE3o de planilha "${filename}"...`);
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const planilhas = [];
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length === 0)
      continue;
    const result = [];
    const maxCols = Math.max(...data.map((row) => row.length));
    for (let i = 0; i < data.length; i++) {
      const row = data[i] || [];
      while (row.length < maxCols)
        row.push("");
      const formattedRow = row.map((cell) => String(cell ?? "").replace(/[\n\r\|]/g, " ").trim());
      result.push(`| ${formattedRow.join(" | ")} |`);
      if (i === 0) {
        result.push(`| ${formattedRow.map(() => "---").join(" | ")} |`);
      }
    }
    planilhas.push(`--- Planilha: ${sheetName} ---
${result.join("\n")}`);
  }
  return planilhas.join("\n\n");
}
async function extrairTexto(buffer, filename, mimetype) {
  const nomeLower = filename.toLowerCase();
  if (mimetype === "application/pdf" || nomeLower.endsWith(".pdf")) {
    return extrairTextoPDF(buffer, filename);
  }
  if (mimetype.startsWith("image/") || nomeLower.match(/\.(png|jpe?g)$/)) {
    return extrairTextoImagem(buffer, filename);
  }
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimetype === "application/msword" || nomeLower.endsWith(".docx") || nomeLower.endsWith(".doc")) {
    return extrairTextoWord(buffer, filename);
  }
  if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimetype === "application/vnd.ms-excel" || mimetype === "text/csv" || nomeLower.endsWith(".xlsx") || nomeLower.endsWith(".xls") || nomeLower.endsWith(".csv")) {
    return extrairTextoPlanilha(buffer, filename);
  }
  if (mimetype === "text/plain" || mimetype === "text/markdown" || nomeLower.endsWith(".txt") || nomeLower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }
  throw new Error(`Formato n\xE3o suportado: ${mimetype}`);
}
function gerarNomeDocumento(filename) {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s{2,}/g, " ").trim();
}
function injetarContexto(texto, nomeDocumento, contextoSecao) {
  const partes = [`Documento: ${nomeDocumento}`];
  if (contextoSecao) {
    partes.push(`Contexto: ${contextoSecao}`);
  }
  return `[${partes.join(" | ")}]

${texto}`;
}
function detectarTipoChunking(texto, filename) {
  const separadoresTabela = (texto.match(/\|[\s-]+\|/g) || []).length;
  const linhasComPipe = (texto.match(/^\|.+\|$/gm) || []).length;
  if (separadoresTabela >= 1 && linhasComPipe >= 5)
    return "tabela";
  const artigos = (texto.match(/\bArt\.\s+\d+/g) || []).length;
  const capitulos = (texto.match(/\bCAP[IÍ]TULO\s+[IVXLCDM\d]+/gi) || []).length;
  if (artigos >= 3 || capitulos >= 2)
    return "juridico";
  if (/regulament|norma|resolu[çc]|portaria|edital|delibera|estatut|regimento/i.test(filename)) {
    return "juridico";
  }
  return "geral";
}
async function chunkingJuridico(texto, filename) {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks = [];
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: EMBEDDING_MAX_CHARS - 300,
    // Margem para o prefixo de contexto
    chunkOverlap: 200,
    separators: ["\nCAP\xCDTULO ", "\nT\xCDTULO ", "\nSe\xE7\xE3o ", "\nArt. ", "\n\n", "\n", ". ", " "],
    keepSeparator: true
  });
  const partes = await splitter.splitText(texto);
  let contextoAtual = "";
  for (const parte of partes) {
    const parteTrimmed = parte.trim();
    if (parteTrimmed.length === 0)
      continue;
    const matchHierarquia = parteTrimmed.match(/^(?:CAP[IÍ]TULO|T[IÍ]TULO|Se[cç][aã]o)\s+[IVXLCDM\d]+.*?(?:\n|$)/i);
    if (matchHierarquia) {
      contextoAtual = matchHierarquia[0].trim();
    }
    const conteudoComContexto = injetarContexto(parteTrimmed, nomeDocumento, contextoAtual);
    chunks.push({
      conteudo: conteudoComContexto,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        nomeDocumento,
        tipoChunking: "juridico",
        contextoSecao: contextoAtual
      }
    });
  }
  return chunks;
}
async function chunkingTabela(texto, filename) {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks = [];
  const blocos = separarBlocosTabela(texto);
  for (const bloco of blocos) {
    if (bloco.tipo === "texto") {
      const subChunks = await chunkingGeral(bloco.conteudo, filename, "tabela");
      chunks.push(...subChunks);
      continue;
    }
    const linhas = bloco.conteudo.split("\n").filter((l) => l.trim().length > 0);
    if (linhas.length === 0)
      continue;
    let cabecalho = "";
    let linhasDados = [];
    if (linhas.length >= 2 && /^\|[\s\-:|]+\|/.test(linhas[1])) {
      cabecalho = linhas[0] + "\n" + linhas[1];
      linhasDados = linhas.slice(2);
    } else {
      linhasDados = linhas;
    }
    if (linhasDados.length <= TABELA_MAX_LINHAS_POR_CHUNK) {
      const conteudo = injetarContexto(bloco.conteudo.trim(), nomeDocumento, "Tabela/Matriz");
      chunks.push({
        conteudo,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          nomeDocumento,
          tipoChunking: "tabela",
          contextoSecao: "Tabela/Matriz"
        }
      });
      continue;
    }
    for (let i = 0; i < linhasDados.length; i += TABELA_MAX_LINHAS_POR_CHUNK) {
      const fatia = linhasDados.slice(i, i + TABELA_MAX_LINHAS_POR_CHUNK);
      const parteNum = Math.floor(i / TABELA_MAX_LINHAS_POR_CHUNK) + 1;
      const totalPartes = Math.ceil(linhasDados.length / TABELA_MAX_LINHAS_POR_CHUNK);
      const contexto = `Tabela/Matriz (parte ${parteNum}/${totalPartes})`;
      const tabelaChunk = cabecalho ? `${cabecalho}
${fatia.join("\n")}` : fatia.join("\n");
      const conteudo = injetarContexto(tabelaChunk, nomeDocumento, contexto);
      chunks.push({
        conteudo,
        metadata: {
          filename,
          chunkIndex: chunks.length,
          totalChunks: 0,
          nomeDocumento,
          tipoChunking: "tabela",
          contextoSecao: contexto
        }
      });
    }
  }
  return chunks;
}
function separarBlocosTabela(texto) {
  const linhas = texto.split("\n");
  const blocos = [];
  let blocoAtual = [];
  let tipoAtual = null;
  for (const linha of linhas) {
    const ehLinhaPipe = /^\s*\|.+\|\s*$/.test(linha);
    const tipo = ehLinhaPipe ? "tabela" : "texto";
    if (tipoAtual !== null && tipo !== tipoAtual) {
      const conteudo = blocoAtual.join("\n").trim();
      if (conteudo.length > 0)
        blocos.push({ tipo: tipoAtual, conteudo });
      blocoAtual = [];
    }
    tipoAtual = tipo;
    blocoAtual.push(linha);
  }
  if (blocoAtual.length > 0 && tipoAtual !== null) {
    const conteudo = blocoAtual.join("\n").trim();
    if (conteudo.length > 0)
      blocos.push({ tipo: tipoAtual, conteudo });
  }
  return blocos;
}
async function chunkingGeral(texto, filename, tipoOverride) {
  const nomeDocumento = gerarNomeDocumento(filename);
  const chunks = [];
  const tipo = tipoOverride || "geral";
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE_GERAL,
    chunkOverlap: CHUNK_OVERLAP_GERAL,
    separators: ["\n\n", "\n", ". ", " "]
  });
  const partes = await splitter.splitText(texto);
  for (const parte of partes) {
    if (parte.trim().length === 0)
      continue;
    const conteudo = injetarContexto(parte.trim(), nomeDocumento, "");
    chunks.push({
      conteudo,
      metadata: {
        filename,
        chunkIndex: chunks.length,
        totalChunks: 0,
        nomeDocumento,
        tipoChunking: tipo,
        contextoSecao: ""
      }
    });
  }
  return chunks;
}
async function dividirEmChunks(texto, filename) {
  const tipoChunking = detectarTipoChunking(texto, filename);
  console.log(`\u{1F500} [Roteamento] "${filename}" \u2192 estrat\xE9gia: ${tipoChunking.toUpperCase()}`);
  let chunks;
  switch (tipoChunking) {
    case "juridico":
      chunks = await chunkingJuridico(texto, filename);
      break;
    case "tabela":
      chunks = await chunkingTabela(texto, filename);
      break;
    case "geral":
    default:
      chunks = await chunkingGeral(texto, filename);
      break;
  }
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }
  console.log(`\u2702\uFE0F  [Chunking] "${filename}" \u2192 ${chunks.length} chunks (tipo: ${tipoChunking})`);
  return chunks;
}
function truncarParaEmbedding(texto) {
  if (texto.length <= EMBEDDING_MAX_CHARS)
    return texto;
  console.warn(`\u26A0\uFE0F [Embedding] Chunk com ${texto.length} chars excede o limite. Truncando.`);
  const corte = texto.lastIndexOf(". ", EMBEDDING_MAX_CHARS);
  return corte > EMBEDDING_MAX_CHARS * 0.5 ? texto.slice(0, corte + 1).trim() : texto.slice(0, EMBEDDING_MAX_CHARS).trim();
}
async function vetorizarEGravar(chunks) {
  let gravados = 0;
  let errosDimensao = 0;
  let outrosErros = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchLabel = `[Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}]`;
    console.log(`\u{1F522} [Embedding] ${batchLabel} Processando ${batch.length} chunks em paralelo...`);
    const results = await Promise.allSettled(
      batch.map(async (chunk, j) => {
        const idx = i + j;
        const progresso = `[${idx + 1}/${chunks.length}]`;
        const conteudoSeguro = truncarParaEmbedding(chunk.conteudo);
        const embedding = await gerarEmbeddingOllama(conteudoSeguro);
        const vectorStr = `[${embedding.join(",")}]`;
        await pool.query(
          `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`,
          [conteudoSeguro, JSON.stringify(chunk.metadata), vectorStr]
        );
        console.log(`\u{1F4BE} [Banco] ${progresso} Chunk gravado (${embedding.length} dimens\xF5es)`);
      })
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        gravados++;
      } else {
        const errMsg = result.reason?.message || String(result.reason);
        if (errMsg.includes("expected") && errMsg.includes("dimensions")) {
          errosDimensao++;
          if (errosDimensao === 1) {
            console.error(`\u274C [Embedding] ERRO DE DIMENS\xC3O...`);
          }
        } else {
          outrosErros++;
          console.error(`\u274C [Embedding] Erro no lote: ${errMsg}`);
        }
      }
    }
    if (errosDimensao > 0 && gravados === 0 && i + BATCH_SIZE >= chunks.length)
      break;
  }
  return gravados;
}
async function processarDocumento(buffer, filename, mimetype = "application/pdf") {
  console.log(`
${"=".repeat(60)}`);
  console.log(`\u{1F680} [Ingest\xE3o] Processando "${filename}" (${mimetype})`);
  console.log(`${"=".repeat(60)}
`);
  const inicio = Date.now();
  const textoRaw = await extrairTexto(buffer, filename, mimetype);
  if (textoRaw.trim().length === 0) {
    return { mensagem: "O arquivo n\xE3o cont\xE9m texto extra\xEDvel.", arquivo: filename, totalChunks: 0, chunksGravados: 0 };
  }
  const texto = sanitizarTexto(textoRaw);
  const chunks = await dividirEmChunks(texto, filename);
  const chunksGravados = await vetorizarEGravar(chunks);
  const duracao = ((Date.now() - inicio) / 1e3).toFixed(1);
  const falhas = chunks.length - chunksGravados;
  if (chunksGravados === 0 && chunks.length > 0) {
    console.error(`\u274C [Ingest\xE3o] "${filename}" FALHOU em ${duracao}s \u2014 0/${chunks.length} chunks gravados`);
    return {
      mensagem: `Falha na ingest\xE3o: nenhum chunk foi gravado (0/${chunks.length}). Poss\xEDvel causa de dimens\xE3o.`,
      arquivo: filename,
      totalChunks: chunks.length,
      chunksGravados: 0
    };
  }
  if (falhas > 0) {
    console.warn(`\u26A0\uFE0F  [Ingest\xE3o] "${filename}" conclu\xEDdo com erros em ${duracao}s \u2014 ${chunksGravados}/${chunks.length} chunks (${falhas} falhas)`);
  } else {
    console.log(`\u2705 [Ingest\xE3o] "${filename}" conclu\xEDdo em ${duracao}s \u2014 ${chunksGravados}/${chunks.length} chunks`);
  }
  return {
    mensagem: falhas > 0 ? `Documento processado parcialmente em ${duracao}s. ${falhas} chunk(s) falharam.` : `Documento processado com sucesso em ${duracao}s.`,
    arquivo: filename,
    totalChunks: chunks.length,
    chunksGravados
  };
}
async function listarDocumentosProcessados() {
  try {
    const result = await pool.query(`
      SELECT metadata->>'filename' AS filename, COUNT(*) AS total_chunks, MAX(created_at) AS ultima_atualizacao
      FROM documents GROUP BY metadata->>'filename' ORDER BY MAX(created_at) DESC
    `);
    return result.rows.map((row) => ({ filename: row.filename, totalChunks: Number(row.total_chunks), ultimaAtualizacao: row.ultima_atualizacao }));
  } catch (error) {
    console.error("[Embedding] Erro ao listar documentos:", error);
    return [];
  }
}
async function removerDocumento(filename) {
  console.log(`\u{1F5D1}\uFE0F  [Remo\xE7\xE3o] Removendo "${filename}" do banco...`);
  const result = await pool.query(`DELETE FROM documents WHERE metadata->>'filename' = $1`, [filename]);
  const removidos = result.rowCount ?? 0;
  console.log(`\u{1F5D1}\uFE0F  [Remo\xE7\xE3o] ${removidos} chunks removidos`);
  return removidos;
}

// src/controllers/embedding.controller.ts
var TIPOS_ACEITOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // .docx
  "application/msword",
  // .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // .xlsx
  "application/vnd.ms-excel",
  // .xls
  "text/csv",
  // .csv
  "text/plain",
  // .txt
  "text/markdown",
  // .md
  "image/jpeg",
  // .jpg, .jpeg
  "image/png"
  // .png
];
async function uploadDocumento(req, res) {
  try {
    const arquivo = req.file;
    if (!arquivo) {
      res.status(400).json({
        erro: "Nenhum arquivo foi enviado. Envie um PDF no campo 'arquivo'."
      });
      return;
    }
    if (!TIPOS_ACEITOS.includes(arquivo.mimetype)) {
      res.status(400).json({
        erro: `Tipo de arquivo n\xE3o suportado: ${arquivo.mimetype}. Aceitos: PDF, Word, Excel, CSV, TXT, MD, Imagens.`
      });
      return;
    }
    const MAX_SIZE = 20 * 1024 * 1024;
    if (arquivo.size > MAX_SIZE) {
      res.status(400).json({
        erro: `Arquivo muito grande (${(arquivo.size / 1024 / 1024).toFixed(1)} MB). M\xE1ximo: 20 MB.`
      });
      return;
    }
    console.log(
      `\u{1F4E4} [Upload] Recebido: "${arquivo.originalname}" (${(arquivo.size / 1024).toFixed(0)} KB)`
    );
    const resultado = await processarDocumento(
      arquivo.buffer,
      arquivo.originalname,
      arquivo.mimetype
    );
    res.status(200).json(resultado);
  } catch (error) {
    console.error("[EmbeddingController] Erro no upload:", error);
    const mensagemErro = error instanceof Error && error.message.includes("Ollama") ? "O servidor Ollama est\xE1 offline. Verifique se est\xE1 rodando e tente novamente." : "Erro interno ao processar o documento. Tente novamente.";
    res.status(500).json({ erro: mensagemErro });
  }
}
async function listarDocumentos(_req, res) {
  try {
    const documentos = await listarDocumentosProcessados();
    res.status(200).json({ documentos });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao listar documentos:", error);
    res.status(500).json({ erro: "Erro ao listar documentos processados." });
  }
}
async function deletarDocumento(req, res) {
  try {
    const { filename } = req.params;
    if (!filename) {
      res.status(400).json({ erro: "Nome do arquivo n\xE3o fornecido." });
      return;
    }
    const removidos = await removerDocumento(filename);
    if (removidos === 0) {
      res.status(404).json({ erro: "Documento n\xE3o encontrado no banco." });
      return;
    }
    res.status(200).json({
      mensagem: `Documento '${filename}' removido com sucesso.`,
      chunksRemovidos: removidos
    });
  } catch (error) {
    console.error("[EmbeddingController] Erro ao deletar documento:", error);
    res.status(500).json({ erro: "Erro ao excluir o documento." });
  }
}

// src/routes/embedding.routes.ts
var EXTENSOES_ACEITAS = /\.(pdf|docx?|xlsx?|csv|txt|md|jpe?g|png)$/i;
var MIMES_ACEITOS = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png"
]);
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
    // 20 MB
  },
  fileFilter: (_req, file, cb) => {
    const mimeOk = MIMES_ACEITOS.has(file.mimetype);
    const extOk = EXTENSOES_ACEITAS.test(file.originalname);
    if (mimeOk && extOk) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo n\xE3o permitido: ${file.mimetype} (${file.originalname})`));
    }
  }
});
var embeddingRouter = Router2();
embeddingRouter.post("/upload", upload.single("arquivo"), uploadDocumento);
embeddingRouter.get("/documentos", listarDocumentos);
embeddingRouter.delete("/documentos/:filename", deletarDocumento);

// src/routes/agent.routes.ts
import { Router as Router3 } from "express";

// src/services/mcp_agent.service.ts
import { Client as Client2 } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import { dirname, resolve as resolve2 } from "path";
var OLLAMA_BASE_URL2 = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
var LLM_MODEL2 = process.env.OLLAMA_LLM_MODEL || "qwen3.5:4b";
var NUM_CTX2 = Number(process.env.OLLAMA_NUM_CTX) || 8192;
var FETCH_TIMEOUT_MS2 = 38e4;
var AGENT_SYSTEM_PROMPT = `Voc\xEA \xE9 o assistente virtual oficial do IFMG Campus Ouro Branco.

Voc\xEA tem acesso a uma ferramenta de busca nos documentos oficiais (cursos, PPC, regulamentos, portarias, ementas). USE ESTA FERRAMENTA para responder perguntas sobre regulamentos acad\xEAmicos, PPC, grade curricular, TCC, est\xE1gio, atividades complementares e normas gerais do campus.

REGRAS OBRIGAT\xD3RIAS:
1. SEMPRE use a ferramenta search_ifmg_knowledge antes de responder perguntas acad\xEAmicas ou sobre normas do campus.
2. Ao gerar o par\xE2metro 'query' na ferramenta de busca:
   - Extraia APENAS palavras-chave principais e nomes pr\xF3prios (proibido usar frases completas, pronomes ou conectivos).
   - SEMPRE EXPANDA SIGLAS acad\xEAmicas (ex: TCC -> Trabalho de Conclus\xE3o de Curso, PPC -> Projeto Pedag\xF3gico do Curso, AC -> Atividades Complementares, IRA -> \xCDndice de Rendimento Acad\xEAmico).
3. Ao gerar o par\xE2metro 'intent', classifique a inten\xE7\xE3o estritamente em uma destas 10 categorias:
   - INGRESSO_MATRICULA: Vestibular, SISU, transfer\xEAncias, trancamento, renova\xE7\xE3o de matr\xEDcula.
   - ESTRUTURA_CURSOS: Matriz curricular, PPC, dura\xE7\xE3o de cursos, regras gerais dos cursos do campus.
   - DISCIPLINA_EMENTA: Carga hor\xE1ria espec\xEDfica, pr\xE9-requisitos, conte\xFAdo program\xE1tico, ementas, bibliografia.
   - AVALIACAO_FREQUENCIA: Pontua\xE7\xE3o, provas, aprova\xE7\xE3o, limite de faltas (25%), abono/atestados.
   - TCC: Regras, documenta\xE7\xE3o, orientadores e bancas de Trabalho de Conclus\xE3o de Curso.
   - ATIVIDADES_EXTRAS: Horas complementares (AAC), pesquisa, extens\xE3o, monitoria.
   - ASSISTENCIA_BOLSAS: Assist\xEAncia estudantil, aux\xEDlios (moradia, transporte), bolsas de estudo.
   - INFRA_CAMPUS: Biblioteca, laborat\xF3rios, restaurante, hor\xE1rios de funcionamento, setores administrativos.
   - DIREITOS_DEVERES: Regime disciplinar, deveres dos alunos, penalidades, direitos discentes.
   - OUTRAS: Para qualquer outro assunto acad\xEAmico ou geral.
4. Use EXCLUSIVAMENTE as informa\xE7\xF5es retornadas pela ferramenta. N\xE3o invente ou complemente com conhecimento externo.
5. FILTRE ESTRITAMENTE: Extraia APENAS a informa\xE7\xE3o pontual que responde \xE0 pergunta do usu\xE1rio. \xC9 EXPRESSAMENTE PROIBIDO gerar longos blocos de texto, ementas completas ou eixos curriculares se a pergunta for apenas sobre listar mat\xE9rias ou verificar carga hor\xE1ria.
6. Se a ferramenta n\xE3o retornar resultados relevantes, diga: "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do seu curso ou o setor correspondente do IFMG."
7. Cite a fonte (nome do documento) quando poss\xEDvel.
8. Para sauda\xE7\xF5es simples (ol\xE1, bom dia), responda diretamente sem usar a ferramenta.

DIRETIVAS DE IDIOMA E FORMATA\xC7\xC3O:
- REGRA ABSOLUTA: Responda EXCLUSIVAMENTE em Portugu\xEAs do Brasil (pt-BR).
- ECONOMIA DE TOKENS: Seja extremamente direto e conciso. N\xE3o enrole na introdu\xE7\xE3o ou conclus\xE3o.
- FORMATA\xC7\xC3O SIMPLES: Use bullet points ('* ') APENAS no n\xEDvel principal. NUNCA crie listas aninhadas ou recuos secund\xE1rios.
- Use **negrito** para destacar os termos principais (Ex: nomes das mat\xE9rias).`;
var mcpClient = null;
var ollamaTools = [];
async function inicializarMCPClient() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const mcpServerPath = resolve2(
      __dirname,
      "..",
      "..",
      "mcp-server",
      "dist",
      "index.js"
    );
    console.log(`\u{1F50C} [MCP Client] Conectando ao servidor: ${mcpServerPath}`);
    const transport = new StdioClientTransport({
      command: "node",
      args: [mcpServerPath],
      env: {
        ...process.env,
        // Propaga variáveis de ambiente para o subprocesso
        DATABASE_URL: process.env.DATABASE_URL || "",
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "",
        OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL || ""
      }
    });
    mcpClient = new Client2(
      { name: "chatifme-agent", version: "1.0.0" },
      { capabilities: {} }
    );
    await mcpClient.connect(transport);
    console.log("\u2705 [MCP Client] Conectado ao servidor MCP");
    const { tools } = await mcpClient.listTools();
    console.log(
      `\u{1F527} [MCP Client] ${tools.length} ferramenta(s) dispon\xEDvel(is):`
    );
    tools.forEach((t) => console.log(`   \u2022 ${t.name}: ${t.description}`));
    ollamaTools = tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema
      }
    }));
  } catch (error) {
    console.error("\u274C [MCP Client] Falha ao conectar:", error);
    throw error;
  }
}
async function encerrarMCPClient() {
  if (mcpClient) {
    await mcpClient.close();
    console.log("\u{1F50C} [MCP Client] Desconectado");
  }
}
async function processarPerguntaAgente(pergunta, res, sessionId) {
  if (!mcpClient) {
    throw new Error("[Agente] MCP Client n\xE3o inicializado");
  }
  const dataHora = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
  console.log(`
${"\u2500".repeat(50)}`);
  console.log(`\u{1F916} [Agente] Nova pergunta: "${pergunta}"`);
  console.log(`\u{1F4C5} [Agente] Data/Hora: ${dataHora}`);
  if (sessionId)
    console.log(`\u{1F9E0} [Agente] Sess\xE3o: ${sessionId.substring(0, 8)}...`);
  console.log(`${"\u2500".repeat(50)}`);
  if (sessionId && isSessionExpired(sessionId)) {
    console.log(`\u23F0 [Agente] Sess\xE3o expirada: ${sessionId.substring(0, 8)}...`);
    res.write(`data: ${JSON.stringify({ type: "session_expired" })}

`);
    res.write(`data: [DONE]

`);
    return;
  }
  const session = sessionId ? getOrCreateSession(sessionId) : null;
  const perguntaContextualizada = session ? resolverReferencias(pergunta, session) : pergunta;
  const inicio = Date.now();
  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando pergunta..." })}

`);
  if (detectGreetingBypass(perguntaContextualizada)) {
    console.log(`\u{1F680} [Agente] Fast-path ativado: sauda\xE7\xE3o detectada localmente.`);
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}

`);
    await streamStaticGreeting(res);
    if (session) {
      updateSession(session.sessionId, pergunta, "GREETING", STATIC_GREETING_RESPONSE);
    }
    const duracao2 = ((Date.now() - inicio) / 1e3).toFixed(1);
    console.log(`\u23F1\uFE0F  [Agente] Fast-path conclu\xEDdo em ${duracao2}s (sem busca/ferramentas)
`);
    return;
  }
  const messages = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    { role: "user", content: perguntaContextualizada }
  ];
  console.log(
    `\u{1F9E0} [Agente] Passo 1: Enviando ao Ollama com ${ollamaTools.length} ferramenta(s)...`
  );
  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando inten\xE7\xE3o..." })}

`);
  const firstResponse = await fetch(`${OLLAMA_BASE_URL2}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS2),
    body: JSON.stringify({
      model: LLM_MODEL2,
      messages,
      tools: ollamaTools,
      stream: false,
      keep_alive: "24h",
      options: {
        num_ctx: NUM_CTX2,
        temperature: 0,
        num_predict: 512
      }
    })
  });
  if (!firstResponse.ok) {
    const errorText = await firstResponse.text();
    throw new Error(`[Ollama] Erro ${firstResponse.status}: ${errorText}`);
  }
  const firstData = await firstResponse.json();
  const assistantMessage = firstData.message;
  if (!assistantMessage) {
    throw new Error("[Ollama] Resposta sem message");
  }
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    console.log(
      `\u{1F527} [Agente] Passo 2: Ollama solicitou ${assistantMessage.tool_calls.length} chamada(s) de ferramenta`
    );
    messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
      tool_calls: assistantMessage.tool_calls
    });
    const fontes = [];
    res.write(`data: ${JSON.stringify({ type: "status", status: "Buscando nos documentos..." })}

`);
    for (const toolCall of assistantMessage.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      console.log(
        `   \u{1F4DE} [Agente] Chamando ferramenta: ${name}(${JSON.stringify(args)})`
      );
      try {
        const toolResult = await mcpClient.callTool({
          name,
          arguments: args
        });
        const resultText = toolResult.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
        console.log(
          `   \u2705 [Agente] Resultado: ${resultText.substring(0, 80)}...`
        );
        const fontesMatch = resultText.match(
          /\(fonte: ([^,]+), similaridade/g
        );
        if (fontesMatch) {
          fontesMatch.forEach((f3) => {
            const match = f3.match(/fonte: ([^,]+)/);
            if (match)
              fontes.push(match[1]);
          });
        }
        messages.push({
          role: "tool",
          tool_name: name,
          content: resultText
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`   \u274C [Agente] Erro ao executar ${name}: ${msg}`);
        messages.push({
          role: "tool",
          tool_name: name,
          content: `Erro ao buscar documentos: ${msg}`
        });
      }
    }
    res.write(`data: ${JSON.stringify({ type: "fontes", fontes })}

`);
  } else {
    console.log(
      "\u{1F4AC} [Agente] Passo 2: Sem tool_calls \u2014 resposta direta"
    );
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}

`);
    messages.push({
      role: "assistant",
      content: assistantMessage.content || ""
    });
    res.write(
      `data: ${JSON.stringify({ type: "fontes", fontes: [] })}

`
    );
    if (assistantMessage.content) {
      res.write(
        `data: ${JSON.stringify({ type: "token", content: assistantMessage.content })}

`
      );
      res.write(`data: [DONE]

`);
      const duracao2 = ((Date.now() - inicio) / 1e3).toFixed(1);
      console.log(
        `\u23F1\uFE0F  [Agente] Pipeline conclu\xEDdo em ${duracao2}s (sem ferramentas)
`
      );
      if (session) {
        updateSession(session.sessionId, pergunta, "", assistantMessage.content);
      }
      return;
    }
  }
  console.log("\u{1F30A} [Agente] Passo 3: Gerando resposta final com streaming...");
  const messagesFinal = [
    ...messages,
    {
      role: "system",
      content: "DIRETIVA FINAL OBRIGAT\xD3RIA: Sua resposta deve ser baseada EXCLUSIVAMENTE nos trechos de documentos retornados pela ferramenta acima. N\xC3O se apresente, N\xC3O liste suas capacidades. Responda diretamente a pergunta do usu\xE1rio usando os dados dos documentos. Responda em Portugu\xEAs do Brasil (pt-BR). Ignore trechos de outras disciplinas n\xE3o relacionadas \xE0 pergunta."
    }
  ];
  const streamResponse = await fetch(`${OLLAMA_BASE_URL2}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS2),
    body: JSON.stringify({
      model: LLM_MODEL2,
      messages: messagesFinal,
      stream: true,
      keep_alive: "1h",
      options: { num_ctx: NUM_CTX2 }
    })
  });
  if (!streamResponse.ok) {
    const errorText = await streamResponse.text();
    throw new Error(
      `[Ollama Stream] Erro ${streamResponse.status}: ${errorText}`
    );
  }
  if (!streamResponse.body) {
    throw new Error("[Ollama Stream] Corpo da resposta vazio");
  }
  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gerouTokens = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
          continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (chunk.message?.content) {
            gerouTokens = true;
            res.write(
              `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`
            );
          }
          if (chunk.done) {
            console.log("\u{1F916} [Agente] Gera\xE7\xE3o conclu\xEDda pelo Ollama");
          }
        } catch {
        }
      }
    }
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim());
        if (chunk.message?.content) {
          gerouTokens = true;
          res.write(
            `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}

`
          );
        }
      } catch {
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (!gerouTokens) {
    console.warn("\u26A0\uFE0F [Agente] Resposta vazia no streaming. Enviando fallback.");
    const fallbackMsg = "N\xE3o encontrei essa informa\xE7\xE3o nos documentos dispon\xEDveis. Recomendo consultar a coordena\xE7\xE3o do curso ou acessar o portal do IFMG.";
    res.write(
      `data: ${JSON.stringify({ type: "token", content: fallbackMsg })}

`
    );
  }
  res.write(`data: [DONE]

`);
  const duracao = ((Date.now() - inicio) / 1e3).toFixed(1);
  if (session) {
    updateSession(session.sessionId, pergunta, "", "");
  }
  console.log(`\u23F1\uFE0F  [Agente] Pipeline streaming conclu\xEDdo em ${duracao}s
`);
}

// src/controllers/agent.controller.ts
async function enviarPerguntaAgente(req, res) {
  try {
    const { pergunta, sessionId } = req.body;
    if (!pergunta || typeof pergunta !== "string") {
      res.status(400).json({
        erro: "O campo 'pergunta' \xE9 obrigat\xF3rio e deve ser uma string."
      });
      return;
    }
    const perguntaTrimmed = pergunta.trim();
    if (perguntaTrimmed.length < 3) {
      res.status(400).json({
        erro: "A pergunta deve ter pelo menos 3 caracteres."
      });
      return;
    }
    if (perguntaTrimmed.length > 1e3) {
      res.status(400).json({
        erro: "A pergunta deve ter no m\xE1ximo 1000 caracteres."
      });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    req.on("close", () => {
      console.log("\u{1F50C} [SSE Agent] Cliente desconectou");
    });
    await comControleDeConcorrencia(async () => {
      await processarPerguntaAgente(perguntaTrimmed, res, sessionId);
    });
    res.end();
  } catch (error) {
    console.error("[AgentController] Erro:", error);
    if (res.headersSent) {
      const mensagemErro = error instanceof Error && error.message.includes("Ollama") ? "O servidor de IA ficou inacess\xEDvel. Tente novamente." : "Ocorreu um erro durante a gera\xE7\xE3o da resposta.";
      res.write(
        `data: ${JSON.stringify({ type: "erro", mensagem: mensagemErro })}

`
      );
      res.end();
    } else {
      res.status(500).json({
        erro: "Erro interno ao processar sua pergunta."
      });
    }
  }
}

// src/routes/agent.routes.ts
var agentRouter = Router3();
agentRouter.post("/", enviarPerguntaAgente);

// src/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";
var chatLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Muitas requisi\xE7\xF5es. Aguarde um momento e tente novamente."
  }
});
var uploadLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Limite de uploads atingido. Tente novamente em 1 minuto."
  }
});

// src/middlewares/adminAuth.ts
function adminAuth(req, res, next) {
  if (req.method === "GET") {
    next();
    return;
  }
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    next();
    return;
  }
  const provided = req.headers["x-api-key"];
  if (!provided || provided !== apiKey) {
    res.status(401).json({
      erro: "Acesso n\xE3o autorizado. Chave de API inv\xE1lida ou ausente."
    });
    return;
  }
  next();
}

// src/server.ts
var app = express();
app.set("trust proxy", true);
var PORT = Number(process.env.PORT) || 3333;
var allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origem n\xE3o permitida pelo CORS: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);
app.use(express.json());
app.use("/api/chat", chatLimiter, chatRouter);
app.use("/api/agent", chatLimiter, agentRouter);
app.use("/api/embedding", uploadLimiter, adminAuth, embeddingRouter);
app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  try {
    await pool.query("SELECT 1");
    dbOk = true;
  } catch {
  }
  let ollamaStatus = { ok: false, models: [] };
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const r = await fetch(`${ollamaUrl}/api/tags`);
    const data = await r.json();
    ollamaStatus = { ok: true, models: data.models?.map((m) => m.name) || [] };
  } catch {
  }
  const queueStatus = ollamaSemaphore.getStatus();
  const allOk = dbOk && ollamaStatus.ok;
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbOk,
      ollama: ollamaStatus
    },
    queue: queueStatus,
    sessions: getSessionStats(),
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`
    }
  });
});
var server = app.listen(PORT, async () => {
  console.log(`
\u{1F680} Servidor rodando na porta ${PORT}`);
  console.log(`\u{1F4E1} Chat (RAG):         POST /api/chat`);
  console.log(`\u{1F916} Agent (MCP):        POST /api/agent`);
  console.log(`\u{1F4E4} Upload endpoint:    POST /api/embedding/upload`);
  console.log(`\u{1F4CB} Documentos:         GET  /api/embedding/documentos`);
  console.log(`\u{1F49A} Health check:       GET  /api/health
`);
  await testarConexaoDB();
  await verificarDimensaoEmbedding();
  await verificarOllama();
  try {
    await inicializarMCPClient();
  } catch (error) {
    console.error("\u26A0\uFE0F  MCP Client n\xE3o dispon\xEDvel \u2014 rota /api/agent inoperante");
  }
  console.log("");
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `
\u274C Porta ${PORT} j\xE1 est\xE1 em uso. Encerre o processo anterior ou use outra porta:
   npx kill-port ${PORT}
`
    );
    process.exit(1);
  }
  throw err;
});
process.on("SIGINT", async () => {
  limparTodasSessoes();
  await encerrarMCPClient();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  limparTodasSessoes();
  await encerrarMCPClient();
  process.exit(0);
});
/*! Bundled license information:

@langchain/core/dist/utils/fast-json-patch/src/helpers.js:
  (*!
  * https://github.com/Starcounter-Jack/JSON-Patch
  * (c) 2017-2022 Joachim Wester
  * MIT licensed
  *)

@langchain/core/dist/utils/fast-json-patch/src/duplex.js:
  (*!
  * https://github.com/Starcounter-Jack/JSON-Patch
  * (c) 2013-2021 Joachim Wester
  * MIT license
  *)
*/
//# sourceMappingURL=server.js.map
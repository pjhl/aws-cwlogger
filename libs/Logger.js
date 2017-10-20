const util = require('util');
const EventEmitter = require('events');

const OPTIONS = Symbol();
const QUEUE = Symbol();

class Logger extends EventEmitter {

  /**
   * Create Logger
   * @param {object} options    Options
   */
  constructor(options = {}) {
    super();
    const {enabled = true, consolePrint = true, flushDelay = 1000, maxBatchCount = 5000, maxBatchSize = 1000000} = options;
    // Options
    this[OPTIONS] = {
      /**
       * Enable saving logs to queue (default: true)
       * @type {boolean}
       */
      enabled: enabled,
      /**
       * Print errors into console (default: true)
       * @type {boolean}
       */
      consolePrint: consolePrint,
      /**
       * Delay in ms. between sending messages (default: 1000)
       * @type {number}
       */
      flushDelay: flushDelay,
      /**
       * Max messages to send in butch (default: 5000).
       * The real maximum number of log events in a batch is 10,000.
       * @type {number}
       */
      maxBatchCount: maxBatchCount,
      /**
       * The maximum batch size (default: 1000000).
       * The real max size is 1,048,576 bytes, and this size is calculated as the sum of all event messages in UTF-8,
       * plus 26 bytes for each log event.
       * @type {number}
       */
      maxBatchSize: maxBatchSize
    };
    // Queue of messages: {message: {string}, timestamp: {number}}
    this[QUEUE] = [];

    // Start timer to send log events periodically
    this._startTimer();
  }

  /**
   * Log
   * @param level
   * @param args
   * @private
   */
  _log(level = 'log', ...args) {
    // With category
    let cat = undefined, msg = '';
    if (args.length === 1 && typeof args[0] === 'object' && args[0].$category) {
      cat = args[0].$category;
      msg = util.format(...args[0].$messages);
      // Print into console
      if (this[OPTIONS].consolePrint) {
        console[level](`<<${cat}>>:`, ...args[0].$messages);
      }
    } else {
      msg = util.format(...args);
      // Print into console
      if (this[OPTIONS].consolePrint) {
        console[level](...args);
      }
    }
    if (this[OPTIONS].enabled) {
      // Add to queue
      this[QUEUE].push({
        message: JSON.stringify({
          level: level,
          cat: cat,
          msg: msg
        }),
        timestamp: new Date().getTime()
      });
    }
  }

  log(...args) {
    return this._log('log', ...args);
  }

  info(...args) {
    return this._log('info', ...args);
  }

  warn(...args) {
    return this._log('warn', ...args);
  }

  error(...args) {
    return this._log('error', ...args);
  }

  /**
   * Set log category
   * @param {string} name
   * @return {object}
   */
  cat(name = '') {
    const $this = this;
    return {
      log(...args) {
        return $this.log({$category: name, $messages: args});
      },
      info(...args) {
        return $this.info({$category: name, $messages: args});
      },
      warn(...args) {
        return $this.warn({$category: name, $messages: args});
      },
      error(...args) {
        return $this.error({$category: name, $messages: args});
      }
    }
  }

  /**
   * Start timer to send log events periodically
   * @private
   */
  _startTimer() {
    if (this._destroyed || this._timer) {
      return;
    }
    this._timer = setTimeout(() => {
      this._timer = null;
      this._sendChunk();
    }, this[OPTIONS].flushDelay);
  }

  /**
   * Send chunk of messages
   * @private
   */
  _sendChunk() {
    if (this[QUEUE].length > 0) {
      // Search messages
      let batchSize = 0, posEnd = 0;
      for (let i = 0; i < this[QUEUE].length; i++) {
        const msg = this[QUEUE][i].message;
        // Current message size (+ 26 bytes overhead)
        const currentMessageSize = msg.length + 26;
        // Check limit "maxBatchSize"
        if (batchSize + currentMessageSize > this[OPTIONS].maxBatchSize) {
          break;
        }
        // Check limit "maxBatchCount"
        if (i >= this[OPTIONS].maxBatchCount) {
          break;
        }
        posEnd = i;
        batchSize += currentMessageSize;
      }
      // Slice messages
      const messages = this[QUEUE].slice(0, posEnd + 1);
      if (messages.length === 0) {
        this._startTimer();
        return;
      }
      // Create functions
      let executed = '';
      const resolve = () => {
        if (executed !== '') {
          throw new Error(`Method "${executed}" was executed before`);
        }
        executed = 'resolve';
        this[QUEUE].splice(0, posEnd + 1);
        this._startTimer();
      };
      const reject = () => {
        if (executed !== '') {
          throw new Error(`Method "${executed}" was executed before`);
        }
        executed = 'reject';
        this._startTimer();
      };

      this.onSend(messages, resolve, reject);
      return;
    }
    this._startTimer();
  }

  /**
   * Send batch event
   * @param {[]} messages       List of messages to send: {message: {string}, timestamp: {number}}
   * @param {function} resolve  Approve sending
   * @param {function} reject   Reject sending (it will be repeated after a while)
   */
  onSend(messages, resolve, reject) {
    this.destroy();
    throw new Error('Function "onSend" must be overridden.');
  }

  /**
   * Destroy logger (shutdown timer and stop sending messages)
   */
  destroy() {
    this._destroyed = true;
    if (this._timer) {
      clearTimeout(this._timer);
    }
  }

  /**
   * Returns count of elements in queue
   */
  get count() {
    return this[QUEUE].length;
  }

}

module.exports = Logger;
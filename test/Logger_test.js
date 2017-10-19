const assert = require('assert');
const Logger = require('../libs/Logger');

describe('Logger', function () {

  describe('console-like methods', function () {

    it('should support simple (without category) run', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve, reject) => {
        assert(Array.isArray(messages));
        assert.strictEqual(typeof resolve, 'function');
        assert.strictEqual(typeof reject, 'function');
        assert.strictEqual(messages.length, 4);
        assert.strictEqual(messages[0].message, '{"level":"log","msg":"qwerty"}');
        assert(!!messages[0].timestamp);
        assert.strictEqual(messages[1].message, '{"level":"info","msg":"qwerty"}');
        assert(!!messages[1].timestamp);
        assert.strictEqual(messages[2].message, '{"level":"warn","msg":"qwerty"}');
        assert(!!messages[2].timestamp);
        assert.strictEqual(messages[3].message, '{"level":"error","msg":"qwerty"}');
        assert(!!messages[3].timestamp);
        assert.strictEqual(logger.count, 4);
        resolve();
        assert.strictEqual(logger.count, 0);
        logger.destroy();
        done();
      };
      // All log methods
      logger.log('qwerty');
      assert.strictEqual(logger.count, 1);
      logger.info('qwerty');
      assert.strictEqual(logger.count, 2);
      logger.warn('qwerty');
      assert.strictEqual(logger.count, 3);
      logger.error('qwerty');
      assert.strictEqual(logger.count, 4);
    });

    it('should support categories', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve, reject) => {
        assert(Array.isArray(messages));
        assert.strictEqual(typeof resolve, 'function');
        assert.strictEqual(typeof reject, 'function');
        assert.strictEqual(messages.length, 4);
        assert.strictEqual(messages[0].message, '{"level":"log","cat":"test","msg":"qwerty"}');
        assert(!!messages[0].timestamp);
        assert.strictEqual(messages[1].message, '{"level":"info","cat":"test","msg":"qwerty"}');
        assert(!!messages[1].timestamp);
        assert.strictEqual(messages[2].message, '{"level":"warn","cat":"test","msg":"qwerty"}');
        assert(!!messages[2].timestamp);
        assert.strictEqual(messages[3].message, '{"level":"error","cat":"test","msg":"qwerty"}');
        assert(!!messages[3].timestamp);
        assert.strictEqual(logger.count, 4);
        resolve();
        assert.strictEqual(logger.count, 0);
        logger.destroy();
        done();
      };
      // All log methods
      logger.cat('test').log('qwerty');
      assert.strictEqual(logger.count, 1);
      logger.cat('test').info('qwerty');
      assert.strictEqual(logger.count, 2);
      logger.cat('test').warn('qwerty');
      assert.strictEqual(logger.count, 3);
      logger.cat('test').error('qwerty');
      assert.strictEqual(logger.count, 4);
    });
  });

  describe('#onSend()', function () {
    it('should to send one message', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve, reject) => {
        assert(Array.isArray(messages));
        assert.strictEqual(typeof resolve, 'function');
        assert.strictEqual(typeof reject, 'function');
        assert.strictEqual(messages.length, 1);
        assert.strictEqual(messages[0].message, '{"level":"info","msg":"qwerty"}');
        assert(!!messages[0].timestamp);
        assert.strictEqual(logger.count, 1);
        resolve();
        assert.strictEqual(logger.count, 0);
        logger.destroy();
        done();
      };
      logger.info('qwerty');
    });

    it('should to send multiple messages', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1, maxBatchCount: 2});
      let count = 0;
      logger.onSend = (messages, resolve, reject) => {
        // Method "onSend" must be executed twice due to batch size limit
        if (count++ === 0) {
          assert(Array.isArray(messages));
          assert.strictEqual(typeof resolve, 'function');
          assert.strictEqual(typeof reject, 'function');
          assert.strictEqual(messages.length, 2); // Batch size limit: 2
          assert.strictEqual(messages[0].message, '{"level":"log","msg":"qwerty"}');
          assert.strictEqual(messages[1].message, '{"level":"warn","msg":"asdfgh"}');
          assert.strictEqual(logger.count, 3);
          resolve();
          assert.strictEqual(logger.count, 1);
        } else {
          assert(Array.isArray(messages));
          assert.strictEqual(typeof resolve, 'function');
          assert.strictEqual(typeof reject, 'function');
          assert.strictEqual(messages.length, 1);
          assert.strictEqual(messages[0].message, '{"level":"log","msg":"zxcvbn"}');
          assert.strictEqual(logger.count, 1);
          resolve();
          assert.strictEqual(logger.count, 0);
          logger.destroy();
          done();
        }
      };
      logger.log('qwerty');
      logger.warn('asdfgh');
      logger.log('zxcvbn');
    });

    it('should support #reject()', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      let count = 0;
      logger.onSend = (messages, resolve, reject) => {
        if (count++ === 0) {
          assert(Array.isArray(messages));
          assert.strictEqual(typeof resolve, 'function');
          assert.strictEqual(typeof reject, 'function');
          assert.strictEqual(messages.length, 1);
          assert.strictEqual(messages[0].message, '{"level":"info","msg":"qwerty"}');
          assert.strictEqual(logger.count, 1);
          reject();
          assert.strictEqual(logger.count, 1);
        } else {
          // This block should run on second try
          assert(Array.isArray(messages));
          assert.strictEqual(typeof resolve, 'function');
          assert.strictEqual(typeof reject, 'function');
          assert.strictEqual(messages.length, 1);
          assert.strictEqual(messages[0].message, '{"level":"info","msg":"qwerty"}');
          resolve();
          assert.strictEqual(logger.count, 0);
          logger.destroy();
          done();
        }
      };
      logger.info('qwerty');
    });

    it('should not allow #resolve() twice', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve) => {
        resolve();
        assert.throws(resolve, Error);
        logger.destroy();
        done();
      };
      logger.info('qwerty');
    });

    it('should not allow #reject() twice', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve, reject) => {
        reject();
        assert.throws(reject, Error);
        logger.destroy();
        done();
      };
      logger.info('qwerty');
    });

    it('should not allow #resolve() then #reject()', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve, reject) => {
        resolve();
        assert.throws(reject, Error);
        logger.destroy();
        done();
      };
      logger.info('qwerty');
    });

    it('should not allow #reject() then #resolve()', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve, reject) => {
        reject();
        assert.throws(resolve, Error);
        logger.destroy();
        done();
      };
      logger.info('qwerty');
    });

    it('should suport "maxBatchSize" limit', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1, maxBatchSize: 50});
      let count = 0;
      logger.onSend = (messages, resolve, reject) => {
        // Method "onSend" must be executed twice due to batch size limit
        if (count++ === 0) {
          assert(Array.isArray(messages));
          assert.strictEqual(typeof resolve, 'function');
          assert.strictEqual(typeof reject, 'function');
          assert.strictEqual(messages.length, 1);
          assert.strictEqual(messages[0].message, '{"level":"error","msg":"one"}');
          assert.strictEqual(logger.count, 2);
          resolve();
          assert.strictEqual(logger.count, 1);
        } else {
          assert(Array.isArray(messages));
          assert.strictEqual(typeof resolve, 'function');
          assert.strictEqual(typeof reject, 'function');
          assert.strictEqual(messages.length, 1);
          assert.strictEqual(messages[0].message, '{"level":"error","msg":"two"}');
          assert.strictEqual(logger.count, 1);
          resolve();
          assert.strictEqual(logger.count, 0);
          logger.destroy();
          done();
        }
      };
      logger.error('one');
      logger.error('two');
    });

    it('should support different log types and arguments count', function (done) {
      const logger = new Logger({consolePrint: false, flushDelay: 1});
      logger.onSend = (messages, resolve, reject) => {
        assert(Array.isArray(messages));
        assert.strictEqual(typeof resolve, 'function');
        assert.strictEqual(typeof reject, 'function');
        assert.strictEqual(messages.length, 7);
        assert.strictEqual(messages[0].message, '{"level":"log","msg":"true"}');
        assert.strictEqual(messages[1].message, '{"level":"log","msg":"{ a: 1 }"}');
        assert.strictEqual(messages[2].message, '{"level":"log","msg":"[]"}');
        assert.strictEqual(messages[3].message, '{"level":"log","msg":"[ 1, 2, 3 ]"}');
        assert.strictEqual(messages[4].message, '{"level":"log","msg":"NaN"}');
        assert.strictEqual(messages[5].message, '{"level":"warn","msg":"1 2"}');
        assert.strictEqual(messages[6].message, '{"level":"warn","msg":"{ a: 1 } [ 2, 3 ]"}');
        assert.strictEqual(logger.count, 7);
        resolve();
        assert.strictEqual(logger.count, 0);
        logger.destroy();
        done();
      };
      // Different args
      logger.log(true);
      logger.log({a: 1});
      logger.log([]);
      logger.log([1, 2, 3]);
      logger.log(NaN);
      // More then 1 argument
      logger.warn(1, 2);
      logger.warn({a: 1}, [2, 3]);
    });

  });
});
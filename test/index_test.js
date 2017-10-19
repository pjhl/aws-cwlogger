const assert = require('assert');
const CWLogger = require('../libs/index');
// Local config for AWS
const config = require('./config/config');

describe("CWLogger", function () {

  this.timeout(10000);

  it('should push logs on CloudWatch Logs', function (done) {
    const logger = new CWLogger(Object.assign({}, config, {
      consolePrint: false,
      flushDelay: 10
    }));

    assert(logger instanceof CWLogger);

    logger.log('Who let the dogs out?');
    logger.info({text: 'Search for dogs', rewarding: '$20'});
    logger.warn(['Rewarding', 'is', 'a', 'lot']);
    logger.error({view: '#@)₴?$0'}, [5, '/', 5]);

    logger.cat('test-cat').log('Who let the dogs out?');
    logger.cat('test-cat').info({text: 'Search for dogs', rewarding: '$20'});
    logger.cat('test-cat').warn(['Rewarding', 'is', 'a', 'lot']);
    logger.cat('test-cat').error({view: '#@)₴?$0'}, [5, '/', 5]);

    logger.on('success', messagesSent => {
      assert.strictEqual(messagesSent.length, 8);
      assert.strictEqual(logger.count, 0, 'There is no messages in queue (all sent)');
      logger.destroy();
      done();
    });
  });

});
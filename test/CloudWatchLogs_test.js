const assert = require('assert');
const CloudWatchLogs = require('../libs/CloudWatchLogs');
// Local config for AWS
const config = require('./config/config');

describe("CloudWatchLogs", function () {

  this.timeout(10000);

  it('should post messages', function () {
    return new CloudWatchLogs(config)
      .put([{
        message: "Test_message1",
        timestamp: new Date().getTime()
      }])
      .then(() => {
        assert(true);
      });
  });

  it('should not post messages in nonexistent group', function (done) {
    new CloudWatchLogs(Object.assign({}, config, {groupName: 'UN' + Math.random()}))
      .put([{
        message: "Test_message2",
        timestamp: new Date().getTime()
      }])
      .then(() => {
        done('Must be an unreachable');
      })
      .catch(err => {
        assert.strictEqual(err.code, 'AccessDeniedException');
        done();
      });
  });

  it('should not post messages in nonexistent stream', function (done) {
    new CloudWatchLogs(Object.assign({}, config, {streamName: 'UN' + Math.random()}))
      .put([{
        message: "Test_message3",
        timestamp: new Date().getTime()
      }])
      .then(() => {
        done('Must be an unreachable');
      })
      .catch(err => {
        assert(err.message.indexOf('is not found in group') !== -1);
        done();
      });
  });

});
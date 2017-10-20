const AWS = require('aws-sdk');


/**
 * CloudWatch Logs integration.
 * Usage example:
 *
 * new CloudWatchLogs({
 *   // AWS access
 *   accessKeyId: "XXXXXXXXXXXXXXXXXXXX",
 *   secretAccessKey: "XXXXXXxXXXXXXXXxXXxXXxXXXXXXXXXxXXXXXxXX",
 *   region: "eu-central-1",
 *   // Logs destination
 *   groupName: "test_group",
 *   streamName: "test_stream"
 * })
 * .put([{
 *    message: "Message body",
 *    timestamp: new Date().getTime()
 *  }])
 * .then(() => {
 *    // Put success
 *  })
 * .catch(err => {
 *    // Process error
 *    throw err;
 *  });
 */
class CloudWatchLogs {

  constructor(options) {
    const {
      enabled = true,
      accessKeyId = null,
      secretAccessKey = null,
      region = 'eu-central-1',
      groupName = '',
      streamName = ''
    } = options;

    this.enabled = enabled;
    this.sequenceToken = null;
    this.groupName = groupName;
    this.streamName = streamName;

    if (this.enabled) {
      if (!accessKeyId) {
        throw new Error('CloudWatchLogs constructor: option "accessKeyId" is required.');
      }
      if (!secretAccessKey) {
        throw new Error('CloudWatchLogs constructor: option "secretAccessKey" is required.');
      }
      if (!groupName) {
        throw new Error('CloudWatchLogs constructor: option "groupName" is required.');
      }
      if (!streamName) {
        throw new Error('CloudWatchLogs constructor: option "groupName" is required.');
      }

      // Create Amazon api object
      this._awsCWL = new AWS.CloudWatchLogs({
        apiVersion: '2014-03-28',
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: region
      });
    }
  }

  /**
   * This function updates "sequenceToken" from existent stream (this.sequenceToken)
   * @return {Promise}
   * @private
   */
  _getToken() {
    return new Promise((resolve, reject) => {
      this._awsCWL
        .describeLogStreams({
          logGroupName: this.groupName,
          logStreamNamePrefix: this.streamName
        }, (err, data) => {
          if (err) {
            return reject(err);
          }
          const stream = data.logStreams.find(val => val.logStreamName === this.streamName);
          if (!stream) {
            return reject(new Error(`CloudWatchLogs error: stream "${this.streamName}" is not found in group "${this.groupName}"`));
          }
          this.sequenceToken = stream.uploadSequenceToken;
          resolve();
        });
    });
  }

  /**
   * Put log events on AWS CloudWatch logs
   * @param {[]} messages   List of messages: {message: {string}, timestamp: {number}} (see new Date().getTime())
   * @return {Promise}
   */
  put(messages) {
    if (!this.enabled) {
      return new Promise((resolve, reject) => reject('CloudWatch option "enabled": false'));
    }
    if (!this.sequenceToken) {
      // Get token then put
      return this
        ._getToken()
        .then(() => this._put(messages));
    }
    return this._put(messages);
  }

  _put(messages) {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(messages)) {
        return reject('Param "messages" must be an array.');
      }

      this._awsCWL.putLogEvents({
        logGroupName: this.groupName,
        logStreamName: this.streamName,
        logEvents: messages,
        sequenceToken: this.sequenceToken
      }, (err, data) => {
        if (err) {
          if (err.code === 'InvalidSequenceTokenException') {
            // Repeat after getting token
            return resolve(this._getToken().then(() => this._put(messages)));
          }
          return reject(err);
        }
        this.sequenceToken = data.nextSequenceToken;
        resolve();
      });
    });
  }
}

module.exports = CloudWatchLogs;
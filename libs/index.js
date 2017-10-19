const Logger = require('./Logger');
const CloudWatchLogs = require('./CloudWatchLogs');

class CWLogger extends Logger {

  constructor(options = {}) {
    super(options);
    this._cwlogs = new CloudWatchLogs(options);
  }

  /**
   * @inheritDoc
   */
  onSend(messages, resolve, reject) {
    // TODO: change format, remove temp code below
    const messages2 = messages.map(val => ({message: val, timestamp: new Date().getTime()}));

    // Adapter for AWS CloudWatch Logs
    this._cwlogs
      .put(messages2)
      .then(() => {
        resolve();
        this.emit('success', messages);
      })
      .catch(err => {
        console.error('CWLogger onSend:', err);
        reject();
      });
  }

}

module.exports = CWLogger;
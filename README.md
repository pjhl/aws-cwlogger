AWS CloudWatch LOGGER [![Build Status](https://travis-ci.org/pjhl/aws-cwlogger.svg?branch=master)](https://travis-ci.org/pjhl/aws-cwlogger)
---------------------

This is simple logger to send logs into
[AWS CloudWatch Logs](http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html) stream.

### Usage:

```javascript
const CWLogger = require('aws-cwlogger');
const logger = new CWLogger({
  // AWS access
  accessKeyId: "XXXXXXXXXXXXXXXXXXXX",
  secretAccessKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  region: "eu-central-1",
  // Logs destination
  groupName: "test_group",
  streamName: "test_stream"
});

logger.log('Text message');
logger.info({text: 'Supported all data types!'});
logger.warn(['Including'], {_: 'multiple arguments'});
logger.error(false);

logger.cat('category-name').log('Categories supported.');
logger.cat('category-name').info('with');
logger.cat('category-name').warn('all 4');
logger.cat('category-name').error('methods');
```

After that you should see in console:

```text
Text message
{ text: 'Supported all data types!' }
[ 'Including' ] { _: 'multiple arguments' }
false
<<category-name>>: Categories supported.
<<category-name>>: with
<<category-name>>: all 4
<<category-name>>: methods
```

And in **AWS console - CloudWatch - Logs**:

![AWS CloudWatch logs screen](/docs/screen-aws-cloudwatch-logs.png)

### Options:

| Param             | Type          | Description |
|-------------------|---------------|-------------|
| enabled           | {boolean}     | Enable sending logs to CloudWatch (default: `true`). Leave the option `false` to don't save logs into CloudWatch Logs |
| accessKeyId*      | {string}      | AWS API key |
| secretAccessKey*  | {string}      | AWS API secret |
| region*           | {string}      | AWS region (default: `eu-central-1`) |
| groupName*        | {string}      | CloudWatch log group name |
| streamName*       | {string}      | CloudWatch log stream name in group |
| consolePrint      | {boolean}     | Print errors into console (default: `true`) |
| flushDelay        | {number}      | Delay in ms. between sending messages (default: `1000`) |
| maxBatchCount     | {number}      | Max messages to send in butch (default: 5000) |
| maxBatchSize      | {number}      | The maximum batch size (default: 1000000) |

    P.S. IAM user should have permissions for actions
    ["logs:DescribeLogGroups","logs:DescribeLogStreams","logs:PutLogEvents"]
    P.P.S. Do not use root user for the security reasons!


INSTALL
-------

```bash
npm install aws-cwlogger --save
```


RUN TESTS
---------

### 1. Create CloudWatch Logs group and stream:

1.  Go to "AWS Console" - "Services" - "CloudWatch" - Tab "Logs"
2.  Create group (ex. `cwlogger-test`)
3.  Go to created group and create stream (ex. `test`)
4.  Go back to tab "Logs" and enabled column "ARN" in table.
5.  Copy your group's ARN in clipboard, you need it on the next step.

### 2. Create AWS IAM user (ex. `cwlogger-test`)

*   Make checked **Programmatic access**
*   Don't check **AWS Management Console access**

With permission:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:eu-central-1:665544332211:log-group:cwlogger-test:*"
            ]
        }
    ]
}
```

**Don't forget to replace "Resource" with your ARN.**

### 3. Configure test

```bash
cp test/config/example.config.js test/config/config.js
nano test/config/config.js
```

### 4. Run tests

```bash
npm install
npm test
```

LICENSE
-------

MIT
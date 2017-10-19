AWS CloudWatch LOGGER
---------------------

[![Build Status](https://travis-ci.org/pjhl/aws-cwlogger.svg?branch=master)](https://travis-ci.org/pjhl/aws-cwlogger)



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

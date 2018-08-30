*still updating*

Trying it yourself
==========
`git clone (project url)`
`npm install`
add your login info to the .ENV file
`npm start`
message yourself or have someone message you on facebook

Overview
==========

This is a facebook chat bot that you can run from your account. When a message
is sent to you, if a certain thing is sent, something will be automatically sent
back.

Commands
=========
Color:


Challenges
=============
1. When calling for a specific department like this:
```
var request = require('request');
request('http://api.umd.io/v0/courses?dept_id=math', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
...
```
A slash is added to the end, making the request go to http://api.umd.io/v0/courses?dept_id=math/
which returns empty body. I want the request to go to http://api.umd.io/v0/courses?dept_id=math

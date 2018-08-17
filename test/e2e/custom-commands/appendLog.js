/**
 * appendLog.js Nightwatch custom command that appends browser console log entries to a text file
 * appendLog can be used like this in your nicht watch test
 * <pre>
 *    'TestCase1': function (browser) {
 *       browser.url(browser.launchUrl)
 *        .waitForElementVisible('body > div > div.container > p', 5000)
 *        .appendLog(logFilePath)         // should normally be the last command before .end()
*         .end();
 * </pre>
 *
 * <h3>Configuration</h3>
 * You can either simply pass the path to the log file in the call itself,
 * or you can configre appendLog in your nightwatch.conf.js
 *
 * <pre>
 * "test_settings": {
 *   "default": {
 *     "launch_url" : "http://localhost:1234",
 *     "selenium_port": 4444,
 *     "selenium_host": "localhost",
 *     "globals" : {
 *       "log2File" : "test/e2e/logs/chrome_console.log",
 *       "log2Console" : true,
 *       "logTestNames" : true
 *     }
 *   }
 * }
 * </pre>
 *
 * See http://nightwatchjs.org/guide#writing-custom-commands
 */

var fs = require('fs')
var util = require('util');
var events = require('events');

function AppendLog() {
  events.EventEmitter.call(this);
}

util.inherits(AppendLog, events.EventEmitter);

AppendLog.prototype.command = function(logFile, callback) {
  var self = this;
  this.api.globals.appendToLog = this.api.globals.appendToLog || {}
  var logFile = logFile || this.api.globals.appendToLog.log2File
  //console.log("   AppendLog to "+logFile+ "test name = "+self.api.currentTest.name)
  if (!logFile) { 
    console.log("WARN: need logFile to AppendLog")
    return
  }

  self.api.getLog('browser', logEntries => {
    var logStream = fs.createWriteStream(logFile, {'flags': 'a'}); // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logEntries.forEach(log => {
      var parsedMsg = log.message.match(/.*"(.*)"/)   // every log.message contains the script file name as prefix. We parse out only the console message only between the quotation marks
      var msgStr = '   [' + log.level + '] ' + log.timestamp + ' : ' + parsedMsg[1]
      if (self.api.globals.appendToLog.log2Console) { console.log(msgStr) }
      if (self.api.globals.appendToLog.logTestNames) {
        logStream.write(" # "+self.api.currentTest.name)
      }
      logStream.write(msgStr+"\n")
    })
    logStream.end()
  })

 setTimeout(function() {
    if (callback) { callback.call(self.client.api) }  // if we have a callback, call it right before the complete event
    self.emit('complete');
  }, 10)                     // complete after 10m

  return this                // for nightwatch's nice fluid syntax
}


module.exports = AppendLog;
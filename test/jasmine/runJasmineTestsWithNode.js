/**
 * I love jasmine because its so nice and fast
 * Ok, no browser involved here. These are just some very quick SMOKE tests.
 */
console.log("======= Running JASMINE tests in projectBaseDir: "+ __dirname)

var Jasmine = require('jasmine');
var log = require('loglevel');
var chalk = require('chalk')

// very simple quick'n'dirty hash function
var getColorFromStr = function(str) {
  if (str === undefined || str.length == 0) return chalk.white
  var hash = 0;
  for (var i = str.length; i--; ) {
    hash += str.charCodeAt(i);
  }
  var chalkColors = [ chalk.red, chalk.green, chalk.yellow, chalk.blue, chalk.magenta, chalk.cyan]
  return chalkColors[ hash % chalkColors.length ]
};

// loglevel Plugin to create colorfull log output using 'chalk'
var originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName) {
    var rawMethod = originalFactory(methodName, logLevel, loggerName);
    var logLevelNames = ['TRACE', 'DEBUG', 'INFO ', 'WARN ', 'ERROR']
    var messageColor  = getColorFromStr(loggerName)

    return function (message) {
      rawMethod(chalk.cyan.underline(loggerName) + " " +
                chalk.bold.magenta(logLevelNames[logLevel]) + " " +
                messageColor(message) );
    };
};
log.setLevel("info")  // trace == log everything
// log.getLogger("DelegationService").setLevel("TRACE");  // enable per module logging


/*  // jasmine-console-reporter is much better than jasmine-terminal-reporter :-)
// https://www.npmjs.com/package/jasmine-terminal-reporter
var Reporter = require('jasmine-terminal-reporter');
var reporter = new Reporter({
  isVerbose: true,
  includeStackTrace: true
})
*/

var jasmine = new Jasmine({projectBaseDir: __dirname});

// Nice colorful jasmine reports for the console
// https://github.com/onury/jasmine-console-reporter
var JasmineConsoleReporter = require('jasmine-console-reporter');
var reporter = new JasmineConsoleReporter({
    colors: 1,           // (0|false)|(1|true)|2
    cleanStack: 1,       // (0|false)|(1|true)|2|3
    verbosity: 4,        // (0|false)|1|2|(3|true)|4
    listStyle: 'indent', // "flat"|"indent"
    activity: false
});
jasmine.addReporter(reporter);

jasmine.loadConfigFile(__dirname+'/jasmineConf.json');

// run everything, or the tests that contain the string passed as argument to this script
jasmine.execute(null, process.argv[2]);
//jasmine.execute();

/**
 * I love jasmine because its so nice and fast.
 * Ok, no browser involved here. These are just some very quick SMOKE tests.
 */
console.log("======= Running JASMINE tests in projectBaseDir: "+ __dirname)
console.log("Usage:       babel-node runJasmineTestsWithNode.js <TestNameFilter>")

//MAYBE: Test with injected mocks: http://vue-loader.vuejs.org/en/workflow/testing-with-mocks.html
//MAYBE: USe Minilog for logging. With streams. http://mixu.net/minilog/

var Jasmine = require('jasmine');
var loglevel = require("loglevel")
var log = loglevel.getLogger("runJasmine");
var chalk = require('chalk')

// =================================================================================
//   Configure JASMINE test framework
// =================================================================================
var jasmine = new Jasmine({projectBaseDir: __dirname});

jasmine.loadConfigFile(__dirname+'/jasmineConf.json');

jasmine.onComplete(function(passed) {
  mockLiquidoBackend.stopHttpServer();
});

// =================================================================================
// Nice colorful jasmine reports for the console
// https://github.com/onury/jasmine-console-reporter
// =================================================================================
var JasmineConsoleReporter = require('jasmine-console-reporter');
var reporter = new JasmineConsoleReporter({
    colors: 1,           // (0|false)|(1|true)|2
    cleanStack: 1,       // (0|false)|(1|true)|2|3
    verbosity: 4,        // (0|false)|1|2|(3|true)|4
    listStyle: 'indent', // "flat"|"indent"
    activity: false
});
jasmine.addReporter(reporter);

// =================================================================================
//  'loglevel' plugin to create colorfull log output using 'chalk'
// =================================================================================
var originalFactory = loglevel.methodFactory;
loglevel.methodFactory = function (methodName, logLevel, loggerName) {
    var rawMethod = originalFactory(methodName, logLevel, loggerName);
    var logLevelNames = ['TRACE', 'DEBUG', 'INFO ', 'WARN ', 'ERROR']
    return function (...messages) {
      rawMethod("         "+    // indent log messages under jasmine spec headers
        chalk.cyan.underline(loggerName) + " " +
        chalk.magenta("("+logLevel+")"+logLevelNames[logLevel]) + " " +
        chalk.white(messages.join(" "))
      );
    };
};

loglevel.setLevel("trace")      // Global loglevel, trace == log everything including stack trace
//loglevel.getLogger("DelegationService").setLevel("TRACE");  // enable per module logging
loglevel.getLogger("BaseRestClient").setLevel("INFO");

// =================================================================================
//   Start mock backend server
// =================================================================================
var mockLiquidoBackend = require('../mockLiquidoBackend/mockLiquidoBackendServer.js')

mockLiquidoBackend.startHttpServer();


// =================================================================================
//  Execute Jasmine test runner
//  Will filter for tests names that matcht the given argument (if any)
// =================================================================================
jasmine.execute(null, process.argv[2]);


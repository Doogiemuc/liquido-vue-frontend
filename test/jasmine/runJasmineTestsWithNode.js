/**
 * I love jasmine because its so nice and fast.
 * Ok, no browser involved here. These are just some very quick SMOKE tests.
 */
console.log("======= Running JASMINE tests in projectBaseDir: "+ __dirname)
console.log("Usage:       babel-node runJasmineTestsWithNode.js <TestNameFilter>")

//MAYBE: Test with injected mocks: http://vue-loader.vuejs.org/en/workflow/testing-with-mocks.html

var Jasmine = require('jasmine');
var log = require('loglevel');
var chalk = require('chalk')


// =================================================================================
//   Start mock backend server
// =================================================================================
var mockLiquidoBackend = require('../mockLiquidoBackend/mockLiquidoBackendServer.js')

mockLiquidoBackend.startHttpServer();

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
var originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName) {
    var rawMethod = originalFactory(methodName, logLevel, loggerName);
    var logLevelNames = ['DEBUG', 'TRACE', 'INFO ', 'WARN ', 'ERROR']

    return function (message) {
      rawMethod("         "+    // indent log messages under jasmine spec headers
        chalk.cyan.underline(loggerName) + " " +
        chalk.magenta(logLevelNames[logLevel]) + " " +
        chalk.white(message)
      );
    };
};

log.setLevel("trace")      // trace == log everything including stack trace
log.getLogger("DelegationService").setLevel("TRACE");  // enable per module logging



// =================================================================================
//  Execute Jasmine test runner
//  Will filter for tests names that matcht the given argument (if any)
// =================================================================================
jasmine.execute(null, process.argv[2]);


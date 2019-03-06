/**
 * I love jasmine because its so nice and fast.
 * Ok, no browser involved here. These are just some very quick SMOKE tests.
 * Usage:    babel-node runJasmineTestsWithNode.js <TestNameFilter>
 */
console.log("======= Running JASMINE tests in projectBaseDir: "+ __dirname)
if (process.argv[2] !== undefined) {
  console.log("     Spec Filter: "+process.argv[2])
}


//MAYBE: Test with injected mocks: http://vue-loader.vuejs.org/en/workflow/testing-with-mocks.html
//MAYBE: USe Minilog for logging. With streams. http://mixu.net/minilog/

var Jasmine = require('jasmine');
var loglevel = require("loglevel")
var log = loglevel.getLogger("runJasmine");
var chalk = require('chalk')
var Config = require('merge-config');

// =================================================================================
//   Configure JASMINE test framework
// =================================================================================
var jasmine = new Jasmine({projectBaseDir: __dirname});
jasmine.loadConfigFile(__dirname+'/jasmineConf.json');
jasmine.onComplete(function(passed) {
  mockLiquidoBackend.stopHttpServer();
});

// Merge environment variables from test.env.js into process.env
var config = new Config();
config.env();         // Add all existing environment variables into configuration
//config.argv();      // Add all command-line arguments into merged configuration
config.merge(require('../../config/test.env.js'));    // Merge test specific env variables
process.env = config.get();

// =================================================================================
// Nice colorful jasmine reports for the console
// https://github.com/onury/jasmine-console-reporter
// =================================================================================
var JasmineConsoleReporter = require('jasmine-console-reporter');
var reporter = new JasmineConsoleReporter({
    colors: 1,           // (0|false)|(1|true)|2
    cleanStack: 1,       // (0|false)|(1|true)|2|3
    verbosity: 4,        // (0|false)|1|2|(3|true)|4
    activity: false,
    listStyle: 'indent', // "flat"|"indent"
});
jasmine.addReporter(reporter);

// =================================================================================
//  'loglevel' plugin to create colorfull log output using 'chalk'
//  https://github.com/pimterry/loglevel
// =================================================================================
// Yes I know, I am a logging fanatic :-)
var originalFactory = loglevel.methodFactory;
loglevel.methodFactory = function (methodName, logLevel, loggerName) {
    var rawMethod = originalFactory(methodName, logLevel, loggerName);
    var logLevelNames = ['TRACE', 'DEBUG', 'INFO ', 'WARN ', 'ERROR']
    return function (...messages) {
      rawMethod("       " +logLevel+" "+    // indent log messages under jasmine spec headers
        chalk.magenta(logLevelNames[logLevel]) + " " +
        chalk.cyan.underline(("                    "+loggerName).slice(-25)  ) + " " +
        chalk.white(messages.join(" "))
      );
    };
};
loglevel.setLevel(loglevel.getLevel()); // Be sure to call setLevel method in order to apply plugin


loglevel.setLevel("trace")      // Global loglevel, trace == log everything including stack trace
//loglevel.getLogger("DelegationService").setLevel("TRACE");  // enable per module logging
//loglevel.getLogger("SessionCache").setLevel("TRACE");

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


/**
 * I love jasmine because its so nice and fast
 * Ok, no browser involved here. These are just some very quick SMOKE tests.
 */

var Jasmine = require('jasmine');
var jasmine = new Jasmine();

/*  // jasmine-console-reporter is much better than jasmine-terminal-reporter :-)
// https://www.npmjs.com/package/jasmine-terminal-reporter
var Reporter = require('jasmine-terminal-reporter');
var reporter = new Reporter({
  isVerbose: true,
  includeStackTrace: true
})
*/

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

jasmine.execute();

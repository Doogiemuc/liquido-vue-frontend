// Run Selenium-webdriver with Jasmine
// Adapted from https://buddy.works/guides/how-write-selenium-tests-in-nodejs-with-webdriver
//
//    node .\node_modules\jasmine\bin\jasmine.js .\test\jasmine-selenium\spec\happyCaseJasmine.js
//
//TODO: Also try http://nemo.js.org/pages/getting-started.html


/*
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
*/

const {Builder, By, Key, until} = require('selenium-webdriver')

//var Jasmine = require('jasmine');
//var jasmine = new Jasmine();

var ironCapabilities = require("../ironCapabilities.json")
//console.log("====== ironCapabilities ======")
//console.log(ironCapabilities)

var chrome = require('selenium-webdriver/chrome');
var path = require('chromedriver').path;
console.log("====== chromeddriver.path ======")
console.log(path)

var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

/*
var htmlReporter = new jasmine.HtmlReporter({
  env: env,
  onRaiseExceptionsClick: function() { queryString.setParam("catch", !env.catchingExceptions()); },
  getContainer: function() { return document.body; },
  createElement: function() { return document.createElement.apply(document, arguments); },
  createTextNode: function() { return document.createTextNode.apply(document, arguments); },
  timer: new jasmine.Timer()
});
*/

describe('basic test', function () {
	var driver;
	it('should get the driver', function (done) {
		driver = new Builder()
		.withCapabilities(ironCapabilities)
		//.forBrowser('iron')
		//.usingServer('http://localhost:4444/wd/hub')
		.build();
		expect(driver).not.toBeNull();
		done();
	});


	it('should load google.com', function (done) {
		driver.get('http://localhost:3001')
		driver.wait(until.elementsLocated(By.id('NavLoginButton')))
		driver.findElement(By.id('NavLoginButton')).click()
		driver.quit().then(_ => done())

	}, 5000);

});
/**
 * login.js Nightwatch custom command to (fake) login of a liquido user via SMS code
 */

var util = require('util');
var events = require('events');

function Login() {
  events.EventEmitter.call(this);
}

util.inherits(Login, events.EventEmitter);

Login.prototype.command = function(mobile, callback) {
  var self = this;
	if (!mobile ) {
    console.log("ERROR: need moblie phonenumber to login via SMS")
    throw new Error("Need mobile phone number to login via SMS")
  }
  this.client.api
    .url(this.client.api.launchUrl+"/#/login")
    .waitForElementPresent("#phoneInput", 2000, "On login page")
    .setValue("#phoneInput", mobile)
		.click("#requestSmsCodeButton")
		.waitForElementVisible("#smsCodeInputs", 4000)
		.
		devSmsLoginSpan
		.setValue("#smsCodeInputs > #digit0", "1")
		.setValue("#smsCodeInputs > #digit1", "2")
		.setValue("#smsCodeInputs > #digit2", "3")
		//.setValue("#smsCodeInputs > #digit3", "4")
		.waitForElementVisible("#userMenu", 4000)
    .perform(function() {
      console.log("\x1b[32m √\x1b[0m", user, "logged in")
    })
    //  do not call end(). We want the session to continue.

  setTimeout(function() {
    if (callback) { callback.call(self.client.api) }  // if we have a callback, call it right before the complete event
    self.emit('complete');
  }, 10)                     // complete after 10m

  return this                // for nightwatch's nice fluid syntax
}

module.exports = Login;
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
  var self = this
	if (!mobile ) {
    console.log("ERROR: need moblie phonenumber to login via SMS")
    throw new Error("Need mobile phone number to login via SMS")
  }
  this.client.api
    .url(this.client.api.launchUrl+"/#/login")
    .waitForElementPresent("#phoneInput", 2000, "Login via SMS for mobile "+mobile)
    .setValue("#phoneInput", mobile)
		.click("#sendSmsLoginCodeButton")
		.waitForElementVisible("#smsCodeInputs", 4000, "SMS Login code requested")
    .perform(function() {
      // check that ID of currently focussed ("active") element is "digit0"
      // adapted from https://groups.google.com/forum/#!topic/nightwatchjs/FIHrO2sR-J4
      this.client.api.elementActive(function(res) {
        self.client.api.elementIdAttribute(res.value.ELEMENT, 'id', function(nodeID) {
          self.client.api.expect(nodeID.value).to.equal("digit0")
          //console.log("\x1b[32m √\x1b[0m", "#digit0 has focus")
        })
      })
    })
    .setValue("#digit0", "9")
    .setValue("#digit1", "9")
    .setValue("#digit2", "8")
    .setValue("#digit3", "8")
    .setValue("#digit4", "7")
    .setValue("#digit5", "7")
		.waitForElementPresent("#userHomePage")
    .perform(function() {
      console.log("\x1b[32m √\x1b[0m", mobile, "logged in")
    })

    // Do not call end() here in the custom command! We want the session to continue.

  setTimeout(function() {
    if (callback) { callback.call(self.client.api) }  // if we have a callback, call it right before the complete event
    self.emit('complete')
  }, 10)                     // complete after 10sec

  return this                // for nightwatch's nice fluid syntax
}

module.exports = Login
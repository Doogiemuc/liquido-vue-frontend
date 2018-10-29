/**
 * login.js Nightwatch custom command to login a liquido user
 */

var util = require('util');
var events = require('events');

function Login() {
  events.EventEmitter.call(this);
}

util.inherits(Login, events.EventEmitter);

Login.prototype.command = function(user, pass, callback) {
  var self = this;
	if (!user || !pass) {
    console.log("ERROR: need user and pass to login")
    throw new Error("Need user and pass to login")
  }
  this.client.api
    .url(this.client.api.launchUrl+"/#/login")
    .waitForElementPresent('#emailInput', 2000, "On login page")
    .setValue('#emailInput', user)
    .setValue('#passwordInput', pass)  // this.api.Keys.ENTER
		.click('#loginButton')
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
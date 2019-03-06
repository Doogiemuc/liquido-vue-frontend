// RUN from project root dir
// ./node_modules/.bin/nightwatch --config .\test\e2e_prod\nightwatch.conf.js --env iron_local --tag regression



module.exports = {
  '@tags': ['regression', 'happy'],


  before: function(browser) {
    //console.log("======= Happy Case Test ============")
    console.log(browser.globals.webapp, "=>", browser.globals.backend)
  },

  beforeEach: function(browser) {
    //console.log("===========================")
    //console.log(browser.currentTest)
  },

  /*
  'Liquido startpage - check that backend is available': function (browser) {
    browser.url(browser.launchUrl)
      .waitForElementVisible('#HomePageLoginButton', 5000, "startpage page OK. Backend is available.")
      //.appendLog()
      .end()
  },
  */

  'Login via SMS': function(browser) {
    browser //.url(broser.globals)
     .loginViaSms(browser.globals.user1_mobile)
  },

  'Create idea': function(browser) {
    //assume that we are already logged in
    browser.expect.element("#userMenu").to.be.present
    var now = new Date().getTime()
    browser
      .click("#userMenu")
      .click("#addIdeaMenuItem")
      .waitForElementVisible("#ideaTitle", "On Edit_Idea page")
      //.setValue("#ideaTitle", "New Idea by Nightwatch Test "+now)
      .pause(500)  // give TinyMCE some time to initialize
      .execute(function() {
        tinyMCE.activeEditor.setContent('Dummy description created by Nightwatch.')
        tinyMCE.activeEditor.save()   // BUGFIX: Must manually save TinyMCE's content back to the textare to trigger all necessary events. *sic*
      })
      .click("#ideaAreaSelect")
      .click("#ideaAreaSelect > option:nth-child(1)")
      //.assert.elementPresent("#saveIdeaButton", "Test messagsdfasdf")   // could be used to just simply output a message with green ok checkmark
      //.assert.attributeEquals("#saveIdeaButton", "disabled", null, "saveIdeaButton is active")  // does not work.  Outputs  "null" does not equal "null" :-)
      .elementIdEnabled('#saveIdeaButton', function(result){
         console.log(result)
      })
      .click("#saveIdeaButton")
      .appendLog()
      //.pause(10000)
      //.end()
  },


}

// RUN from project root dir
// ./node_modules/.bin/nightwatch --config .\test\e2e_prod\nightwatch.conf.js --env iron_local --tag regression

module.exports = {
  '@tags': ['regression'],

  beforeEach: function(browser) {
    console.log(browser.globals.webapp, "=>", browser.globals.backend)
  },

  'Liquido startpage - check that backend is available': function (browser) {
    browser.url(browser.launchUrl)
      .waitForElementVisible('body > div > div.container > p', 5000)
      .assert.containsText('body > div > div.container > p', 'direct democracy')
      .login(browser.globals.user1, browser.globals.pass1)
      //.appendLog()
      .end()



  },


}

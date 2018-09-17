// RUN from project root dir
// ./node_modules/.bin/nightwatch --config .\test\e2e_prod\nightwatch.conf.js --env chrome_local

module.exports = {
  '@tags': ['regression', 'single'],

  beforeEach: function(browser) {
    console.log(browser.globals.webapp, "=>", browser.globals.backend)
  },

  'Liquido startpage - check that backend is available': function (browser) {
    browser.url(browser.launchUrl)
      .waitForElementVisible('body > div > div.container > p', 5000)
      .assert.containsText('body > div > div.container > p', 'direct democracy')
      //.login(login(browser.globals.user1, browser.globals.pass1)   //TODO: create custom-command in nightwish
      //.appendLog()
      .end()



  },


}

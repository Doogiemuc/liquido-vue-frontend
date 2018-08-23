// RUN from project root dir
// ./node_modules/.bin/nightwatch --config .\test\e2e_prod\nightwatch.conf.js --env chrome

module.exports = {
  'Liquido startpage - check that backend is available': function (browser) {
    browser.url(browser.launchUrl)
      .waitForElementVisible('body > div > div.container > p', 5000)
      .assert.containsText('body > div > div.container > p', 'direct democracy')
      .appendLog()
      .end()
  },
	
/*
      //test table filter
      .setValue('input[name=query]', 'Idea 10')
      .elements('css selector', 'table.doogie-table > tbody > tr', function(result) {
        this.assert.equal(result.value.length, 1, 'Filtered table has 1 row')
      })
      .assert.containsText('table.doogie-table > tbody > tr', 'Idea 10')
      .pause(1000)
*/

  //Test Drag'n'Drop with nightwatch: https://github.com/RobK/nightwatchjs-drag-n-drop-example/blob/master/spec/drag-and-drop.js
}

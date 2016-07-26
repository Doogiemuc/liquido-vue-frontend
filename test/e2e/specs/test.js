// For authoring Nightwatch tests, see
// http://nightwatchjs.org/guide#usage

module.exports = {
  'ideas table e2e tests': function (browser) {
    browser
    .url('http://localhost:8080/#!/ideas')
      
      //check that idas have been loaded
      .waitForElementVisible('table.doogie-table > tbody > tr:nth-child(2)', 5000)
      .assert.containsText('table.doogie-table > tbody > tr:nth-child(2)', 'Idea 02')
      
      //test table filter
      .setValue('input[type=text][name="query"]', 'Idea 10')
      .elements('css selector', 'table.doogie-table > tbody > tr', function(result) {
        this.assert.equal(result.value.length, 1, 'Filterd table has 1 row')
      })
      .assert.containsText('table.doogie-table > tbody > tr:nth-child(2)', 'Idea 10')
      
      .end()
  }
}

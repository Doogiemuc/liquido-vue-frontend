// For authoring Nightwatch tests, see
// http://nightwatchjs.org/guide#usage

module.exports = {
  'liquido e2e tests': function (browser) {
    browser
    .url('http://localhost:8080/#!/ideas')
      .waitForElementVisible('table.doogie-table > tbody > tr:nth-child(2)', 5000)
      .assert.containsText('table.doogie-table > tbody > tr:nth-child(2)', 'Idea 02')
      .end()
  }
}

// RUN from project root dir
// ./node_modules/.bin/nightwatch --config .\test\e2e_prod\nightwatch.conf.js --env chrome  --tag regression

module.exports = {
	'@tags': ['regression'],
	'UserHome with poll in voting': function(browser) {
	  browser
		  .url(browser.launchUrl+"/#/userHome")
		  .waitForElementVisible("body div.container div.panel.panel-default.pollPanel div.panel-heading > h4", 3000)
			
		browser.expect.element('body div.container div.panel.panel-default.pollPanel div.panel-heading > h4').text.to.equal('Poll in voting phase')
		
		browser.end()
  }
	
/*
  HOWTO Nightwatch IF / ELSE 
		
  browser.element('css selector', selectors.unavailable, function(result){
            if (result.value && result.value.ELEMENT) {
                // Element is present, do the appropriate tests
                browser.end();
            } else {
                // Element is not present.
            }
        });
*/

}
// Tests for poll pages

var findPollInVoting = function(browser) {
	process.env.backendBaseURL = browser.globals.backend    				// needs to be set in env for LiquidoApiClient
	var apiClient = require('../../../src/services/LiquidoApiClient')
	apiClient.login(browser.globals.user1, browser.globals.pass1)		// need to login to send requests
	console.log("   Find a poll in voting phase ...")
	return apiClient.findPollsByStatus("VOTING").then(res => {
	  if (res.length == 0) return Promise.reject("Cannot find a poll in voting, which is needed for this test!")
		return res[0].id
	})
}


module.exports = {
	'@tags': ['regression'],
	'Show poll in voting phase': function(browser) {
		browser
		  .login(browser.globals.user1, browser.globals.pass1)
			.url(browser.launchUrl+"/#/userHome")
			.waitForElementVisible("#goToCastVoteButton", 3000)
			.click("#goToCastVoteButton")
    	.end()

   /*


    findPollInVoting(browser)
      .then(pollInVotingId => {
				console.log("   Open "+browser.launchUrl+"/#/polls/"+pollInVotingId)
				browser
				  .login(browser.globals.user1, browser.globals.pass1)
					.url(browser.launchUrl+"/#/polls/"+pollInVotingId)
					.waitForElementVisible("#goToCastVoteButton", 3000)
					.click("#goToCastVoteButton")
          //.waitForElementVisible("#castVoteButton", 3000)

				browser.expect.element('#castVoteButton').to.be.present.before(3000)
				browser.expect.element('#castVoteButton').to.have.attribute('disabled').equals('true')

				browser
					.moveToElement('#leftContainer > div:nth-child(1)',  20,  20)
					.mouseButtonDown(0)
					.moveToElement('#rightContainer', 40, 40)
					.mouseButtonUp(0)
					.pause(1000)
					.waitForElementPresent("#rightContainer > div.panel.panel-default.lawPanel", 3000)

				  .end()
			})
			.catch(err => {
				console.log(err)
				return browser.end()
				//throw new Error(err)
			})

    */

	}
}

//Test Drag'n'Drop with nightwatch: https://github.com/RobK/nightwatchjs-drag-n-drop-example/blob/master/spec/drag-and-drop.js
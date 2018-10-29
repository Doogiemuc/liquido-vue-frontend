// Comple voting happy case


// https://github.com/html-dnd/html-dnd
var dragAndDrop = require('html-dnd').codeForSelectors;

/*
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
*/


module.exports = {
	'@tags': ['regression', 'single'],
	'Show poll in voting phase': function(browser) {
		
		// CSS selectors
		var firstPollPanel = "#pollsOpenForVotingHeader + div.pollPanel > div.panel-heading > a"
		var goToCastVoteButton = "#goToCastVoteButton"
		var pollTable = "table.pollTable"
		var firstProposalHeading = "#leftContainer > div:nth-child(1) > div.panel-heading"
		var rightContainer = "#rightContainer"
		
		browser.url(browser.launchUrl)
		  .login(browser.globals.user1, browser.globals.pass1)
			.url(browser.launchUrl+"/#/userHome")
			.waitForElementVisible(firstPollPanel, 5000)
			.click(firstPollPanel)
			.waitForElementVisible(goToCastVoteButton, 3000)
			.click(goToCastVoteButton)
			.waitForElementVisible(firstProposalHeading, 3000)
			.moveToElement(pollTable, 0, 0)   //BUGFIX: need to move pollTable intoView, otherwiese firstProposalHeading would be behind fixed navbar
			.pause(1000)
			.execute(dragAndDrop, [firstProposalHeading, '#rightContainer'])
			
			
			/*
			.moveTo(firstProposalHeading)   
			.mouseButtonDown(0)
			.pause(1000)
			.moveTo(rightContainer)
			.pause(1000)
			.mouseButtonUp(0)
			*/
			
			
			.waitForElementVisible(rightContainer + " > div:nth-child(1) > div.panel-heading", 8000)
			
			
			.pause(5000)
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
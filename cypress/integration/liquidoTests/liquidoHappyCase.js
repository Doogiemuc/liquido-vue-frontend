/**
 * Start to finish HAPPY CASE for Liquido.
 * This is the shortest simplest possible user flow 
 * from registering a new user
 * until a finished poll.
 * 
 * For further use cases and edge cases see the regression test set.
 */

import api from '../../../src/services/LiquidoApiClient.js'
import auth from '../../../src/services/auth.js'
import { AssertionError } from 'assert';

function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

// Quick shortcut to access test fixture data
var fix

/*
 This cypress test case is a complete happy case run.
 The individual tests inside this file depend on each other and must run in this order. Only the whole spec is repeatable.
 Each test step can use the data created from the test steps before it. This data is kept in Cypress.env()

 

 # Test data

  - a new random user registers
  - this user creates an idea
*/ 
describe('Liquido Happy Case Test', function() {
	
	// Yes Mocha allows multiple before() calls. They will be executed in sequence as defind here.  Nice!

	/** Make one initial request against the backend to check if it is alive at all */
	before(function() {
		cy.request({ 
			url: Cypress.env('backendBaseURL')+'/_ping',
			timeout: 1000
		}).then(res => {
			if (res.status === 200) {
				console.log("Backend is alive at "+Cypress.env('backendBaseURL'))
			} else {
				console.error("Cannot ping liquido backend at"+Cypress.env('backendBaseURL'))
				cy.log("Cannot ping liquido backend at"+Cypress.env('backendBaseURL'))
				Cypress.runner.stop();
			}
		})
		//Cypress.Cookies.preserveOnce('session_id', 'remember_token')
	})


	/** Load test fixturesand then make it easily available as variable "fix" and in Cypress.env
	    https://docs.cypress.io/api/commands/fixture.html#Accessing-Fixture-Data  */
	before(function() {
		cy.fixture('liquidoTestFixtures.json').then(fixtures => {
			Cypress.env(fixtures)  			// store in cypres environment
			Cypress.env('auth', auth)   	// Put a shared instance of auth.js into env. => cy.loginWithSmsToken uses this instance.  Looks like an ugly hack, but works fine
			fix = fixtures					// quick access to test fixtures
		})
	})

	/** Print name of current test to console */
	beforeEach(function() {
		console.log("===================================================")
		console.log("======= TEST CASE >>>", Cypress.mocha.getRunner().suite.ctx.currentTest.title, "<<<")
		console.log("===================================================")
	})

	it('register as a new user', function() {
		// GIVEN random new user data
		let num = rand(1000,9999)
		let randUsername = fix.username_prefix + num
		Cypress.env('randUsername',    randUsername)
		Cypress.env('randEMail',       randUsername + fix.email_suffix)
		Cypress.env('randMobilephone', fix.mobilephone_prefix + num)
		Cypress.env('randWebsite',     'www.fromCypressTest.org')
		
		// WHEN this user registers
		cy.visit('/')
		cy.get('#RegisterButton').click()
		cy.get('#RegisterPage').should('exist')
		cy.get('#emailInput').type(Cypress.env('randEMail'))
		cy.get('#fullnameInput').type(Cypress.env('randUsername'))
		cy.get('#mobilephoneInput').type(Cypress.env('randMobilephone'))
		cy.get('#websiteInput').type(Cypress.env('randWebsite')).blur()
		cy.get('#RegisterButton').should('be.enabled').click()
		cy.get('#registerSuccess').should('exist')					// would show error alert if user already exists

		// THEN the user exists in the backend
		cy.loginWithSmsToken(Cypress.env('randMobilephone'), fix.devLoginDummySmsToken).then(user => {
			//console.log("got user", user)
			//Cypress.env("user", user)
			expect(user.profile.mobilephone).to.equal(Cypress.env('randMobilephone'))
			cy.log("Successfully registerd new user "+ user.email)
		})
	})

	it('add a new idea via UI', function() {
		//GIVEN an idea with a random title
		let num = rand(1000,9999)
		Cypress.env('ideaTitle', fix.ideaTitle_prefix + num)
		Cypress.env('ideaDescription', fix.ideaDescription_prefix + num)

		//WHEN rand user adds a new idea
		cy.urlLogin(Cypress.env('randMobilephone'))
		cy.get('#LiquidoHome').should('exist')
		cy.get('#IdeasArrow').click()
		cy.get('#IdeasList').should('exist')
		cy.get('#AddIdeaButton').click()
		cy.get('.mce-branding-powered-by').should('exist')    // wait for TinyMCE to load
		cy.get('#ideaTitle').type(Cypress.env('ideaTitle'))

		//AND types into TinyMCE.
		cy.window().then(win => {
			win.tinyMCE.activeEditor.setContent(Cypress.env('ideaDescription'))
			win.tinyMCE.activeEditor.save()   // BUGFIX: Must manually save TinyMCE's content back to the textare to trigger all necessary events. *sic*
		})
		//AND selects the first area
		cy.get('#ideaAreaSelect > option').eq(0).then(el => 
			cy.get('#ideaAreaSelect').select(el.val())
		)
		//AND saves that idea
		cy.get('#saveIdeaButton').click()

		//THEN the idea is saved successfully
		cy.get('#CreateIdeaSuccess').should('exist')     
		// AND get the idea from the backend and store it in Cypress.env
		//cy.loginWithSmsToken(fix.user1_mobilephone, fix.devLoginDummySmsToken)   // MUST login our ref to api before making any direct api calls
		cy.get('#newIdeaUri').then(elems => {
			var ideaURI = elems[0].textContent						//Even the selector by ID returns an Array of DOM elements!
			return api.getIdea(ideaURI).then(idea => {				//BUGFIX: NEVER EVER again forget to "return" the inner Promise!!! :-)
				Cypress.env("idea", idea)
				cy.log("Successfully created new idea ", idea) 
			})
		})
		
	})

	it('quickly add supporters to this idea until it becomes a proposal', function() {
		//GIVEN an idea in Cypress.env
		expect(Cypress.env('idea'), "Idea should be stored in Cypress.env()").toBeNonEmptyObject
		expect(Cypress.env('idea').status, "Idea should have status IDEA").to.equal('IDEA')

		//WHEN adding enough supporters to idea
		addSupporters(10, Cypress.env('idea')).then(res => {
			// THEN the idea has now become a proposal
			cy.urlLogin(Cypress.env('randMobilephone'))
			cy.visit('/#/proposals/'+Cypress.env('idea').id)
			// AND has the proposal icon
			cy.get('.lawPanel h4.lawTitle > svg').should('have.class', 'fa-file-alt')   // fa-file-alt is the icon for a proposal
			
			// AND the proposal has status PROPOSAL when reloaded from the server
			return api.getIdea(Cypress.env('idea')).then(proposal => {
				expect(proposal.status, "Former Idea should have status PROPOSAL").to.equal('PROPOSAL')
				Cypress.env('proposal', proposal)
				return proposal
			})
		})
		
		// Did not work:   the above cy.wrap()  SHOULD!!!   wait until the promises returns. Cypress complains if you put the cy.log into the above promise chain.
		// https://github.com/cypress-io/cypress-example-recipes/blob/master/examples/logging-in__using-app-code/cypress/integration/spec.js
		//cy.log("SUCCESS. Idea has become a proposal.")

		
	})

	it('start a new poll', function() {
		//GIVEN a poll title
		var pollTitle = "Poll created by test "+new Date().getTime()
		// AND a proposal
		expect(Cypress.env('proposal'), "Proposal should be stored in Cypress.env()").toBeNonEmptyObject
		expect(Cypress.env('proposal').status, "Idea should have status PROPOSAL").to.equal('PROPOSAL')
		// AND rand user is logged in
		cy.urlLogin(Cypress.env('randMobilephone'))
		// AND views his proposal
		cy.visit('/#/proposals/'+Cypress.env('proposal').id)

		// WHEN he starts a new poll
		cy.get('#startNewPollButton').click()
		cy.get('#PollCreate').should('exist')
		cy.get('#createNewPollButton').should('be.disabled')
		cy.get('#pollTitleInput').type(pollTitle)
		cy.get('#createNewPollButton').click()

		// THEN the a new poll should be created and have that title
		cy.get('#PollShow').should('exist')
		cy.get('#pollTitle').should('have.text', pollTitle)

		//  AND store poll in Cypress.env()
		cy.loginWithSmsToken(Cypress.env('randMobilephone'), fix.devLoginDummySmsToken).then(user => {
			return api.getProposal(Cypress.env('proposal'), true).then(proposalProjection => {
				console.log("created new poll", proposalProjection.poll)
				Cypress.env('poll', proposalProjection.poll)
				Cypress.env('areaId', proposalProjection.area.id)
			})
		})

		cy.log('Successfully started poll '+pollTitle)
	})
	
	it('second proposal joins this poll', function() {
		// GIVEN a proposal
		var proposalTitle = "Second Proposal created by cypress "+new Date().getTime()
		cy.log("Create new proposal")
		createProposal(proposalTitle, fix.adminMobilephone, Cypress.env('areaId')).then(prop => {
			expect(prop.status).to.equal('PROPOSAL')
			//Cypress.env('proposal2', prop)
		})					

		cy.log("now joining poll")
		//  WHEN joining the poll via UI
		cy.urlLogin(fix.adminMobilephone)
		cy.visit('/#/polls/'+Cypress.env('poll').id)

		cy.get('#proposalSearchInput').type(proposalTitle)
		cy.get('#joinPollPanel .dropdown-menu > li > a:first()').should('have.text', proposalTitle)
		cy.get('#joinPollPanel .dropdown-menu > li > a:first()').click()
		cy.get('#joinPollPanel button').click()
		
		//  THEN the new proposal is shown on the poll's page
		cy.get('div.lawPanel h4.lawTitle').should('contain.text', proposalTitle)
		cy.log('SUCCESS: Second proposal joined the poll')
	})

	it('start voting phase', function() {
		// GIVEN a poll
		expect(Cypress.env('poll')).toBeNonEmptyObject

		//  WHEN starting the voting phase of this poll
		var backendBaseURL = Cypress.env('backendBaseURL')
		cy.loginWithSmsToken(fix.adminMobilephone, fix.devLoginDummySmsToken).then(user => {				// MUST(!) chain the cypress command with .then()
			cy.request({
				method: 'GET',
				url: backendBaseURL+'/dev/polls/'+Cypress.env('poll').id+'/startVotingPhase',
				auth: {
					bearer: api.jsonWebToken
				}
			}).then(res => {
				expect(res.status).to.equal(200)
				console.log("Started voting phase of poll", res)
				cy.log("Started voting phase of poll")
			})
		})	
		
		//  THEN the poll is shown in voting phase
		cy.visit('/#/polls/'+Cypress.env('poll').id)
		cy.get('#castVoteButton').should('not.be.disabled')

		//   AND the poll has status VOTING in the backend
		cy.request({
			method: 'GET',
			url: backendBaseURL+'/polls/'+Cypress.env('poll').id,
			headers: {
				'Accept': 'application/json'
			},
			auth: {
				bearer: api.jsonWebToken
			}
		}).then(res => {
			expect(res.status).to.equal(200)
			expect(res.body.status, "Poll should now be in status VOTING").to.equal('VOTING')
			cy.log("SUCCESS: Poll is now in voting phase")
		})
	})

	it('cast vote for this proposal', function() {
		// GIVEN a poll and an proposal
		expect(Cypress.env('poll')).toBeNonEmptyObject
		expect(Cypress.env('proposal')).toBeNonEmptyObject
		expect(Cypress.env('proposal').status).to.equal('PROPOSAL')

		//  WHEN casting a vote in this poll
		cy.urlLogin(Cypress.env('randMobilephone'))
		cy.visit('/#/polls/'+Cypress.env('poll').id)
		cy.get('#PollShow').should('exist')
		cy.get('#castVoteButton').click()

		//  AND sort the ballot (move one proposal to the right)
		cy.get('#SortBallot').should('exist')
		// drag'n'drop with cypress  https://github.com/cypress-io/cypress-example-recipes/blob/master/examples/testing-dom__drag-drop/cypress/integration/drag_n_drop_spec.js
		// Cast one vote for the "proposal" that was created in the previous test steps. So that this proposal will be the winner of the poll.
		cy.get('#leftContainer > div.lawPanel[data-proposaluri="'+Cypress.env('proposal')._links.self.href+'"]')
			.trigger('mousedown', { which: 1 })
		cy.get('#rightContainer')
			.trigger('mousemove', { offsetX: 10, offsetY: 10 })     // move to 10,10px from top left (padding) edge of the DOM element
			.trigger('mouseup', {force: true})
		cy.get('#castVoteButton').click()
		cy.get('#CastVote').should('exist')

		//  AND fetch voterToken
		cy.get('#fetchVoterTokenButton').click()
		cy.get('#voterToken').should('not.be.empty')
		cy.get('#castVoteButton').click()

		// THEN sweet alert should show voteSuccess and checksum should be returned
		cy.get('.sweet-alert').should('have.class', 'voteSuccess')
		cy.get('button.confirm').click()
		cy.get('#checksum').then(checksumElems => {
			let checksum = checksumElems[0].textContent
			expect(checksum).not.to.be.empty
			Cypress.env('checksum', checksum)
		})

		//  AND ballot should be shown in poll
		cy.visit('/#/polls/'+Cypress.env('poll').id)
		cy.get('#yourBallot').should('exist')

		cy.log("Vote casted SUCCESSFULLY.") 
	})

	it("finish poll and verify winning proposal", function() {
		// GIVEN a poll and idea and a checksum
		expect(Cypress.env('poll')).toBeNonEmptyObject
		expect(Cypress.env('idea')).toBeNonEmptyObject
		expect(Cypress.env('checksum')).toBeNonEmptyString

		// WHEN finish this poll
		cy.loginWithSmsToken(fix.adminMobilephone, fix.devLoginDummySmsToken)
		cy.request({
			method: 'GET',
			url: Cypress.env('backendBaseURL')+'/dev/polls/'+Cypress.env('poll').id+'/finishVotingPhase',
			headers: {
				'Accept': 'application/json'
			},
			auth: {
				bearer: api.jsonWebToken
			}
		}).then(res => {
			expect(res.status).to.equal(200)
			expect(res.winner).toBeNonEmptyObject
		})

		// THEN poll result should have the correct winner
		cy.urlLogin(Cypress.env('randMobilephone'))
		cy.visit('/#/polls/'+Cypress.env('poll').id)
		cy.get('#PollResult').should('exist')
		console.log(Cypress.env('idea'))
		cy.get('#PollResult div.panel').should('have.attr', 'data-proposaluri', Cypress.env('idea')._links.self.href)
	})

	it("ballot's checksum is valid", function() {
		// GIVEN a finished poll and a ballot's checksum
		expect(Cypress.env('poll')).toBeNonEmptyObject
		expect(Cypress.env('checksum')).toBeNonEmptyString
		
		// WHEN validating the checksum on the poll's page
		cy.urlLogin(Cypress.env('randMobilephone'))
		cy.visit('/#/polls/'+Cypress.env('poll').id)
		cy.get('#PollResult').should('exist')
		cy.get('#checksumInput').type(Cypress.env('checksum'))
		cy.get('#checksumInputButton').click()

		// THEN the checksum should be valid
		cy.get('.alert-danger').should('not.exist')
		cy.get('.alert-success').should('exist')
	})

	it('Winning law is shown on the laws page', function() {
		// GIVEN a poll and the winning law
		expect(Cypress.env('poll')).toBeNonEmptyObject
		expect(Cypress.env('idea')).toBeNonEmptyObject

		// WHEN navigating to the law's page
		cy.urlLogin(Cypress.env('randMobilephone'))
		cy.visit('/#/laws')
		
		// THEN this law is shown 
		cy.get('.lawListCondensedTable tr[data-lawuri="'+Cypress.env('idea')._links.self.href+'"]')
	})

	// CLEANUP
	after(function() {
		if (Cypress.env('poll') !== undefined) {
			console.log("DELETING poll that was created from test (poll.id="+Cypress.env('poll').id+")")
			cy.loginWithSmsToken(fix.adminMobilephone, fix.devLoginDummySmsToken)
			cy.request({
				method: 'DELETE',
				url: Cypress.env('backendBaseURL')+'/dev/polls/'+Cypress.env('poll').id,
				auth: { bearer: api.jsonWebToken }
			})
			.then(res => { 
				Cypress.env('poll', undefined)
			})
		}
		Cypress.env('areaId', undefined)
		Cypress.env('idea', undefined)
		Cypress.env('proposal', undefined)
	})

})








// ========= Utility methods





var saveNewIdea = function(title, areaId) {
	var newIdea = {
		title: title,
		description: "This is just a random idea that has automatically been created by a test case on "+new Date(),
		area: '/areas/'+areaId
	}
	return api.saveNewIdea(newIdea)
}

/**
 * Add supporters to one idea. Keep in mind that there must be enough supporteres in the DB.
 * @param {Number} numSupporters number of supporters to add
 * @param {Object} idea an idea or proposal
 * @return A Promise that will resolve when supporteres are added
 */
var addSupporters = function(numSupporters, idea) {
	return cy.loginWithSmsToken(fix.adminMobilephone, fix.devLoginDummySmsToken).then(admin => {    // MUST login to load allUsers. So we use admin login
		return api.getAllUsers().then(allUsers => {
			if (allUsers.length < numSupporters+1) return Promise.reject("Cannot addSupporters. Need at least "+(numSupporters+1)+" users in the DB!")
			let phones = allUsers.slice(0, numSupporters).map(user => user.profile.mobilephone)   //TODO: .filter(user => user._links.self.href !== idea._links.createdBy.href)
			console.log("Adding supporters for phones", phones)

			return phones.map(mobile =>
				() => auth.loginWithSmsToken(mobile, fix.devLoginDummySmsToken).then(
						() => api.addSupporterToIdea(idea)   // will add the currently logged in user to the idea
					)
				)
			.reduce((prev, next) => {	// This chains the promises one after another. The argument to .then() must be a function that returns a promise, not the function call itself!
				return prev.then(next)
			}, Promise.resolve("FIRST"))
			.then(res => {
				return "Some result asfasfaf"
			})
		})
	})
	
	/*
	var phones = []
	for(var i=10; i<10+numSupporters; i++) {
		phones.push(fix.mobilephone_prefix+i)
	}
	return phones.map(mobile => {
		// return one "task" for each mobile. Each "task" is a function that returns a promise (chain). The auth and api methods are not yet called here! The will be called below when the promise resolves.
		return () => { 
			return auth.loginWithSmsToken(mobile, fix.devLoginDummySmsToken)
				.then(() => { 
					console.log("====== add suporter "+mobile+" to "+idea.title)
					return api.addSupporterToIdea(idea) 
					})
			}
	})
	.reduce((prev, next) => {
		return prev.then(next)			// This chains the promises one after another. The argument to .then() must be a function that returns a promise, not the function call itself!
	}, Promise.resolve("FIRST"))
	*/
}

var createProposal = function(title, user_mobilephone, areaId) {
	console.log("Creating new proposal: title='"+title+"' createdBy="+user_mobilephone+" in area(id="+areaId+")")
	return cy.loginWithSmsToken(user_mobilephone, fix.devLoginDummySmsToken).then(user => {
		return saveNewIdea(title, areaId).then(idea => {
			console.log("saved new idea", idea.title, "now going to add supporters")
			return addSupporters(11, idea).then(
				() => api.getIdea(idea)			   // reload idea in new status and return that
			)
		})
	})

	
}
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
			Cypress.env('auth', auth)   	// Put a shared instance of auth.js into env. Looks like an ugly hack, but works fine
			fix = fixtures					// quick access to test fixtures
		})
	})

	/** Load one area */
	before(function() {
		cy.loginWithSmsToken(fix.user1_mobilephone, fix.devLoginDummySmsToken).then(user => {
			console.log("7")
			cy.request({
				method: 'GET',
				url: Cypress.env('backendBaseURL')+'/areas',
				headers: {
					'Accept': 'application/json'
				},
				auth: {
					bearer: api.jsonWebToken
				}
			}).then(res => {
				let area = res.body._embedded.areas[0]
				Cypress.env('area0', area)
				fix.area0 = area
				console.log("Cypress.env initialized", Cypress.env())
			})
		})
	})

	/** Print name of current test to console */
	beforeEach(function() {
		console.log("======= TEST CASE >>>", Cypress.mocha.getRunner().suite.ctx.currentTest.title)
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
		cy.devLogin(Cypress.env('randMobilephone'))
		
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
		cy.get('#ideaAreaSelect').select(fix.area0.title)
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

	it('add supporters to idea until it becomes a proposal', function() {
		//GIVEN an idea in Cypress.env
		expect(Cypress.env('idea'), "Idea should be stored in Cypress.env()").toBeNonEmptyObject
		expect(Cypress.env('idea').status, "Idea should have status IDEA").to.equal('IDEA')

		
		/*
		var addSupportersToIdea = function() {
			console.log("Adding supporters to idea ", Cypress.env('idea'))
			// Run tasks as promise chain
			// https://stackoverflow.com/questions/30853265/dynamic-chaining-in-javascript-promises
			// https://css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
			let numSupporters = 10
			var tasks = []
			for(var i = 5; i<5+numSupporters; i++) {
				tasks.push({
					func: function(mobile) { 
						//console.log("========== (1) TaskFunc: Login via SMS mobile="+mobile)
						return auth.loginWithSmsToken(mobile, fix.devLoginDummySmsToken)
							.then((user) => {
								//console.log("========== (2) user (id="+user.id+", "+user.email+", "+user.profile.mobilephone+") logged in via SMS.")
								return api.addSupporterToIdea(Cypress.env('idea')).then(() => {
									//console.log("========== (3) added "+user.email+" supporter to idea")
								})
							})
					},
					arg: fix.mobilephone_prefix+i
				})
			}
			return tasks
				.reduce(function (prev, task) {
					return prev.then(() => task.func(task.arg))    
				}, Promise.resolve("START"))
				.then(function (result) {
					cy.log("Added " + numSupporters + " supporters to idea(id="+Cypress.env('idea').id+", title='"+Cypress.env('idea').title+"')")
					console.log("======= FINISHED adding supporters")
					return Promise.resolve("done resolve inside")
				});
			
		}
		*/

		//WHEN adding enough supporters to that idea
		cy.wrap(addSupporters(10, Cypress.env('idea')).then(() => {
			// THEN the idea has now become a proposal
			cy.devLogin(Cypress.env('randMobilephone'))
			//cy.wait(500)			// BUGFIX: Need to wait until "really" logged in
			cy.visit('/#/proposals/'+Cypress.env('idea').id)
			// AND has the proposal icon
			cy.get('.lawPanel h4.lawTitle > svg').should('have.class', 'fa-file-alt')   // fa-file-alt is the icon for a proposal
			
			// AND the proposal has status PROPOSAL when reloaded from the server
			api.getIdea(Cypress.env('idea')).then(proposal => {
				expect(proposal.status, "Former Idea should have status PROPOSAL").to.equal('PROPOSAL')
				Cypress.env('proposal', proposal)
				
			})
		}))

		// the above cy.wrap()  will wait until the promises returns. Cypress complains if you put the cy.log into the above promise chain.
		// https://github.com/cypress-io/cypress-example-recipes/blob/master/examples/logging-in__using-app-code/cypress/integration/spec.js
		cy.log("SUCCESS. Idea has become a proposal.")
	})

	it('start a new poll', function() {
		//GIVEN a poll title
		var pollTitle = "Poll created by test "+new Date().getTime()
		// AND a proposal
		expect(Cypress.env('proposal'), "Proposal should be stored in Cypress.env()").toBeNonEmptyObject
		expect(Cypress.env('proposal').status, "Idea should have status PROPOSAL").to.equal('PROPOSAL')
		// AND rand user is logged in
		cy.devLogin(Cypress.env('randMobilephone'))
		// AND views his proposal
		cy.visit('/#/proposals/'+Cypress.env('proposal').id)

		// WHEN he starts a new poll
		cy.get('#startNewPollButton').click()
		cy.get('#PollCreate').should('exist')
		cy.get('#createNewPollButton').should('be.disabled')
		cy.get('#pollTitleInput').type(pollTitle)
		cy.get('#createNewPollButton').click()

		// THEN the new poll should have that title
		cy.get('#PollShow').should('exist')
		cy.get('#pollTitle').should('have.text', pollTitle)

		//  AND store poll in Cypress.env()
		cy.loginWithSmsToken(fix.user1_mobilephone, fix.devLoginDummySmsToken).then(user => {
			return api.getProposal(Cypress.env('proposal'), true).then(proposalProjection => {
				console.log("created new poll", proposalProjection.poll)
				Cypress.env('poll', proposalProjection.poll)
			})
		})

		cy.log('Successfully started poll '+pollTitle)
	})
	
	it('second proposal joins this poll', function() {
		// GIVEN a proposal
		var proposalTitle = "Second Proposal created by cypress "+new Date().getTime()
		cy.loginWithSmsToken(fix.user1_mobilephone, fix.devLoginDummySmsToken).then(() => {
			return createProposal(proposalTitle).then(prop => {
				cy.wrap(prop).its('status').should('eq', 'PROPOSAL')
				console.log("Created new proposal", prop)
				Cypress.env('proposal2', prop)
				//cy.log("SUCCESS: Created new Proposal: "+proposalTitle)
			})
		})		

		//  WHEN joining the poll via UI
		cy.devLogin(fix.user1_mobilephone)
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
		cy.devLogin(fix.user1_mobilephone)
		expect(Cypress.env('poll')).toBeNonEmptyObject

		//  WHEN starting the voting phase of this poll
		var backendBaseURL = Cypress.env('backendBaseURL')
		//console.log("JWT", api.jsonWebToken)
		cy.request({
			method: 'GET',
			url: backendBaseURL+'/dev/polls/'+Cypress.env('poll').id+'/startVotingPhase',
			auth: {
				bearer: api.jsonWebToken
			}
		}).then(res => {
			expect(res.status).to.equal(200)
			console.log("Started voting phase of poll", res)
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
		cy.devLogin(Cypress.env('randMobilephone'))
		cy.visit('/#/polls/'+Cypress.env('poll').id)
		cy.get('#PollShow').should('exist')
		cy.get('#castVoteButton').click()

		//  AND sort the ballot (move one proposal to the right)
		cy.get('#SortBallot').should('exist')
		//drag'n'drop with cypress  https://github.com/cypress-io/cypress-example-recipes/blob/master/examples/testing-dom__drag-drop/cypress/integration/drag_n_drop_spec.js
		// Cast vote for the "idea" that was created above. So that this idea is the winner in the end
		cy.get('#leftContainer > div.lawPanel[data-proposaluri="'+Cypress.env('proposal')._links.self.href+'"]')
			.trigger('mousedown', { which: 1 })
		cy.get('#rightContainer')
			.trigger('mousemove', { offsetX: 10, offsetY: 10 })   // move to 10,10px from top left (padding) edge of the DOM element
			.trigger('mouseup', {force: true})
		cy.get('#castVoteButton').click()
		cy.get('#CastVote').should('exist')

		//  AND fetch voterToken
		cy.get('#fetchVoterTokenButton').click()
		cy.get('#voterToken').should('not.be.empty')
		cy.get('#castVoteButton').click()

		// THEN should show success and return checksum
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
		cy.devLogin(Cypress.env('randMobilephone'))
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
		cy.devLogin(Cypress.env('randMobilephone'))
		cy.visit('/#/polls/'+Cypress.env('poll').id)
		cy.get('#PollResult').should('exist')
		console.log(Cypress.env('idea'))
		//cy.get('#PollResult').debug()
		cy.get('#PollResult div.panel').should('have.attr', 'data-proposaluri', Cypress.env('idea')._links.self.href)
	})

	it("ballot's checksum is valid", function() {
		// GIVEN a finished poll and a ballot's checksum
		expect(Cypress.env('poll')).toBeNonEmptyObject
		expect(Cypress.env('checksum')).toBeNonEmptyString
		
		// WHEN validating the checksum on the poll's page
		cy.devLogin(Cypress.env('randMobilephone'))
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
		cy.devLogin(Cypress.env('randMobilephone'))
		cy.visit('/#/laws')
		
		// THEN this law is shown 
		cy.get('.lawListCondensedTable tr[data-lawuri="'+Cypress.env('idea')._links.self.href+'"]')
	})


	it.skip('CLEANUP', function() {
		if (Cypress.env('poll') !== undefined) {
			console.log("DELETING poll that was created from test (poll.id="+Cypress.env('poll').id+")")
			cy.loginWithSmsToken(fix.adminMobilephone, fix.devLoginDummySmsToken).then(user => {
				cy.request({
					method: 'DELETE',
					url: Cypress.env('backendBaseURL')+'/dev/polls/'+Cypress.env('poll').id,
					headers: {
						'Accept': 'application/json'
					},
					auth: {
						bearer: api.jsonWebToken
					}
				})
			})
		}
	})

	//TODO: cleanup  (so that tests could also be run against prod)
	//      Clear Cypress.env   idea, poll and proposal2 
})


var findIdea = function(email) {
	var query = {
		status: "IDEA",
		createdByEmail: email
	}
	return api.findByQuery(query).then(page => {
		var ideas = page._embedded.laws
		expect(ideas).to.have.length.of.at.least(1)
		return ideas[0]
	})
}

var saveNewIdea = function(title) {
	var newIdea = {
		title: title,
		description: "This is just a random idea that has automatically been created by a test case on "+new Date(),
		area: "/areas/"+fix.area0.id
	}
	return api.saveNewIdea(newIdea)
}

/**
 * Add supporters to one idea. Keep in mind that there must be enough supporteres in the DB.
 * @param {Number} numSupporters number of supporters to add
 * @param {Object} idea an idea or proposal
 * @return A Promise that will resolve when supporteres are adeed
 */
var addSupporters = function(numSupporters, idea) {
	var phones = []
	for(var i=10; i<10+numSupporters; i++) {
		phones.push(fix.mobilephone_prefix+i)
	}
	return phones
		.map(mobile => {
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
			return prev.then(next)			// This chains the promises one after another // Do I need this BUGFIX??? the argument to .then() must be a function that returns a promise, not the function call itself!
		}, Promise.resolve("FIRST"))
}

var createProposal = function(title) {
	console.log("==== Creating new proposal: title='"+title+"'")
	return saveNewIdea(title).then(idea => {
		//console.log("==== saved new idea", idea.title, "now going to add supporters")
		return addSupporters(11, idea).then(() => api.getIdea(idea))  // reload idea in new status and return that
	})
}
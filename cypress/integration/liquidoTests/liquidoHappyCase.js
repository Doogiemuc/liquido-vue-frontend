/**
 * Start to finish HAPPY CASE for Liquido
 */

import api from '../../../src/services/LiquidoApiClient.js'
import auth from '../../../src/services/auth.js'

function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

// Quick shortcut to access test fixture data
var fix

/*
 This cypress test case is a complete happy case run.
 The individual tests inside this  file depend on each other and must run in this order.
 Each test step can use the data created from the test steps before it. This data is kept in Cypress.env()

 # Test data

  - a new random user registers
  - this user creates an idea
*/ 
describe('Liquido Happy Case Test', function() {
	/* Import all fixtures into Cypress.env  and then add some dynamically created values
	   https://docs.cypress.io/api/commands/fixture.html#Accessing-Fixture-Data  */
	before(function() {
		cy.fixture('liquidoTestFixtures.json').then(fixtures => {
			Cypress.env(fixtures)  			// store in cypres environment
			fix = fixtures					// quick access to test fixtures
			Cypress.env('auth', auth)   	// Put a shared instance of auth.js into env. Looks like an ugly hack, but works fine
			//Cypress.Cookies.preserveOnce('session_id', 'remember_token')
			
			console.log("Cypress.env initialized", Cypress.env())
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
		cy.loginWithSmsCode(Cypress.env('randMobilephone'), fix.devLoginDummySmsCode).then(user => {
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
		//TODO: check that user is logged in
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
		cy.get('#ideaAreaSelect').select(Cypress.env('area0_title'))
		//AND saves that idea
		cy.get('#saveIdeaButton').click()

		//THEN the idea is saved successfully
		cy.get('#CreateIdeaSuccess').should('exist')     
		// AND get the idea from the backend and store it in Cypress.env
		//cy.loginWithSmsCode(fix.user1_mobilephone, fix.devLoginDummySmsCode)   // MUST login our ref to api before making any direct api calls
		cy.get('#newIdeaUri').then(elems => {
			var ideaURI = elems[0].textContent
			return api.getIdea(ideaURI).then(idea => {				//BUGFIX: NEVER EVER again forget to "return" the inner Promise!!!
				Cypress.env("idea", idea)
				cy.log("Successfully created new idea ", idea) 
			})
		})
		
	})

	it('add supporters to idea until it becomes a proposal', function() {
		//GIVEN an idea in Cypress.env
		expect(Cypress.env('idea'), "Idea should be stored in Cypress.env()").to.not.be.undefined

		//WHEN adding enough supporters to that idea
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
						//console.log("========== (1) TaskFunc: Login with SMS Code "+mobile)
						return auth.loginWithSmsCode(mobile, fix.devLoginDummySmsCode)
							.then((user) => {
								//console.log("========== (2) user (id="+user.id+", "+user.email+", "+user.profile.mobilephone+") logged in with Sms Code.")
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
					return prev.then(() => task.func(task.arg))    // BUGFIX: the argument to .then() must be a function that returns a promise, not the function call itself!
				}, Promise.resolve("START"))
				.then(function (result) {
					cy.log("Added " + numSupporters + " supporters to idea(id="+Cypress.env('idea').id+", title='"+Cypress.env('idea').title+"')")
					console.log("======= FINISHED adding supporters")
					return Promise.resolve("done resolve inside")
				});
			
		}

		cy.visit('/')
		// cy.wrap()  will wait until the promises return
		//https://github.com/cypress-io/cypress-example-recipes/blob/master/examples/logging-in__using-app-code/cypress/integration/spec.js
		cy.wrap(addSupportersToIdea())
		cy.devLogin(Cypress.env('randMobilephone'))
		//cy.wait(500)			// BUGFIX: Need to wait until "really" logged in
		cy.visit('/#/proposals/'+Cypress.env('idea').id)
		cy.get('.lawPanel h4.lawTitle > svg').should('have.class', 'fa-file-alt')   // fa-file-alt is the icon for a proposal
		cy.log("SUCCESS. Idea has become a proposal.")
		
		
	})

	it('start a new poll', function() {
		//GIVEN a poll title
		var pollTitle = "Poll created by test "+rand(1000,9999)
		// AND rand user is logged in
		//console.log("pollTitle22", pollTitle)
		//console.log("randmobilephone", Cypress.env('randMobilephone'))
		cy.devLogin(Cypress.env('randMobilephone'))
		// AND views his proposal
		cy.visit('/#/proposals/'+Cypress.env('idea').id)

		// WHEN he starts a new poll
		cy.get('#startNewPollButton').click()
		cy.get('#PollCreate').should('exist')
		cy.get('#createNewPollButton').should('be.disabled')
		cy.get('#pollTitleInput').type(pollTitle)
		cy.get('#createNewPollButton').click()

		// THEN the new poll should have that title
		cy.get('#PollShow').should('exist')
		cy.get('#pollTitle').should('have.text', pollTitle)
		
	})
	
	//TODO: Second proposal joins this poll
	//TODO: (Mock) start voting phase and cast a vote in this poll


})

//GIVEN: user 1 must have an idea
var findIdea = function() {
	var query = {
		status: "IDEA",
		createdByEmail: fix.user1_email
	}
	return api.findByQuery(query).then(page => {
	var ideas = page._embedded.laws
	expect(ideas).to.have.length.of.at.least(1)
	return ideas[0]
	})
}

//GIVEN a newly created idea
var saveNewIdea = function() {
	cy.log("Create new idea")
	var newIdea = {
		title: "Idea created by Test "+rand(1000,9999),
		description: "This is just a random idea that has automatically been created by a test case on "+new Date(),
		area: "/areas/"+fix.area0_id
	}
	return cy.loginWithSmsCode(fix.mobilephone_prefix+"1", fix.devLoginDummySmsCode).then(user => {
		return api.saveNewIdea(newIdea).then(idea => {
			Cypress.env("idea", idea)
			return idea
		})
	})
}
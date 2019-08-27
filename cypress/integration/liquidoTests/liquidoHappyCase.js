/**
 Start to finish HAPPY CASE for Liquido
 */

import api from '../../../src/services/LiquidoApiClient.js'
import auth from '../../../src/services/auth.js'

function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

// QUick shortcut to access test fixture data
var fix

// The individual tests inside this spec.js file run in order
// Some of those tests generate data that is used in later steps.
// This data is stored in Cypress.env
describe('Liquido Happy Case Test', function() {
	before(function() {
		/** Import all fixtures into Cypress.env  and then add some dynamically created values */
		// https://docs.cypress.io/api/commands/fixture.html#Accessing-Fixture-Data
		cy.fixture('liquidoTestFixtures.json').then(fixtures => {
			Cypress.env(fixtures)  // store in cypres environment
			Cypress.env('auth', auth)   // Put a shared instance of auth.js into env. Looks like an ugly hack, but works fine
			//Cypress.Cookies.preserveOnce('session_id', 'remember_token')
			fix = fixtures
			console.log("Cypress.env initialized", fix)
			cy.log("Cypress.env initialized", fix)
		})
	})

	/** Print name of current test to console */
	beforeEach(function() {
		console.log("======= TEST CASE >>>", Cypress.mocha.getRunner().suite.ctx.currentTest.title)
	})

	it('open Liquido start page', function() {
		cy.visit('/')
		cy.get('#LiquidoHome').should('exist')
	})

	it('register as a new user', function() {
		// GIVEN random new user data
		let num = rand(1000,9999)
		var randUsername     = fix.username_prefix + num
		var randEMail        = randUsername + fix.email_suffix
		var randMobilephone  = fix.mobilephone_prefix + num
		var randWebsite      = 'www.fromCypressTest.org'

		// WHEN this user registers
		cy.visit('/')
		cy.get('#RegisterButton').click()
		cy.get('#RegisterPage').should('exist')
		cy.get('#emailInput').type(randEMail)
		cy.get('#fullnameInput').type(randUsername)
		cy.get('#mobilephoneInput').type(randMobilephone)
		cy.get('#websiteInput').type(randWebsite).blur()
		cy.get('#RegisterButton').should('be.enabled').click()
		cy.get('#registerSuccess').should('exist')					// would show error alert if user already exists

		// THEN the user exists in the backend
		cy.loginWithSmsCode(randMobilephone, fix.devLoginDummySmsCode).then(user => {
			console.log("got user", user)
			expect(user.profile.mobilephone).to.equal(randMobilephone)
		})
	})

	it('login via UI: with SMS code', function() {
		// GIVEN the startpage
		cy.visit('/')
		cy.get('#NavLoginButton').click()
		//WHEN user enters login info
		cy.get('#phoneInput').type(fix.user1_mobilephone)
		cy.get('#sendSmsLoginCodeButton').click()
		cy.get('#digit0').type(fix.devLoginDummySmsCode[0])
		cy.get('#digit1').type(fix.devLoginDummySmsCode[1])
		cy.get('#digit2').type(fix.devLoginDummySmsCode[2])
		cy.get('#digit3').type(fix.devLoginDummySmsCode[3])
		cy.get('#digit4').type(fix.devLoginDummySmsCode[4])
		cy.get('#digit5').type(fix.devLoginDummySmsCode[5])
		//THEN user is logged in and there is a success message
		cy.get('#UserHomePage').should('exist')
		cy.get('#LoginSuccess').should('exist')

		
	})

	it('add comment to a proposal', function() {
		//GIVEN:  need at least one proposal that is not yet supported by this user   => precondition must be provided by TestDataCreator.java
		cy.devLogin(fix.user1_mobilephone)
		cy.get('#LiquidoHome').should('exist')
		cy.get('#ProposalsArrow').click()
		cy.get('#ProposalsList').should('exist')
		cy.get('#recentlyNewProposals .lawTitle > a')
			.first().click()
		cy.get('#ProposalShow').should('exist')

		cy.wait(1000)  // need to wait a bit until existing comments are loaded
		let comment = "Very impressive suggestion from Cypress"+rand(1000,9999)
		cy.get('#suggestImprovementInput').type(comment+"{enter}")
		cy.wait(1000)
		cy.get('div.comment > p').contains(comment)
	})

  
	it('add a new idea', function() {
		//GIVEN an idea with a random title
		let num = rand(1000,9999)
		Cypress.env('ideaTitle', fix.ideaTitle_prefix + num)
		Cypress.env('ideaDescription', fix.ideaDescription_prefix + num)

		//WHEN user adds a new idea
		cy.devLogin(fix.user1_mobilephone)
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
		cy.get('.sa-success').should('exist')     // Sweet Alert
	})

	it('add supporters to idea until it becomes a proposal', function() {
		//GIVEN a new idea
		var saveNewIdea = function() {
			var newIdea = {
				title: "Idea created by Test "+rand(1000,9999),
				description: "This is just a random idea that has automatically been created by a test case on "+new Date(),
				area: "/areas/"+fix.area0_id
			}
			return cy.loginWithSmsCode(fix.mobilephone_prefix+"1", fix.devLoginDummySmsCode).then(user => {
				console.log("Add new idea", user)
				return api.saveNewIdea(newIdea)
			})
		}

		//WHEN adding enough supporters to that idea
		var addSupportersToIdea = function(idea) {
			console.log("addSupportersToIdea", idea)

			var requests = []
			for(var i = 2; i<=11; i++) {
				var req = cy.loginWithSmsCode(fix.mobilephone_prefix+i, fix.devLoginDummySmsCode).then(() => {
					console.log("addSupportersToIdea (id="+idea.id+")")
					return api.addSupporterToIdea(idea)
				})
				requests.push(req)
			}

			// This was tricky!!! Need to run this sequentially https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
			// login, add supporter and repeat
			const starterPromise = Promise.resolve(null)
			cy.wrap(
				requests.reduce((chain, req) => chain.then(req), starterPromise)
			)
			.then(res => { 
				console.log("Cypress TEST: Ok, added 10 supporters")
				return idea 
			})
		}

		//THEN that idea should have become a proposal
		var checkThatIdeaHasBecomeProposal = function(idea) {
			console.log("checkThatIdeaHasBecomeProposal")
			return api.getIdea(idea.id).then(proposal => {
				console.log("Received new proposal", proposal)
				expect(proposal.status, "Idea has now become a proposal").to.equal('PROPOSAL')
				return proposal
			})
		}

		// Run test as promise chain
		saveNewIdea()
			.then(addSupportersToIdea)
			.then(checkThatIdeaHasBecomeProposal)
		
		//Implementation note: This test does not really use the UI. It is blazingly fast!
	})


	it('support an idea via UI', function() {
		//GIVEN user1 needs at least one proposal that is not yet supported by this user   => precondition must be provided by TestDataCreator.java
		//cy.devLogin(fix.user1_mobilephone)

		//GIVEN an idea that is not yet liked by the current user
		saveNewIdea().then(idea => {
			cy.devLogin(fix.user2_mobilephone)
			cy.get('#LiquidoHome').should('exist')
			cy.get('#IdeasArrow').click()
			cy.get('#IdeasList').should('exist')

			var lawUri = idea._links.self.href
			//cy.get('.likeButton button:not(.disabled):not(.active)').first().then(btns => {
			cy.get('[data-lawuri="'+lawUri+'"] h4').then(h4s => {
				console.log("Like idea:", h4s[0].textContent)
			})

			// WHEN clicking on the support button
			cy.get('[data-lawuri="'+lawUri+'"] .likeButton button').click()

			//THEN proposal is now supported by currentuser. ie. support button is shown deactivated and shown in blue
			cy.get('[data-lawuri="'+lawUri+'"] .likeButton button').should('have.class', 'active')			

		})
	})

	//TODO: join an existing ppoll
	//TODO: vote in that poll


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

//GIVEN a new idea
var saveNewIdea = function() {
	var newIdea = {
		title: "Idea created by Test "+rand(1000,9999),
		description: "This is just a random idea that has automatically been created by a test case on "+new Date(),
		area: "/areas/"+fix.area0_id
	}
	return cy.loginWithSmsCode(fix.user1_mobilephone, fix.devLoginDummySmsCode).then(user => {
		console.log("Add new idea", user)
		return api.saveNewIdea(newIdea)
	})
}
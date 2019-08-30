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

// The individual tests inside this spec.js file depend on each other and must run in this order.
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
			Cypress.env("user", user)
			expect(user.profile.mobilephone).to.equal(randMobilephone)
		})
	})

	it('add a new idea', function() {
		//GIVEN an idea with a random title
		let num = rand(1000,9999)
		Cypress.env('ideaTitle', fix.ideaTitle_prefix + num)
		Cypress.env('ideaDescription', fix.ideaDescription_prefix + num)

		//WHEN user adds a new idea
		cy.devLogin(Cypress.env('user').profile.mobilephone)
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
		cy.get('#CreateIdeaSuccess').should('exist')     // Success message

		// AND get the idea from the backend and store it in Cypress.env
		cy.loginWithSmsCode(fix.user1_mobilephone, fix.devLoginDummySmsCode)   // MUST login before making any direct api calls
		cy.get('#newIdeaUri').then(elems => {
			var ideaURI = elems[0].textContent
			var idea = api.getIdea(ideaURI).then(idea => {
				console.log("savedIdea", idea)
				Cypress.env("idea", idea)
			})
		})
	})

	it.only('add supporters to idea until it becomes a proposal (no GUI)', function() {
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

		//WHEN adding enough supporters to that idea
		var addSupportersToIdea = function(idea) {
			// https://stackoverflow.com/questions/30853265/dynamic-chaining-in-javascript-promises
			
			console.log("START")
			
			var tasks = []
			for(var i = 4; i<7; i++) {
				tasks.push(function() {
					console.log("START task "+i)
					return auth.loginWithSmsCode(fix.mobilephone_prefix+i, fix.devLoginDummySmsCode).then(user => {
						console.log("AddSupporterToIdea ",idea.title)
						return api.addSupporterToIdea(idea).then(res => {
							console.log("FINSIH task "+i)
							return res
						})
					})
				})
			}
			
			
			tasks.reduce((promiseChain, currentTask) => {
				return promiseChain.then(currentTask);
			}, Promise.resolve()).then(function(res) {
				console.log("DONE", res)
			})
			
			

			/*
			for(var i = 2; i<=11; i++) {
				p = p.then(cy.loginWithSmsCode(fix.mobilephone_prefix+i, fix.devLoginDummySmsCode))
				p = p.then(user => {
					// console.log("----- addSupporterToIdea (idea.id="+idea.id+"), "+user.email+" "+user.profile.mobilephone)
					console.log("..............", user)
					return api.addSupporterToIdea(idea)
				})
			}
			console.log("AFTER for loop")
			/*
			p.then(res => {
				console.log("DONE", res)
			})
			*/
			
			/*
			var requests = []
			for(var i = 2; i<=11; i++) {
				var req = 	cy.loginWithSmsCode(fix.mobilephone_prefix+i, fix.devLoginDummySmsCode).then(() => {
					console.log("----- addSupporterToIdea (id="+idea.id+")")
					return api.addSupporterToIdea(idea)
				})
				requests.push(req)
			}
			// This was tricky!!! Need to run all requests sequentially https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
			// login, add supporter and repeat
			const starterPromise = Promise.resolve(null)
			cy.wrap(
				requests.reduce((chain, req) => chain.then(req), starterPromise)
			)
			*/

		}

		//THEN that idea should have become a proposal with correct status in UI
		var checkThatIdeaHasBecomeProposalInUI = function() {
			cy.visit('/#/proposals/'+Cypress.env('idea').id)
			cy.get('.lawPanel h4.lawTitle > svg').should('have.class', 'fa-file-alt')   // fa-file-alt is the icon for a proposal
			
			/* 
			var idea = Cypress.env("idea")
			console.log("checkThatIdeaHasBecomeProposal", idea)
			return api.getIdea(idea.id).then(proposal => {
				console.log("Received new proposal", proposal)
				expect(proposal.status, "Idea has now become a proposal").to.equal('PROPOSAL')
				return proposal
			})
			*/
		}

		// Run test as promise chain
		//Promise.resolve(Cypress.env("idea"))
		saveNewIdea()
			.then(addSupportersToIdea)
			.then(checkThatIdeaHasBecomeProposalInUI)
		
		//Implementation note: This test does not really use the UI. It is blazingly fast!
	})


	

	//TODO: join an existing poll
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

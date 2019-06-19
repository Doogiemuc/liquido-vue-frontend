/**
 Start to finish HAPPY CASE for Liquido
 */

import api from '../../../src/services/LiquidoApiClient'


function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

describe('Liquido Happy Case Test', function() {

	before(function() {
		/** Import all fixtures into Cypress.env  and then add some dynamically created values */
		cy.fixture('liquidoTestFixtures.json').then(fix => {
			let num = rand(1000,9999)
			Cypress.env(fix)
			Cypress.env('username', fix.username_prefix + num)
			Cypress.env('email', Cypress.env('username') + fix.email_suffix)
			Cypress.env('mobilephone', fix.mobilephone_prefix + num)
			Cypress.env('mobilephoneUrlEncoded', encodeURIComponent(Cypress.env('mobilephone')))
			Cypress.env('ideaTitle', fix.ideaTitle_prefix + num)
			Cypress.env('ideaDescription', fix.ideaDescription_prefix + num)

			//Cypress.Cookies.preserveOnce('session_id', 'remember_token')

			cy.log("Cypress.env", JSON.stringify(Cypress.env()))
		})
	})

  it('open Liquido start page', function() {
    cy.visit('/')
    cy.get('#LiquidoHome').should('exist')
  })

  it('register a new user', function() {
  	cy.visit('/')
  	//MAYBE: This test fails when run against DEV environemnt with autoLoginUser.
		cy.get('#RegisterButton').click()
    cy.get('#RegisterPage').should('exist')
    cy.get('#emailInput').type(Cypress.env('email'))
    cy.get('#fullnameInput').type(Cypress.env('username'))
    cy.get('#mobilephoneInput').type(Cypress.env('mobilephone'))
    cy.get('#websiteInput').type(Cypress.env('website')).blur()
    cy.get('#RegisterButton').should('be.enabled').click()
    cy.get('#registerSuccess').should('exist')								// will show .alert if user already exists
  })

  it('login user', function() {
  	cy.visit('/')
  	cy.get('#NavLoginButton').click()
  	cy.get('#phoneInput').type(Cypress.env('mobilephone'))
  	cy.get('#sendSmsLoginCodeButton').click()
  	cy.get('#digit0').type('9')
  	cy.get('#digit1').type('9')
  	cy.get('#digit2').type('8')
  	cy.get('#digit3').type('8')
  	cy.get('#digit4').type('7')
  	cy.get('#digit5').type('7')
  	cy.get('#UserHomePage').should('exist')
  })

  it('add a new idea', function() {
  	cy.visit('/#/?devLoginMobilephone='+Cypress.env('mobilephoneUrlEncoded'))
  	cy.get('#LiquidoHome').should('exist')
  	cy.get('#IdeasArrow').click()
  	cy.get('#IdeasList').should('exist')
  	cy.get('#AddIdeaButton').click()
  	cy.get('.mce-branding-powered-by').should('exist')		// wait for TinyMCE to load
  	cy.get('#ideaTitle').type(Cypress.env('ideaTitle'))

  	// Type into TinyMCE.  This is the reason why I chose Cypress.
		cy.window().then(win => {
		  win.tinyMCE.activeEditor.setContent(Cypress.env('ideaDescription'))
		  win.tinyMCE.activeEditor.save()   // BUGFIX: Must manually save TinyMCE's content back to the textare to trigger all necessary events. *sic*
		})
		cy.get('#ideaAreaSelect').select(Cypress.env('area0_title'))
		cy.get('#saveIdeaButton').click()
		cy.get('.sa-success').should('exist')			// Sweet Alert

		//TODO: make users new idea become a proposal
		//TODO: join an existing ppoll
		//TODO: vote in that poll

  })

  it('support a proposal', function() {
  	//GIVEN:  need at least one proposal that is not yet supported by this user   => precondition must be provided by TestDataCreator.java
  	cy.visit('/#/?devLoginMobilephone='+Cypress.env('mobilephoneUrlEncoded'))
  	cy.get('#LiquidoHome').should('exist')
  	cy.get('#ProposalsArrow').click()
  	cy.get('#ProposalsList').should('exist')
  	cy.get('#recentlyNewProposals .likeButton button:not(.active)')
  		//.should('have.length.greaterThan', 0)   // this is implicit.  get checks for existence of at least one element
  		.first().click()
  })

	it('add suggestion to a proposal', function() {
  	//GIVEN:  need at least one proposal that is not yet supported by this user   => precondition must be provided by TestDataCreator.java
  	cy.visit('/#/?devLoginMobilephone='+Cypress.env('mobilephoneUrlEncoded'))
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

	it.only('add supportes to idea', function() {
		api.loginWithSmsCode("+49123452", Cypress.env('devLoginDummySmsCode')).then(jwt => {

		  api.addSupporterToIdea(idea, user)

		  api.getMyUser().then(user => {
				console.log("User", user)

			})
    })

	})


})


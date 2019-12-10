/**
 * Regression tests for the most basic functions in liquido web app
 */

import api from '../../../src/services/LiquidoApiClient.js'
import auth from '../../../src/services/auth.js'

function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

// QUick shortcut to access test fixture data
var fix

describe('Liquido Regression Tests', function() {
	

	/** Load test fixturesand then make it easily available as variable "fix" and in Cypress.env
	    https://docs.cypress.io/api/commands/fixture.html#Accessing-Fixture-Data  */
	before(function() {
			cy.fixture('liquidoTestFixtures.json').then(fixtures => {
				Cypress.env(fixtures)  			// store in cypres environment
				Cypress.env('auth', auth)   	// Put a shared instance of auth.js into env. => cy.apiLogin uses this instance.  Looks like an ugly hack, but works fine
				fix = fixtures					// quick access to test fixtures
			})
		})
	
		/** Print name of current test to console */
		beforeEach(function() {
			console.log("===================================================")
			console.log("======= TEST CASE >>>", Cypress.mocha.getRunner().suite.ctx.currentTest.title, "<<<")
			console.log("===================================================")
		})
	

	it('open Liquido start page and login as admin', function() {
		cy.visit('/')
		cy.get('#LiquidoHome').should('exist')
		cy.get('#NavLoginButton').click()
		cy.get('#phoneInput').type(fix.adminMobilephone)
		cy.get('#sendSmsLoginTokenButton').click()
		cy.get('#digit0').should('exist')
		cy.get('#digit0').type(fix.adminSmsToken[0])
		cy.get('#digit1').type(fix.adminSmsToken[1])
		cy.get('#digit2').type(fix.adminSmsToken[2])
		cy.get('#digit3').type(fix.adminSmsToken[3])
		cy.get('#digit4').type(fix.adminSmsToken[4])
		cy.get('#digit5').type(fix.adminSmsToken[5])
		cy.get('div.alert-danger').should('not.exist')
		cy.get('#userMenu').should('exist')

	})

	it('Login with an expired token should not be possible', function() {
		// GIVEN and expired token (This token expired on Dec 10th, 2019)
		var expiredToken = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkBsaXF1aWRvLmRlIiwiaWF0IjoxNTc1OTc0ODA5LCJleHAiOjE1NzU5Nzg0MDl9.jcAOoCOAtiL95r7SfRb0JH91trD49WFGlMSduxwjbkZevC0aZi6l8PIb4JL1sDgNRu-DOWcUStY-Ht0BVzVw7w"

		//localStorage.setItem('liquido-jwt', "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkBsaXF1aWRvLmRlIiwiaWF0IjoxNTc1OTc0ODA5LCJleHAiOjE1NzU5Nzg0MDl9.jcAOoCOAtiL95r7SfRb0JH91trD49WFGlMSduxwjbkZevC0aZi6l8PIb4JL1sDgNRu-DOWcUStY-Ht0BVzVw7w")

		//  AND this token is in the browsers local storage
		localStorage.setItem('liquido-jwt', expiredToken)

		// WHEN visit start page
		cy.visit('/')
		
		// THEN start page should be shown
		cy.get('#LiquidoHome').should('exist')

		// AND  user should NOT be logged in
		cy.get('#NavLoginButton').should('exist')
	})

	it('Check main navigation', function() {
		cy.urlLogin(fix.adminMobilephone, fix.adminSmsToken)
		cy.get('#IdeasArrow').click()
		cy.get('#IdeasList').should('exist')
		cy.get('#ProposalsArrow').click()
		cy.get('#ProposalsList').should('exist')
		cy.get('#PollsArrow').click()
		cy.get('#PollsList').should('exist')
		cy.get('#LawsArrow').click()
		cy.get('#LawsList').should('exist')
	})

	it('Check search', function() {
		cy.urlLogin(fix.adminMobilephone, fix.adminSmsToken)
		cy.get('#SearchButton').click()
		cy.get('#SearchPage').should('exist')
		cy.get('#supportedByYou').click()
		cy.get('.reloadIcon').click()
	})

	it('Check UserHome', function() {
		cy.urlLogin(fix.adminMobilephone, fix.adminSmsToken)
		cy.get('a.avatarImgLink').click()
		cy.get('#UserHomePage').should('exist')

	})
})

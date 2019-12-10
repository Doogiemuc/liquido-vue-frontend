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
	

	it('open Liquido start page', function() {
		cy.visit('/')
		cy.get('#LiquidoHome').should('exist')
	})

	it('Login with an expired token should not be possible', function() {
		// GIVEN and expired token (This token expired on Dec 10th, 2019)
		var expiredToken = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkBsaXF1aWRvLmRlIiwiaWF0IjoxNTc1OTc0ODA5LCJleHAiOjE1NzU5Nzg0MDl9.jcAOoCOAtiL95r7SfRb0JH91trD49WFGlMSduxwjbkZevC0aZi6l8PIb4JL1sDgNRu-DOWcUStY-Ht0BVzVw7w"

		//  AND this token is in the browsers local storage
		localStorage.setItem('liquido-jwt', expiredToken)

		// WHEN visit start page
		cy.visit('/')
		
		// THEN start page should be shown
		cy.get('#LiquidoHome').should('exist')

		// AND  user should NOT be logged in
		cy.get('#NavLoginButton').should('exist')
		
	})

})

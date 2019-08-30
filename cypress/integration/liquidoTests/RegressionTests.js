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

	it('login user via UI: with SMS code', function() {
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
		//GIVEN at least one proposal that is not yet supported by this user => precondition must be provided by TestDataCreator.java
		cy.devLogin(fix.user1_mobilephone)
		cy.get('#LiquidoHome').should('exist')
		cy.get('#ProposalsArrow').click()
		cy.get('#ProposalsList').should('exist')
		cy.get('#recentlyNewProposals .lawTitle > a').first().click()
		cy.get('#ProposalShow').should('exist')
		//WHEN user enters comment
		cy.wait(1000)  // need to wait a bit until existing comments are loaded
		let comment = "Very impressive suggestion from Cypress"+rand(1000,9999)
		cy.get('#suggestImprovementInput').type(comment+"{enter}")
		cy.wait(1000)
		//THEN comment is shown
		cy.get('div.comment > p').contains(comment)
	})

	it('support an idea via UI', function() {
		//GIVEN a new idea that is not created and not yet liked by the current user
		saveNewIdea().then(idea => {
			cy.devLogin(fix.user2_mobilephone)
			cy.get('#LiquidoHome').should('exist')
			cy.get('#IdeasArrow').click()
			cy.get('#IdeasList').should('exist')
			var lawUri = idea._links.self.href
			cy.get('[data-lawuri="'+lawUri+'"] h4').then(h4s => {
				console.log("Like idea:", h4s[0].textContent)
			})

			// WHEN clicking on the support button
			cy.get('[data-lawuri="'+lawUri+'"] .likeButton button').click()

			//THEN proposal is now supported by currentuser. ie. support button is shown deactivated and shown in blue
			cy.get('[data-lawuri="'+lawUri+'"] .likeButton button').should('have.class', 'active')			

		})
	})
})

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
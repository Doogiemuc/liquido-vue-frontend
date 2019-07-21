/**
 Start to finish HAPPY CASE for Liquido
 */

import api from '../../../src/services/LiquidoApiClient.js'
import auth from '../../../src/services/auth.js'

function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

// The individual tests inside this spec.js file run in order
// Some of those tests generate data that is used in later steps.
// This data is stored in Cypress.env
describe('Liquido Happy Case Test', function() {

	before(function() {
		/** Import all fixtures into Cypress.env  and then add some dynamically created values */
    // https://docs.cypress.io/api/commands/fixture.html#Accessing-Fixture-Data
		cy.fixture('liquidoTestFixtures.json').then(fix => {
      this.fix = Cypress.env()


      Cypress.env('auth', auth)   // Shared instance of auth.js    Looks like an ugly hack, but works fine

			//Cypress.Cookies.preserveOnce('session_id', 'remember_token')

			cy.log("Cypress.env initialized", JSON.stringify(Cypress.env()))


		})
	})

  it('open Liquido start page', function() {
    cy.visit('/')
    cy.get('#LiquidoHome').should('exist')
  })

  it.only('register as a new user', function() {
    // GIVEN random new user data
    let num = rand(1000,9999)
    var randUsername     = this.fix.username_prefix + num
    var randEMail        = randUsername + this.fix.email_suffix
    var randMobilephone  = this.fix.mobilephone_prefix + num
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
    cy.devLogin(randMobilephone).then(user => {
      console.log("got user", user)
      expect(user.profile.mobilephone).to.equal(randMobilephone)
    })
  })

  it('login via UI: with SMS code', function() {
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

  it('support one proposal', function() {
  	//GIVEN user1 needs at least one proposal that is not yet supported by this user   => precondition must be provided by TestDataCreator.java
    cy.devLogin('1')
  	//cy.visit('/#/?devLoginMobilephone='+Cypress.env('mobilephoneUrlEncoded'))
  	cy.get('#LiquidoHome').should('exist')
  	cy.get('#ProposalsArrow').click()
  	cy.get('#ProposalsList').should('exist')

    //WHEN clicking on the support button
  	cy.get('#recentlyNewProposals .likeButton button:not(.disabled)').first().then(btn => {
      var h4 = Cypress.$(btn).parent().parent().prev().find("h4")
      console.log(h4.text())
      //cy.log(btn)
      //console.log(btn)
      btn.click()  //.should('be.disabled')
      //THEN proposal is now supported by currentuser. ie. support button is deactivated
      expect(btn, "like button should now be active").to.have.class('active')
    })
  })

	it('add comment to a proposal', function() {
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

  it('create a new idea', function() {

    let num = rand(1000,9999)
    Cypress.env('ideaTitle', this.fix.ideaTitle_prefix + num)
    Cypress.env('ideaDescription', this.fix.ideaDescription_prefix + num)


    cy.visit('/#/?devLoginMobilephone='+Cypress.env('mobilephoneUrlEncoded'))
    cy.get('#LiquidoHome').should('exist')
    cy.get('#IdeasArrow').click()
    cy.get('#IdeasList').should('exist')
    cy.get('#AddIdeaButton').click()
    cy.get('.mce-branding-powered-by').should('exist')    // wait for TinyMCE to load
    cy.get('#ideaTitle').type(Cypress.env('ideaTitle'))

    // Type into TinyMCE.  This is the reason why I chose Cypress.
    cy.window().then(win => {
      win.tinyMCE.activeEditor.setContent(Cypress.env('ideaDescription'))
      win.tinyMCE.activeEditor.save()   // BUGFIX: Must manually save TinyMCE's content back to the textare to trigger all necessary events. *sic*
    })
    cy.get('#ideaAreaSelect').select(Cypress.env('area0_title'))
    cy.get('#saveIdeaButton').click()
    cy.get('.sa-success').should('exist')     // Sweet Alert

    //TODO: make users new idea become a proposal
    //TODO: join an existing ppoll
    //TODO: vote in that poll

  })

	it('add supporters to idea', function() {
    //GIVEN: user 1 must have an idea
    var findIdea = function() {
      var query = {
        status: "IDEA",
        createdByEmail: this.fix.user1_email
      }
      return api.findByQuery(query).then(page => {
        var ideas = page._embedded.laws
        expect(ideas).to.have.length.of.at.least(1)
        return ideas[0]
      })
    }

    //WHEN: adding enough supporters to that idea
    var addSupportersToIdea = function(idea) {
      console.log("addSupportersToIdea", idea)
      return cy.devLogin("2").then(user => {
        return api.addSupporterToIdea(idea, user)
      })
    }

    //THEN: The idea should have become a proposal
    cy.devLogin("1")  // this.fix.user1_mobile
      .then(findIdea)
      .then(addSupportersToIdea)
	})

})


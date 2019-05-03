function rand(min,max)   // Intervall [min, max[
{
  return Math.floor(Math.random()*(max-min)+min);
}

describe('Liquido Happy Case Test', function() {
  let fix

	before(function() {
		cy.fixture('liquidoTestFixtures.json').then(fixtureData => {
			fix = fixtureData
			let num = rand(1000,9999)
			fix.username    = fix.username_prefix + num
			fix.email       = fix.username + fix.email_suffix
			fix.mobilephone = fix.mobilephone_prefix + num
			fix.ideaTitle       = fix.ideaTitle_prefix + num
			fix.ideaDescription = fix.ideaDescription_prefix + num

			//TODO: Cypress.env('ideaTitle', fix.ideaTitle_prefix + num)   // this can be referenced while in this spec file

			cy.log("Test fixtures", JSON.stringify(fix))
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
    cy.get('#emailInput').type(fix.email)
    cy.get('#fullnameInput').type(fix.username)
    cy.get('#mobilephoneInput').type(fix.mobilephone)
    cy.get('#websiteInput').type(fix.website).blur()
    cy.get('#RegisterButton').should('be.enabled').click()
    cy.get('#registerSuccess').should('exist')								// will show .alert if user already exists
  })

  it('login user', function() {
  	cy.visit('/')
  	cy.get('#NavLoginButton').click()
  	cy.get('#phoneInput').type(fix.mobilephone)
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
  	cy.visit('/#/liquidoHome?devAutoLoginUserIdx=1')
  	cy.get('#LiquidoHome').should('exist')
  	cy.get('#IdeasArrow').click()
  	cy.get('#IdeasList').should('exist')
  	cy.get('#AddIdeaButton').click()
  	cy.get('.mce-branding-powered-by').should('exist')		// wait for TinyMCE to load
  	cy.get('#ideaTitle').type(fix.ideaTitle)

  	// Type into TinyMCE.  This is the reason why I chose Cypress.
		cy.window().then(win => {
		  win.tinyMCE.activeEditor.setContent(fix.ideaDescription)
		  win.tinyMCE.activeEditor.save()   // BUGFIX: Must manually save TinyMCE's content back to the textare to trigger all necessary events. *sic*
		})
		cy.get('#ideaAreaSelect').select(fix.area0_title)
		cy.get('#saveIdeaButton').click()
		cy.get('.sa-success').should('exist')			// Sweet Alert

		//TODO: make users new idea become a proposal
		//TODO: join an existing ppoll
		//TODO: vote in that poll

		//TODO: How to track data while testing    vs.   split into seperate indipendant tests  (with parameters)
  })

  it('support a proposal', function() {
  	//GIVEN:  need at least one proposal that is not yet supported by this user   => precondition must be provided by TestDataCreator.java
  	cy.visit('/#/liquidoHome?devAutoLoginUserIdx=1')
  	cy.get('#LiquidoHome').should('exist')
  	cy.get('#ProposalsArrow').click()
  	cy.get('#ProposalsList').should('exist')
  	cy.get('#recentlyNewProposals .likeButton button:not(.active)')
  		//.should('have.length.greaterThan', 0)   // this is implicit.  get checks for existence of at least one element
  		.first().click()
  })

	it.only('add suggestion to a proposal', function() {
  	//GIVEN:  need at least one proposal that is not yet supported by this user   => precondition must be provided by TestDataCreator.java
  	cy.visit('/#/liquidoHome?devAutoLoginUserIdx=1')
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




})


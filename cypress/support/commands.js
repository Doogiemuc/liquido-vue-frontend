// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

/** 
 * Login a user via the UI. This uses the devLoginMobilephne URL shortcut
 * When the call returns, then the app is then shown on the start page.
 * This is quick and easy, but only available in DEVELOPMENT environemnt
 */
Cypress.Commands.add('urlLogin', (mobilephone) => {
	console.log("Cypress: login via url: "+mobilephone)
	cy.visit('/#/?devLoginMobilephone='+encodeURIComponent(mobilephone))
	cy.get('#userMenu').should('exist')
})

/**
 * Quickly login a given user for tests. This accesses the low level API without any GUI interaction
 * 
 * Keep in mind that this logs in the user in the auth instance of the TEST.
 * This is a different auth instance than the one used by the Vue web app!
 * 
 * @param mobile {String} user's mobilephone, e.g. fix.user1_mobile
 * @return user info as json    (current JWT can be fetched with auth.getJWT if you need it)
 */ 
Cypress.Commands.add('loginWithSmsToken', (mobilephone, smsToken) => {
	var auth = Cypress.env('auth')
	return auth.loginWithSmsToken(mobilephone, smsToken).then(user => {
		console.log("Cypress: loginWithSmsCode via API as "+user.email+" "+user.profile.mobilephone+" (id="+user.id+")")
		return user
	})
})

/** Goto is like cy.visit but you can also pass URL params that will be uriencoded. */
Cypress.Commands.add('goto', (urlOrOpts, config) => {
	var opts 
	if (Cypress._.isString(urlOrOpts)) {
		if (config === undefind) {
			return cy.visit(urlOrOpts)    // only string passed
		} else {
			opts = config
			opts.url = urlOrOpts
		}
	} else {
		opts = urlOrOpts
	}

	if (opts.params) {
		var urlParams = Cypress.$.param(opts.params);
		opts.url = opts.url+'?'+urlParams
	}
	
	return cy.visit(opts)
})


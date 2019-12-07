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
 * Login a user via the UI. This uses the devLoginMobilephone URL shortcut
 * When the call returns, then the app is then shown on the start page.
 */
Cypress.Commands.add('urlLogin', (mobilephone, token) => {
	console.log("Cypress: login via url: "+mobilephone)
	cy.visit('/#/?'+Cypress.$.param({devLoginMobilephone: mobilephone, token: token}))
	cy.get('#userMenu').should('exist')
})

/**
 * Quickly login the api client instance that is used by Cypress. This accesses the low level API without any GUI interaction
 * 
 * Keep in mind that this logs in the user in the auth instance of the Cypress Test.
 * This is a different auth instance than the one used by the Vue web app!
 * 
 * @param mobile {String} user's mobilephone, e.g. fix.user1_mobile
 * @return user info as json    (current JWT can be fetched with auth.getJWT if you need it)
 */ 
Cypress.Commands.add('apiLogin', (mobilephone, token) => {
	var auth = Cypress.env('auth')
	var backendBaseURL = Cypress.env('backendBaseURL')
	return cy.request({
		method: 'GET',
		url: backendBaseURL+'/dev/getJWT' + '?' + Cypress.$.param({mobile: mobilephone, token: token})
	}).then(res => {
		console.log("Cypress: devLogin via API. mobilephone=" + mobilephone)
		return auth.storeJwt(res.body)
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


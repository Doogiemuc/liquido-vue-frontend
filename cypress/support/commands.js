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

/** Quickly login a user via UI. Will finish on start page */
Cypress.Commands.add('devLoginUI', (mobile) => {
	//var mobilephoneUrlEncoded = encodeURIComponent(Cypress.env('mobilephone_prefix') + mobileSuffix)
	cy.visit('/#/?devLoginMobilephone='+mobile)
})

/**
 * Quickly login a given user via mobilephone
 * @param mobile {String} user's mobilephone, e.g. fix.user1_mobile
 * @return user info as json    (current JWT can be fetched with auth.getJWT if you need it)
 */
Cypress.Commands.add('devLogin', (mobile) => {
	var auth = Cypress.env('auth')
	//var mobilephone = Cypress.env('mobilephone_prefix') + mobileSuffix
	return auth.loginWithSmsCode(mobile, Cypress.env('devLoginDummySmsCode')).then(user => {
		console.log("Cypress: devLogin "+user.email+" (id="+user.id+")")
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
		var params = Cypress.$.param(config.params);
		opts.url = opts.url+'?'+params
	}
	console.log("Command goto", opts)
	return cy.visit(opts)
})

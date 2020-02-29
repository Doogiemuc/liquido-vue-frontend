/**
 * auth.js
 * Authentication and autorhization
 *
 * Our web client authenticates with a JsonWebToken (JWT) against the backend
 * This module is responsible for registering, login and logout.
 * When a JWT is received, it is added as a default heder to LiquidoApiClient.js
 */

import apiClient from './LiquidoApiClient'
import loglevel from 'loglevel'

const axios = require('axios')
const JWT_ITEM_KEY = 'liquido-jwt'
var log = loglevel.getLogger('auth.js')

export default {
	//TODO: currently currentUser is mirrowed here AND in LiquidoApiClient.js which is not nice. currentUser should only be handled => HERE <= !
	currentUser: undefined,

	isLoggedIn() {
		return this.currentUser !== undefined && apiClient.jsonWebToken !== undefined
	},

	/**
	 * Register as a new user
	 */
	register(newUser) {
		log.info("Register as new user ", newUser)
		return axios({
			method: 'POST',
			url: "/auth/register",
			headers: { 'Content-Type' : 'application/json' },
			data: newUser
		})
		.then(res => { return res.data })
	},

	//edit account data is in LiquidoApiClient.js because it needs authentication

	/**
	 * Lazy fetch currentUser.
	 * @return cached currentUser or try to login with stored JWT, otherwiese reject promise
	 */
	fetchCurrentUser() {
		if (this.currentUser) return Promise.resolve(this.currentUser)
		var jsonWebToken = localStorage.getItem(JWT_ITEM_KEY)   //  getItem may return null!
		if (jsonWebToken) {
			log.debug("Found JWT in localStorage.")
			return this.storeJwt(jsonWebToken)
		} else {
			return Promise.reject({msg: "Cannot fetchCurrentUser. Don't have JWT.", err: "CANNOT_FETCH_USER"})
		}
	},


	/** Request a one time token for login */
	requestAuthyToken(mobilephone) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		return axios.get('/auth/requestToken', { params: { mobile: cleanMobilePhone} } )
		  .catch(err => {
				var msg = "Cannot requestSmsToken for "+mobilephone
				log.warn(msg, err)
				return Promise.reject({msg: msg, err: err})
			})
	},

	/**
	 * Login with a token that was sent via SMS. Will also store JWT to localStorage
	 * @param {String} mobilephone valid mobile phone number
	 * @param {String} smsToken 6-digit SMS code that was sent to the user's mobile phone
	 * @return user info JSON
	 */
	loginWithToken(mobilephone, smsToken) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		log.debug("Login request with SMS token from "+cleanMobilePhone)
		return axios.get('/auth/loginWithToken', { params: { mobile: cleanMobilePhone, token: smsToken} } )
		.then(res =>  {
			return this.storeJwt(res.data)
		})
		.catch(err => {
			var msg = "Cannot loginWithToken mobilephone="+mobilephone
			log.warn(msg, err)
			return Promise.reject({msg: msg, err: err})
		})
	},

	/**
	 * When we've got a JWT, then store it globally and fetch user details
	 * @pararm {String} Json Web Token
	 * @return User info JSON
	 */
	storeJwt(jwt) {
		if (!jwt) return Promise.reject({msg: "Cannot store undefined JWT!"})
		localStorage.setItem(JWT_ITEM_KEY, jwt)
		apiClient.setJsonWebTokenHeader(jwt)
		return apiClient.getMyUser()
			.then(user => {
				log.info("User (id="+user.id+", "+user.email+", "+user.profile.mobilephone+") logged in successfully.")
				this.currentUser = user
				return user
			})
			.catch(err => {
				if (err.data && err.data.liquidoErrorName === "JWT_TOKEN_EXPIRED") {
					log.info("JWT is expired. Need to re-login.", err)
				} else {
					log.warn("Cannot find user details with JWT. Invalid JWT?", err)
				}
				this.logout()
				return Promise.reject({msg: "Cannot find user details with JWT.", err: err})
			})
	},

	/** Request a one time token for login that will be sent via email */
	requestLoginEmail(email) {
		return axios.get('/auth/requestEmailToken', { params: { email: email } } )
		  .catch(err => {
				var msg = "Cannot requestEmailToken for "+email
			  log.warn(msg, err)
			  return Promise.reject({msg: msg, err: err})
		  })
	},

	loginWithEmailToken(email, token) {
		log.debug("Login with email token "+email)
		return axios.get('/auth/loginWithEmailToken', { params: { email: email, token: token} } )
		  .then(res =>  {
			return this.storeJwt(res.data)
		  })
		  .catch(err => {
				var msg = "Cannot login with email token"
				log.warn(msg, err)
				return Promise.reject({msg: msg, err: err})
		  })
	},

	/** Logout the current user */
	logout() {
		log.info("LOGOUT " + (this.currentUser ? this.currentUser.email : ""))
		this.currentUser = undefined
		localStorage.removeItem(JWT_ITEM_KEY)
		apiClient.setJsonWebTokenHeader(undefined)
	},

	/**
	 * Quick login for development.
	 * Still MUST provide valid token.
	 *
	 * GET /dev/loginWithToken?mobile=%2B49123451389&token=123456
	 *
	 * @return the loggin in user as JSON
	 */
	devLogin(mobilephone, token) {
		log.debug("devLogin for mobilephone ", mobilephone)
		if (!token) return Promise.reject("ERROR: Need valid token for devLogin!")
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		this.logout()  // clear any pre-existing JWT that might be expired
		return axios.get('/dev/getJWT', { params: { mobile: cleanMobilePhone, token: token} } )
			.then(res =>  {
				return this.storeJwt(res.data)
			})
			.catch(err => {
				log.warn("Cannot devLogin mobilephone="+mobilephone, err)
				return Promise.reject({msg: "Cannot devLogin mobilephone="+mobilephone, err: err})
			})
	},

	/** remove everything except numbers and the plus sign from mobilephone */
	cleanMobilePhone(mobilephone) {
		if (mobilephone == undefined) return ""
		return mobilephone.replace(/[^0-9\+]/g, '')
	},

}

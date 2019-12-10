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
			return Promise.reject("Cannot fetchCurrentUser. Don't have JWT.")
		}
	},


	/** Request a one time token for login that will be sent via SMS */
	requestSmsToken(mobilephone) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		return axios.get('/auth/requestSmsToken', { params: { mobile: cleanMobilePhone} } )
		  .catch(err => { log.error("Cannot requestSmsToken for "+mobilephone, err) })
	},

	/**
	 * Login with a token that was sent via SMS. Will also store JWT to localStorage
	 * @param {String} mobilephone valid mobile phone number
	 * @param {String} smsToken 6-digit SMS code that was sent to the user's mobile phone
	 * @return user info JSON
	 */
	loginWithSmsToken(mobilephone, smsToken) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		log.debug("Login request with SMS token from "+cleanMobilePhone)
		return axios.get('/auth/loginWithSmsToken', { params: { mobile: cleanMobilePhone, token: smsToken} } )
		.then(res =>  {
			return this.storeJwt(res.data)
		})
		.catch(err => {
			log.error("Cannot loginWithSmsToken mobilephone="+mobilephone, err)
			return Promise.reject({msg: "Cannot loginWithSmsToken mobilephone="+mobilephone, err: err})
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
				apiClient.setCurrentUser(user)
				return user
			})
			.catch(err => {
				log.warn("Cannot find user details with JWT. Invalid or expired JWT?", err)
				this.logout()
				return Promise.reject({msg: "Cannot find user details with JWT. Invalid or expired JWT?", err: err})
			})
	},

	/** Request a one time token for login that will be sent via email */
	requestLoginEmail(email) {
		return axios.get('/auth/requestEmailToken', { params: { email: email } } )
		  .catch(err => { 
			  log.error("Cannot requestEmailToken for "+email, err) 
			  return Promise.reject(err)
		  })
	},

	loginWithEmailToken(email, token) {
		log.debug("Login with email token "+email)
		return axios.get('/auth/loginWithEmailToken', { params: { email: email, token: token} } )
		  .then(res =>  {
			return this.storeJwt(res.data)
		  })
		  .catch(err => {
			log.error("Cannot login with email token", err)
			return Promise.reject("Cannot login with email token"+err)
		  })
	},

	/** Logout the current user */
	logout() {
		log.info("LOGOUT")
		this.currentUser = undefined
		localStorage.removeItem(JWT_ITEM_KEY)
		apiClient.setJsonWebTokenHeader(undefined)
		apiClient.setCurrentUser(undefined)
	},

	/** 
	 * Quick login for development. 
	 * Still MUST provide valid token.
	 * 
	 * GET /dev/loginWithSmsToken?mobile=%2B49123451389&token=123456
	 * 
	 * @return the loggin in user as JSON
	 */
	devLogin(mobilephone, token) {
		log.debug("devLogin for mobilephone ", mobilephone)
		if (!token) return Promise.reject("ERROR: Need valid token for devLogin!")
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		return axios.get('/dev/getJWT', { params: { mobile: cleanMobilePhone, token: token} } )
			.then(res =>  {
				return this.storeJwt(res.data)
			})
			.catch(err => {
				log.error("Cannot loginWithSmsToken mobilephone="+mobilephone, err)
				return Promise.reject({msg: "Cannot loginWithSmsToken mobilephone="+mobilephone, err: err})
			})
	},

	/** remove everything except numbers and the plus sign from mobilephone */
	cleanMobilePhone(mobilephone) {
		if (mobilephone == undefined) return ""
		return mobilephone.replace(/[^0-9\+]/g, '')
	},

}

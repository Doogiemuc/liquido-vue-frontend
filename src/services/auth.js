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
	//TODO: currently currentUser is mirrowed here AND in LiquidoApiClient.js  which is not nice. But I need it in both places
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
			log.debug("Got JWT from localStorage.")
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
			log.error("Cannot login  user", err)
			return Promise.reject("Cannot login user"+err)
		})
	},

	/** 
	 * When we've got a JWT, then store it globally and fetch user details 
	 * @pararm {String} Json Web Token
	 * @return User info JSON
	 */
	storeJwt(jwt) {
		if (!jwt) return Promise.reject("Need JWT")
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
				//TODO: refresh JWT if expired
				log.error("Cannot find user details with JWT. Invalid JWT?")
				return Promise.reject("Cannot find user details with JWT. Invalid JWT?")
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

	/** Quick login for development. This is called from main.js when NODE_ENV === 'development' */
	devLogin(mobilephone) {
		if (process.env.NODE_ENV !== 'development') throw new Error("dev login is only allowed in NODE_ENV='development' !")
		return this.loginWithSmsToken(mobilephone, process.env.devLoginDummySmsToken)
	},

	/** remove everything except numbers and the plus sign from mobilephone */
	cleanMobilePhone(mobilephone) {
		if (mobilephone == undefined) return ""
		return mobilephone.replace(/[^0-9\+]/g, '')
	},

}

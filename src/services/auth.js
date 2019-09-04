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

	/**
	 * Lazy fetch currentUser.
	 * @return cached currentUser or try to login with stored JWT
	 *         otherwiese reject promise
	 */
	fetchCurrentUser() {
		if (this.currentUser) return Promise.resolve(this.currentUser)
		var jsonWebToken = localStorage.getItem(JWT_ITEM_KEY)   //  getItem may return null!
		if (jsonWebToken) {
			log.debug("Got JWT from localStorage.")
		} else {
			throw new Error("Cannot fetchCurrentUser. Don't have JWT.")
		}
		return this.loginWithJWT(jsonWebToken)
	},


	/** send a login code via SMS */
	requestSmsCode(mobilephone) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		return axios.get('/auth/requestSmsCode', { params: { mobile: cleanMobilePhone} } )
		  .catch(err => {
			  console.error("Cannot requestSmsCode for ", mobile, err)
		  })
	},

	/**
	 * Login with a SMS code. Will also store JWT to localStorage
	 * @param {String} mobilephone valid mobile phone number
	 * @param {String} smsCode 6-digit SMS code that was sent to the user's mobile phone
	 * @return user info JSON
	 */
	loginWithSmsCode(mobilephone, smsCode) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		log.debug("Login request with SMS code from "+cleanMobilePhone)
		return axios.get('/auth/loginWithSmsCode', { params: { mobile: cleanMobilePhone, code: smsCode} } )
		.then(res =>  {
			return this.loginWithJWT(res.data)
		})
		.catch(err => {
			log.error("Cannot login  user", err)
			return Promise.reject("Cannot login user"+err)
		})
	},

	/** When we've got a JWT, then store it globally and fetch user details */
	loginWithJWT(jwt) {
		if (!jwt) return Promise.reject("Need JWT")
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

	/** send a link to login via email */
	requestMagicEmailLink() {
		//TODO: implement login via E-Mail
		return Promise.resolve("/WithToken?token=ABCDEF")
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
		return this.loginWithSmsCode(mobilephone, process.env.devLoginDummySmsCode)
	},

	/** remove everything except numbers and the plus sign from mobilephone */
	cleanMobilePhone(mobilephone) {
		if (mobilephone == undefined) return ""
		return mobilephone.replace(/[^0-9\+]/g, '')
	},

}

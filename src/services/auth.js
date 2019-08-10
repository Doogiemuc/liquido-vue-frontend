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
	jsonWebToken: undefined,      		// JWT
	currentUser:  undefined,			// Currenely logged in user

	isLoggedIn() {
		return this.currentUser !== undefined
	},

	getJWT() {
    	return this.jsonWebToken
  	},

	setJWT(jwt) {
		this.jsonWebToken = jwt
		apiClient.setJsonWebTokenHeader(jwt)
		localStorage.setItem(JWT_ITEM_KEY, jwt)
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
		this.jsonWebToken = localStorage.getItem(JWT_ITEM_KEY)   //  getItem may return null!
		if (!this.jsonWebToken) throw new Error("Cannot fetchCurrentUser. Don't have JWT.")
		return this.loginWithJWT(this.jsonWebToken)
	},


	/** send a login code via SMS */
	requestSmsCode(mobile) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		console.log("sendSmsLoginCode", cleanMobilePhone)
		return axios.get('/auth/requestSmsCode', { params: { mobile: cleanMobilePhone} } )
	},

	/**
	 * Login with a SMS code. Will also store JWT to localStorage
	 * @param {String} mobilephone valid mobile phone number
	 * @param {String} smsCode 6-digit SMS code that was sent to the user's mobile phone
	 * @return user info JSON
	 */
	loginWithSmsCode(mobilephone, smsCode) {
		var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
		log.debug("Login via SMS for "+cleanMobilePhone+ " with sms code.")
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
		this.setJWT(jwt)
		return apiClient.getMyUser()
		.then(user => {
			log.info("User logged in successfully.", user)
			this.currentUser = user
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
		log.info("LOGOUT", this.currentUser)
		this.currentUser = undefined
		this.jsonWebToken = undefined
		localStorage.removeItem(JWT_ITEM_KEY)
		apiClient.setJsonWebTokenHeader(undefined)
		this.currentUser = undefined
	},

	/** Quick login for development. This is called from main.js when NODE_ENV === 'development' */
	devLogin(mobilephone) {
		console.log(process.env)
		if (process.env.NODE_ENV !== 'development') throw new Error("dev login is only allowed in NODE_ENV='development' !")
		console.log("Development login of mobile phone "+mobilephone)
		return this.loginWithSmsCode(mobilephone, process.env.devLoginDummySmsCode)
	},

	/** remove everything except numbers and the plus sign from mobilephone */
	cleanMobilePhone(mobilephone) {
		if (mobilephone == undefined) return ""
		return mobilephone.replace(/[^0-9\+]/g, '')
	},

}

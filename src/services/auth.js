import apiClient from './LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('auth.js')

const JWT_ITEM_KEY = 'liquido-jwt'

export default {
	currentUser: undefined,			// Currenely logged in user

	isLoggedIn() {
		return this.currentUser !== undefined
	},

  /**
   * Lazy fetch currentUser.
   * @return cached currentUser or try to login with stored JWT
   *         otherwiese reject promise
   */
  fetchCurrentUser() {
    if (this.currentUser) return Promise.resolve(this.currentUser)
    var jwt = localStorage.getItem(JWT_ITEM_KEY)   //  getItem may return null :-(  I love JavaScript *sic*
    return this.loginWithJWT(jwt)
  },

  /**
   * Login with a SMS code. Will also store JWT to localStorage
   * @param {String} mobilephone valid mobile phone number
   * @param {String} smsCode 6-digit SMS code that was sent to the user's mobile phone
   * @return user info JSON
   */
  loginWithSmsCode(mobilephone, smsCode) {
    var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
    log.debug("Login via SMS for "+cleanMobilePhone)
    return apiClient.loginWithSmsCode(cleanMobilePhone, smsCode)
      .then(jwt =>  { return this.loginWithJWT(jwt) })
      .catch(err => {
      	log.error("Cannot login  user", err)
      	return Promise.reject("Cannot login user"+err)
      })
  },

  /** When we've got a JWT, then store it globally and fetch user details */
  loginWithJWT(jwt) {
    if (!jwt) return Promise.reject("Need JWT")
    apiClient.setJsonWebToken(jwt)
    localStorage.setItem(JWT_ITEM_KEY, jwt)
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

  /** Logout the current user */
  logout() {
    log.info("LOGOUT", this.currentUser)
    localStorage.removeItem(JWT_ITEM_KEY)
    apiClient.logout()
    this.currentUser = undefined
  },

  /** Quick login for development. This is called from main.js when NODE_ENV === 'development' */
  devLogin(mobilephone) {
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

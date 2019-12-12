<template>
  <div class="container" id="LoginPage">
    <div class="row topRow">
      <div class="col-md-5">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Login via email</h3>
          </div>
          <div class="panel-body text-center">
            <form accept-charset="UTF-8" role="form" class="loginLinkForm">
              <fieldset>
                <div class="form-group">
                  <input class="form-control" id="emailInput" placeholder="email" name="email" type="text" v-model="email">
                </div>
                <p>An email with a login link will be sent to your email account.</p>
                <button type="submit" id="loginLinkButton" @click.prevent="requestLoginEmail()" class="btn btn-primary" :disabled="!isEmailValid">Send login link</button>
              </fieldset>
            </form>

            <div class="alert alert-success" v-if="emailSuccess">
              <p>Login link has been sent. You may now close this window. Click on the link in the email to login.</p>
            </div>
            <div class="alert alert-danger" v-if="emailErrorMsg">
              <button type="button" class="close" aria-label="Close" @click="emailErrorMsg = ''"><span aria-hidden="true">&times;</span></button>
               <span v-html="emailErrorMsg"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-2">&nbsp;</div>

      <div class="col-md-5">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Login via SMS</h3>
          </div>
          <div class="panel-body text-center">
            <form accept-charset="UTF-8" role="form" class="phoneForm">
              <fieldset>
                <div class="form-group">
                  <input class="form-control" id="phoneInput" placeholder="mobile phone number" name="mobilephone" type="text" v-model="mobilephone">
                </div>
                <p>A login token will be sent to your mobile phone via SMS.</p>
                <button type="submit" id="sendSmsLoginTokenButton" @click.prevent="requestSmsToken()" class="btn btn-primary" :disabled="disableSendSmsTokenButton">Send login token</button>
              </fieldset>
            </form>
            <form class="form-inline" v-if="smsTokenSent">
              <div class="form-group">
                <p>Enter the 6-digit token that you have received via SMS:</p>
                <div class="digit-group" id="smsTokenInputs">
                  <input type="text" class="form-control digit" id="digit0" tabindex="1" v-model="digits[0]" v-on:keypress.prevent="keypressDigit(0, $event)">
                  <input type="text" class="form-control digit" id="digit1" tabindex="2" v-model="digits[1]" v-on:keypress.prevent="keypressDigit(1, $event)">
                  <input type="text" class="form-control digit" id="digit2" tabindex="3" v-model="digits[2]" v-on:keypress.prevent="keypressDigit(2, $event)">
                  <input type="text" class="form-control digit" id="digit3" tabindex="3" v-model="digits[3]" v-on:keypress.prevent="keypressDigit(3, $event)">
                  <input type="text" class="form-control digit" id="digit4" tabindex="3" v-model="digits[4]" v-on:keypress.prevent="keypressDigit(4, $event)">
                  <input type="text" class="form-control digit" id="digit5" tabindex="3" v-model="digits[5]" v-on:keypress.prevent="keypressDigit(5, $event)">
                </div>
              </div>
            </form>
            <p></p>
            <div class="alert alert-danger" v-if="smsErrorMsg">
              <button type="button" class="close" aria-label="Close" @click="smsErrorMsg = ''"><span aria-hidden="true">&times;</span></button>
              <span v-html="smsErrorMsg"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row lastRow">
      <div class="col-md-12 text-right">
        <router-link to="/register" role="button" class="btn btn-default">Register &raquo;</router-link>
      </div>
    </div>
  </div>
</template>

/**
 * HTML page where the user can login
 */
<script>

import apiClient from '../services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('LoginPage.vue');

// Very simple RegEx for a valid email adress.
const validEMailRe = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export default {
  props: {
    'initEmail': { type: String, required: false, default: "" },
	'initMobilePhone': { type: String, required: false, default: "" },
	'token': { type: String, required: false, default: undefined },   // email login token
  },

  data () {
    return {
      emailSuccess: false,
      emailErrorMsg: '',
      smsTokenSent: false,
      smsErrorMsg: '',
      email: this.initEmail,
      mobilephone: this.initMobilePhone,
      rememberMe: false,
      smsTokenSent: false,
      digits: []            // 6 digit sms token entered by user
    }
  },

  computed: {
    isDevEnv() { return process.env.NODE_ENV === 'development' },
    smsToken() { return this.digits[0]+this.digits[1]+this.digits[2]+this.digits[3] },
    isEmailValid() {
      return validEMailRe.test(this.email)
    },
    disableSendSmsTokenButton() {
      return this.mobilephone.length < 5 || this.smsTokenSent
    },
  },

  mounted() {
	  console.log("EmailLoginToken", this.token)
	  if (this.email && this.token) {
		  this.loginWithEmailToken(this.email, this.token)
	  }
  },

  methods: {
    /** only accept digits */
    keypressDigit(digitNo, evt) {
      if (evt.key.match(/[0123456789]/)) {
        this.$set(this.digits, digitNo, evt.key)  // must use Vue's reactive $set, because this.digits is an array
        if ($(evt.target).nextAll("input").length > 0) {
          $(evt.target).nextAll("input")[0].focus()  // focus next input
        }
        if (digitNo == 5) {     // when the sixth digit is entered, then immidiately validate the entered sms token.
          this.loginWithSmsToken()
        }
      }
    },

    /** request login token that will be sent via SMS */
    requestSmsToken() {
      this.smsTokenSent = true
      this.smsErrorMsg = ''
      this.digits = []
      this.$root.auth.requestSmsToken(this.mobilephone).then(res => {
        this.smsTokenSent = true
        this.$nextTick(function () {
          $('#digit0').focus()
        })
      }).catch(err => {
        if (err.response.data.liquidoErrorName === "MOBILE_NOT_FOUND") {
          this.smsErrorMsg = 'Mobile number not found.<br/>You must <a href="/#/register">register</a> first.'
        } else {
          this.smsErrorMsg = "Could not send SMS."
        }
        this.smsTokenSent = false
        log.error(err)
      })
    },

    loginWithSmsToken() {
      var smsToken = this.digits.join("")
      this.$root.auth.loginWithSmsToken(this.mobilephone, smsToken)
        .then(user => {
          this.smsErrorMsg = ""
          iziToast.success({
            id: "LoginSuccess",
            title: 'Login',
            message: 'You are now logged in as '+user.email,
            position: 'bottomRight',
          })
          this.$router.push('/userHome')
        }).catch(err => {
          this.smsErrorMsg = "SMS token not valid."
          this.smsTokenSent = false
          log.error("Error in loginWithSmsToken", err)
        })
	},

	/** send a ling via email */
    requestLoginEmail() {
      this.$root.auth.requestLoginEmail(this.email).then(res => {
        this.emailSuccess = true
      }).catch(error => {
		this.emailSuccess = false
		if (error.data && error.data.liquidoErrorName === "CANNOT_LOGIN_EMAIL_NOT_FOUND") {
			this.emailErrorMsg = "I don't know this email. You must register first."
		} else {
			this.emailErrorMsg = "There was an error while sending the email.<br/>Please try again later."
		}
      })
    },

	loginWithEmailToken() {
	  log.debug("Login from email. token="+this.token)
      this.$root.auth.loginWithEmailToken(this.email, this.token)
        .then(user => {
          this.emailErrorMsg = ""
          iziToast.success({
			id: "LoginSuccess",
            title: 'Login',
            message: 'You are now logged in as '+user.email,
            position: 'bottomRight',
          })
          this.$router.push('/userHome')
        }).catch(err => {
          this.emailSuccess = false
          this.emailErrorMsg = "Token from email was not valid."
          log.error("Error in loginWithEmailToken", err)
        })
    },

  },


}
</script>

<style scoped>
.topRow {
  margin-top: 50px;
}
.lastRow {
  margin-top: 50px;
}
.phoneForm {
  margin-bottom: 1em;
}
.loginLinkForm {
  margin-bottom: 1em;
}
.digit-group {
  white-space: nowrap;
}
.digit {
  width: 2.5ch;
  height: 24pt;
  font-size: 24pt;
  text-align: center;
  display: inline-block; /* prevent wrapping also on narrow mobile view */
}
</style>

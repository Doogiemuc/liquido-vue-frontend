<template>
  <div class="container">
    <div class="row topRow">

      <div class="col-md-5">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Login via email</h3>
          </div>
          <div class="panel-body text-center">
            <form accept-charset="UTF-8" role="form" class="magicLinkForm">
              <fieldset>
                <div class="form-group">
                  <input class="form-control" id="emailInput" placeholder="email" name="email" type="text" v-model="email">
                </div>
                <p>An email with a magic link will be sent to your account.</p>
                <button type="submit" id="magicLinkButton" @click.prevent="sendMagicLink()" class="btn btn-primary":disabled="!isEmailValid">Send magic link</button>
              </fieldset>
            </form>

            <div class="alert alert-success" v-if="emailSuccess">
              <p>Magic link has been sent. You may now close this window. Click on the link in the email to login.</p>
            </div>
            <div class="alert alert-danger" v-if="emailErrorMsg">
              <button type="button" class="close" aria-label="Close" @click="emailErrorMsg = ''"><span aria-hidden="true">&times;</span></button>
              {{emailErrorMsg}}
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
                <p>A login code will be sent your mobile phone via SMS.</p>
                <button type="submit" id="loginCodeButton" @click.prevent="sendSmsLoginCode()" class="btn btn-primary" :disabled="disableSendSmsCodeButton">Send login code</button>
              </fieldset>
            </form>
            <form class="form-inline" v-if="smsCodeSent">
              <div class="form-group">
                <p>Enter the 6-digit code that you have received via SMS:</p>
                <div class="digit-group">
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

var validEMailRe = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export default {
  data () {
    return {
      emailSuccess: false,
      emailErrorMsg: '',
      smsCodeSent: false,
      smsErrorMsg: '',
      email: '',
      mobilephone: '',
      rememberMe: false,
      smsCodeSent: false,
      digits: []            // 6 digit sms code entered by user
    }
  },

  computed: {
    isDevEnv() { return process.env.NODE_ENV === 'development' },
    devLoginUser() { return process.env.devLoginUser },
    smsCode() { return this.digits[0]+this.digits[1]+this.digits[2]+this.digits[3] },
    isEmailValid() {
      return validEMailRe.test(this.email)
    },
    disableSendSmsCodeButton() {
      return this.mobilephone.length < 5 || this.smsCodeSent
    },
    cleanMobilePhone() {
      if (this.mobilephone == undefined) return ""
      return this.mobilephone.replace(/[^0-9\+]/g, '')
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
        if (digitNo == 5) {     // when the sixth digit is entered, then immidiately validate the entered sms code.
          this.loginWithSmsCode()
        }
      }
    },

    /** send a ling via email */
    sendMagicLink() {
      apiClient.sendMagicLink(this.email).then(res => {
        this.emailSuccess = true
      }).catch(err => {
        this.emailErrorMsg = "Could not send email."
      })
    },

    /** send login code via SMS */
    sendSmsLoginCode() {
      this.smsCodeSent = true
      this.smsErrorMsg = ''
      this.digits = []
      apiClient.sendSmsLoginCode(this.cleanMobilePhone).then(res => {
        this.smsCodeSent = true
        this.$nextTick(function () {
          $('#digit0').focus()
        })
      }).catch(err => {
        if (err.response.data.liquidoErrorName === "MOBILE_NOT_FOUND") {
          this.smsErrorMsg = "Mobile number not found.<br/>You must register first."
        } else {
          this.smsErrorMsg = "Could not send SMS."
        }
        this.smsCodeSent = false
        log.error(err)
      })
    },

    loginWithSmsCode() {
      var smsCode = this.digits.join("")
      apiClient.loginWithSmsCode(this.cleanMobilePhone, smsCode)
        .then(jwt => {
          this.smsErrorMsg = ""
          this.$root.loginWithJWT(jwt)
        }).catch(err => {
          this.smsErrorMsg = "SMS code not valid."
          this.smsCodeSent = false
          log.error("Error in loginWithSmsCode", err)
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
.magicLinkForm {
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

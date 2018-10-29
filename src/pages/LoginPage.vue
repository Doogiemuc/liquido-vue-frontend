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
                  <input class="form-control" id="phoneInput" placeholder="phone number" name="phone" type="text" v-model="phone">
                </div>
                <p>A login code will be sent your mobile phone via SMS.</p>
                <button type="submit" id="loginCodeButton" @click.prevent="sendSmsLoginCode()" class="btn btn-primary" :disabled="phone.length < 5">Send login code</button>
              </fieldset>
            </form>
            <form class="form-inline" v-if="smsSuccess">
              <div class="form-group">
                <p>Enter the 4-digit code that you have received via SMS:</p>
                <input type="text" class="form-control digit" id="digit0" tabindex="1" v-model="digits[0]" v-on:keypress.prevent="keypressDigit(0, $event)"><b>-</b>
                <input type="text" class="form-control digit" id="digit1" tabindex="2" v-model="digits[1]" v-on:keypress.prevent="keypressDigit(1, $event)"><b>-</b>
                <input type="text" class="form-control digit" id="digit2" tabindex="3" v-model="digits[2]" v-on:keypress.prevent="keypressDigit(2, $event)"><b>-</b>
                <input type="text" class="form-control digit" id="digit3" tabindex="4" v-model="digits[3]" v-on:keypress.prevent="keypressDigit(3, $event)">
              </div>
            </form>
            <div class="alert alert-danger" v-if="smsErrorMsg">
              <button type="button" class="close" aria-label="Close" @click="smsErrorMsg = ''"><span aria-hidden="true">&times;</span></button>
              {{smsErrorMsg}}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row lastRow">
      <div class="col-md-6">
        <div v-if="isDevEnv">
           <button type="submit" id="loginButton" @click="devLogin()" class="btn btn-default">Dev Login '{{devLoginUser}}'</button>
        </div>
      </div>
      <div class="col-md-6 text-right">
        <router-link class="text-center" to="/signup">Signup as new user</router-link>
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
      smsSuccess: false,
      smsErrorMsg: '',
      email: '',
      phone: '',
      rememberMe: false,
      digits: []

    }
  },

  computed: {
    isDevEnv() { return process.env.NODE_ENV === 'development' },
    devLoginUser() { return process.env.devLoginUser },
    smsCode() { return this.digits[0]+this.digits[1]+this.digits[2]+this.digits[3] },
    isEmailValid() {
      return validEMailRe.test(this.email)
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
      apiClient.sendSmsLoginCode(this.email).then(res => {
        this.smsSuccess = true
      }).catch(err => {
        this.smsErrorMsg = "Could not send SMS."
      })
    },

    /*
    doLogin() {
      this.errorMsg = ""
      apiClient.login(this.email, this.password)
        .then(user => {
          this.$root.currentUser = user
          this.$root.currentUserURI = $root.api.getURI(user)    //TODO: move login logic to a more central place, e.g. main.js
          this.$router.push("/")
        })
        .catch(err => {
          log.error("Cannot login", err)
          this.errorMsg = "Login error!"  // show sticky error message instead of just an iziToast popup
          this.password = ""
        })
    },
    */

    devLogin() {
      console.log("development mode fake login for "+process.env.devLoginUser)
      this.email = process.env.devLoginUser
      this.password = process.env.devLoginPass
      this.doLogin()
    }

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

.digit {
  width: 2.5ch;
  height: 36pt;
  font-size: 32pt;
  margin-left: 5px;
  margin-right: 5px;
  text-align: center;
}
</style>

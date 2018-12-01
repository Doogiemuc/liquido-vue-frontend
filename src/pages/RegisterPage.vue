<template>
  <div class="container">

    <p>&nbsp;</p>

    <div class="row">
      <div class="col-sm-2">&nbsp;</div>
      <div class="col-sm-8">

        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Regsiter as a new user</h3>
          </div>
          <div class="panel-body">
            <form accept-charset="UTF-8" role="form" class="form-horizontal">
              <div class="form-group form-group-error">
                <label for="inputEmail3" class="col-sm-2 control-label">Email<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <input class="form-control" id="emailInput" name="email" type="text" v-model.trim="email" @blur="$v.email.$touch()">
                  <p class="form-error-msg" v-bind:class="{'invisible' : !$v.email.$error}">Email is invalid.</p>
                </div>
              </div>
              <div class="form-group form-group-error">
                <label for="fullnameInput" class="col-sm-2 control-label">Name<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <input class="form-control" id="fullnameInput" name="fullname" type="text" v-model.trim="fullname" @blur="$v.fullname.$touch()">
                  <p class="form-error-msg" v-bind:class="{'invisible' : !$v.fullname.$error}">Please enter your full name.</p>
                </div>
              </div>
              <div class="form-group form-group-error">
                <label for="mobilephoneInput" class="col-sm-2 control-label">Mobile phone<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <input class="form-control" id="mobilephoneInput" name="mobilephone" type="text" v-model.trim="mobilephone" @blur="$v.mobilephone.$touch()">
                   <p class="form-error-msg" v-bind:class="{'invisible' : !$v.mobilephone.$error}">Invalid mobile phone number. Enter with country code e.g. +11 234 12345678</p>
                </div>
              </div>
              <div class="form-group">
                <div class="col-sm-offset-2 col-sm-10">
                  <p><small>You do not need a password for Liquido. You will login through your mobile phone. (2-factor-authentication)</small></p>
                  <button type="submit" id="registerButton" @click.prevent="register()" class="btn btn-primary" :disabled="$v.$error">Register</button>
                </div>
              </div>
            </form>

            <div class="alert alert-success" v-if="registerSuccess">
              <p>You have been registerd successfully. You may now login.</p>
            </div>

            <alert-panel ref="alertPanel" title="Error" class="alert-danger errorAlert"></alert-panel>
          </div>
        </div>

      </div>
      <div class="col-sm-2">&nbsp;</div>
    </div>

  </div>
</template>

/**
 * HTML page for registering as a new user
 */
<script>

import apiClient from '../services/LiquidoApiClient'
import AlertPanel from '../components/AlertPanel.vue'
import { validationMixin } from 'vuelidate'                         // https://monterail.github.io/vuelidate/
import { required, minLength, email } from 'vuelidate/lib/validators'

import loglevel from 'loglevel'
var log = loglevel.getLogger('LoginPage.vue');




/* Validating phone numbers is my favorite example for something
 * that is so unbelievably more complex as you could ever imagine!! :-)
 * Have a look at "Google Phone Lib"
 *
 * This RegExp is from https://stackoverflow.com/questions/2113908/what-regular-expression-will-match-valid-international-phone-numbers
 *
 */
var mobilephoneRegEx = new RegExp(/^(\+|00)(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1) ?\d[\d\- ]{0,14}\d$/)
const validMobilephone = function(mobilephone) {
  return mobilephoneRegEx.test(mobilephone)
}
var validEMailRegEx = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export default {
  data () {
    return {
      email: '',
      fullname: '',
      mobilephone: '',
      registerSuccess: false
    }
  },

  mixins: [validationMixin],
  validations: {
    email: {
      required, email
    },
    fullname: {
      required, minLength: minLength(3)
    },
    mobilephone: {
      required, validMobilephone
    }
  },

  watch: {
    // only allow numbers + - and space for mobilephone
    mobilephone: function(newVal) {
      var invalidChars = /[^\+\-\d ]/
      this.$set(this, 'mobilephone', newVal.replace(invalidChars, ''))
    }
  },

  components: {
    'alert-panel' : AlertPanel
  },

  computed: {
    isDevEnv() { return process.env.NODE_ENV === 'development' },
    isEmailValid() {
      return validEMailRegEx.test(this.email)
    }
  },

  methods: {

    register() {
      var newUser = {
        email: this.email,
        profile: {
          name: this.fullname,
          //website: this.website,
          //picture: this.pictureURL,
          mobilephone: this.mobilephone,
        }
      }
      apiClient.register(newUser).then(res => {
        this.registerSuccess = true
        this.$refs.alertPanel.closeAlert()
      }).catch(err => {
        var errorMessage = "Could not register."
        var errorDetails = JSON.stringify(err)
        this.$refs.alertPanel.showAlert(errorMessage, errorDetails)
      })
    },

  },


}
</script>

<style scoped>
  .required {
    color:red;
  }
  .form-group-error {
    animation-name: shakeError;
    animation-fill-mode: forward;
    animation-duration: .6s;
    animation-timing-function: ease-in-out;
  }
  .form-error-msg {
    font-size: 90%;
    color: #a94442;
    margin-left: 10px;
  }
</style>

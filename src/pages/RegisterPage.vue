<template>
  <div class="container" id="RegisterPage">

    <p>&nbsp;</p>

    <div class="row">
      <div class="col-sm-2">&nbsp;</div>
      <div class="col-sm-8">

        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Regsiter as a new user</h3>
          </div>
          <div class="panel-body">
            <form accept-charset="UTF-8" role="form" class="form-horizontal" id="registerForm">
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
                <label for="avatar" class="col-sm-2 control-label">Avatar<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <img v-for="i in 16" class="chooseAvatar"
                    :src="getAvatarPath(i)"
                    :class="{ opaqueImg: !isSelectedAvatar(i), selectedAvatar: isSelectedAvatar(i) }"
                    @click="chooseAvatar(i)" />
                </div>
              </div>
              <div class="form-group">
                <label for="websiteInput" class="col-sm-2 control-label">Website</label>
                <div class="col-sm-10">
                  <input class="form-control" id="websiteInput" name="website" type="text" v-model.trim="website" @blur="$v.website.$touch()">
                </div>
              </div>
              <div class="form-group">
                <div class="col-sm-offset-2 col-sm-10">
                  <p><button v-if="!registerSuccess" type="submit" id="RegisterButton" @click.prevent="register()" class="btn btn-primary" :disabled="disableRegisterButton ">Register</button></p>
                  <p v-if="!registerSuccess"><small>You do not need a password for Liquido. You will login through your mobile phone. (2-factor-authentication)</small></p>
                  <div v-if="registerSuccess" id="registerSuccess" class="alert alert-success">
                    <p>You have been registerd successfully. You may now login via email or SMS.</p>
                  </div>
                  <router-link v-if="registerSuccess" :to="{ name: 'login', params: { initEmail: email, initMobilePhone: mobilephone }}" role="button" class="btn btn-default">Login &raquo;</router-link>
                </div>
              </div>
            </form>

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
      website: '',
      pictureURL: '',
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
    },
    website: {  }
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
    isEmailValid() {
      return validEMailRegEx.test(this.email)
    },
    disableRegisterButton() {
      return this.$v.$error || this.$v.$dirty === false || this.registerSuccess
    }
  },

  mounted() {
    var rand = Math.floor(Math.random() * 16) + 1;   //randomly select an avatar
    this.chooseAvatar(rand)
  },

  methods: {
    register() {
      var newUser = {
        email: this.email,
        profile: {
          name: this.fullname,
          website: this.website,
          picture: this.pictureURL,
          mobilephone: this.mobilephone,
        }
      }
      this.$root.auth.register(newUser).then(res => {
        this.registerSuccess = true
        this.$refs.alertPanel.clearAlert()
      }).catch(err => {
        if (err.response.data.liquidoErrorName === "USER_EXISTS") {
          var errorMessage = "This user already exists. Please go to login."
        } else {
          var errorMessage = "Could not register. Please try again later."
        }
        var errorDetails = JSON.stringify(err)
        this.$refs.alertPanel.showAlert(errorMessage, errorDetails)
      })
    },

    getAvatarPath(i) {
      return '/static/img/avatars/Avatar'+i+'.png'
    },

    isSelectedAvatar(i) {
      return this.pictureURL === this.getAvatarPath(i)
    },

    chooseAvatar(i) {
      this.pictureURL = this.getAvatarPath(i)
    }

  },


}
</script>

<style scoped>
  .chooseAvatar {
    border: 1px solid #FFF;
  }
  .selectedAvatar {
    border: 1px solid #204d74;
  }
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
    margin-bottom: 0;
  }
  .errorAlert {
    margin-bottom: 0;
  }
</style>

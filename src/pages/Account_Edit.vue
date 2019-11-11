<template>
  <div class="container" id="EditAccountPage">

    <p>&nbsp;</p>

    <div class="row">
      <div class="col-sm-2">&nbsp;</div>
      <div class="col-sm-8">

        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Edit your Account</h3>
          </div>
          <div class="panel-body">
            <form accept-charset="UTF-8" role="form" class="form-horizontal" id="registerForm">
              <div class="form-group form-group-error">
                <label for="inputEmail3" class="col-sm-2 control-label">Email</label>
                <div class="col-sm-10">
				  <p class="form-control-static">{{email}}</p>
                </div>
              </div>
              <div class="form-group form-group-error">
                <label for="fullnameInput" class="col-sm-2 control-label">Name<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <input class="form-control" id="fullnameInput" name="fullname" type="text" v-model.trim="fullname" @keypress="$v.fullname.$touch()">
                  <p class="form-error-msg" v-bind:class="{'invisible' : !$v.fullname.$error}">Please enter your full name.</p>
                </div>
              </div>
              <div class="form-group form-group-error">
                <label for="mobilephoneInput" class="col-sm-2 control-label">Mobile phone<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <input class="form-control" id="mobilephoneInput" name="mobilephone" type="text" v-model.trim="mobilephone" @keypress="$v.mobilephone.$touch()">
                   <p class="form-error-msg" v-bind:class="{'invisible' : !$v.mobilephone.$error}">Invalid mobile phone number. Enter with country code e.g. +11 234 12345678</p>
                </div>
              </div>
              <div class="form-group">
                <label for="avatar" class="col-sm-2 control-label">Avatar<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <img v-for="i in 16" :key="i" class="chooseAvatar"
                    :src="getAvatarPath(i)"
                    :class="{ opaqueImg: !isSelectedAvatar(i), selectedAvatar: isSelectedAvatar(i) }"
                    @click="chooseAvatar(i)" />
                </div>
              </div>
              <div class="form-group">
                <label for="websiteInput" class="col-sm-2 control-label">Website</label>
                <div class="col-sm-10">
                  <input class="form-control" id="websiteInput" name="website" type="text" v-model.trim="website" @keypress="$v.website.$touch()">
                </div>
              </div>
              <div class="form-group">
                <div class="col-sm-offset-2 col-sm-10">
                  <p><button type="submit" id="SaveAccountButton" @click.prevent="saveAccount()" class="btn btn-primary" :disabled="disableSaveButton">Save</button></p>
                  <p><small>You do not need a password for Liquido. You will login through your mobile phone. (2-factor-authentication)</small></p>
                  <div v-if="saveSuccess" id="saveSuccessAlert" class="alert alert-success">
                    <p>Your account has been saved.</p>
                  </div>
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
 * HTML page for editing user account data
 */
<script>

import AlertPanel from '../components/AlertPanel.vue'
import { validationMixin } from 'vuelidate'                         // https://vuelidate.netlify.com
import { required, minLength, email } from 'vuelidate/lib/validators'

import loglevel from 'loglevel'
var log = loglevel.getLogger('LoginPage.vue');

var mobilephoneRegEx = new RegExp(/^(\+|00)(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1) ?\d[\d\- ]{0,14}\d$/)
const validMobilephone = function(mobilephone) {
  return mobilephoneRegEx.test(mobilephone)
}
var validEMailRegEx = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export default {
  data () {
    return {
      email: this.$root.currentUser.email,
      fullname: this.$root.currentUser.profile.name,
      mobilephone: this.$root.currentUser.profile.mobilephone,
      website: this.$root.currentUser.profile.website,
      picture: this.$root.currentUser.profile.picture,
      saveSuccess: false
    }
  },

  mixins: [validationMixin],
  validations: {
    fullname: {
      required, minLength: minLength(3)
    },
    mobilephone: {
      required, validMobilephone
	},
	website: {},
	picture: {}
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
    disableSaveButton() {
      return this.$v.$anyError || this.$v.$anyDirty === false
    }
  },

  methods: {
    saveAccount() {
	  var updatedUser = this.$root.currentUser
	  updatedUser.profile.name = this.fullname
	  updatedUser.profile.website = this.website
	  updatedUser.profile.picture = this.picture
	  updatedUser.profile.mobilephone = this.mobilephone
	  
      this.$root.api.saveUser(updatedUser).then(res => {
        this.saveSuccess = true
        this.$refs.alertPanel.clearAlert()
      }).catch(err => {
        this.$refs.alertPanel.showAlert("Could not save user data.", JSON.stringify(err))
      })
    },

    getAvatarPath(i) {
      return '/static/img/avatars/Avatar'+i+'.png'
    },

    isSelectedAvatar(i) {
      return this.picture === this.getAvatarPath(i)
    },

    chooseAvatar(i) {
	  this.picture = this.getAvatarPath(i)
	  this.$v.picture.$touch()
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

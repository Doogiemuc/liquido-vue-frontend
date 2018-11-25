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
              <div class="form-group">
                <label for="inputEmail3" class="col-sm-2 control-label">Email<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <input class="form-control" id="emailInput" name="email" type="text" v-model="email">
                </div>
              </div>
              <div class="form-group">
                <label for="fullnameInput" class="col-sm-2 control-label">Name</label>
                <div class="col-sm-10">
                  <input class="form-control" id="fullnameInput" name="fullname" type="text" v-model="fullname">
                </div>
              </div>
              <div class="form-group">
                <label for="mobilephoneInput" class="col-sm-2 control-label">Mobile phone<sup class="required">*</sup></label>
                <div class="col-sm-10">
                  <input class="form-control" id="mobilephoneInput" name="fullname" type="text" v-model="mobilephone">
                </div>
              </div>
              <div class="form-group">
                <div class="col-sm-offset-2 col-sm-10">
                  <button type="submit" id="registerButton" @click.prevent="register()" class="btn btn-primary":disabled="!isEmailValid">Register</button>
                </div>
              </div>
            </form>

            <div class="alert alert-success" v-if="registerSuccess">
              <p>You have been registerd successfully.</p>
            </div>
            <div class="alert alert-danger" v-if="registerErrorMsg">
              <button type="button" class="close" aria-label="Close" @click="registerErrorMsg = ''"><span aria-hidden="true">&times;</span></button>
              {{registerErrorMsg}}
            </div>
          </div>
        </div>

      </div>
      <div class="col-sm-2">&nbsp;</div>
    </div>

  </div>
</template>

/**
 * HTML page for registering a new user
 */
<script>

import apiClient from '../services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('LoginPage.vue');

var validEMailRe = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export default {
  data () {
    return {
      email: '',
      fullname: '',
      mobilephone: '',
      registerSuccess: false,
      registerErrorMsg: '',
    }
  },

  computed: {
    isDevEnv() { return process.env.NODE_ENV === 'development' },
    isEmailValid() {
      return validEMailRe.test(this.email)
    }
  },

  methods: {

    register() {
      var newUser = {
        username: this.email,
        profile: {
          name: this.fullname,
          mobilephone: this.mobilephone,
        }
      }
      apiClient.register(newUser).then(res => {
        this.registerSuccess = true
      }).catch(err => {
        this.registerErrorMsg = "Could not register."
      })
    },

  },


}
</script>

<style scoped>
.required {
  color:red;
}
</style>

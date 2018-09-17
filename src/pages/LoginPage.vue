<template>
  <div class="container">
    <div class="row">
      <div class="col-md-4"></div>
      <div class="col-md-4">
        <p>&nbsp;</p>
        <div class="alert alert-danger" v-if="errorMsg">
          {{errorMsg}}
        </div>

        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Please sign in</h3>
          </div>
          <div class="panel-body">
            <form accept-charset="UTF-8" role="form">
              <fieldset>
                <div class="form-group">
                  <input class="form-control" id="emailInput" placeholder="E-mail" name="email" type="text" v-model="email">
                </div>
                <div class="form-group">
                  <input class="form-control" id="passwordInput" placeholder="Password" name="password" type="password" value="" v-model="password">
                </div>
                <div class="checkbox">
                  <label>
                    <input name="remember" type="checkbox" value="Remember Me" v-model="rememberMe">Remember Me
                  </label>
                </div>
                <div class="text-center">
                  <button type="submit" id="loginButton" @click.prevent="doLogin()" class="btn btn-primary">Login</button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>

        <p>&nbsp;</p>
        <small>
          <router-link class="text-center" to="/forgotPassword">Forgot password?</router-link><br/>
          <router-link class="text-center" to="/signup">Signup as new user</router-link>
        </small>

        <div v-if="isDevEnv">
          <p>&nbsp;</p><p>&nbsp;</p>
           <button type="submit" id="loginButton" @click="devLogin()" class="btn btn-default">Dev Login '{{devLoginUser}}'</button>
        </div>
      </div>
      <div class="col-md-4"></div>
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

export default {
  data () {
    return {
      errorMsg: '',
      email: '',
      password: '',
      rememberMe: false,
    }
  },

  computed: {
    isDevEnv() { return process.env.NODE_ENV === 'development' },
    devLoginUser() { return process.env.devLoginUser }
  },

  methods: {
    doLogin: function() {
      this.errorMsg = ""
      apiClient.login(this.email, this.password)
        .then(user => {
          this.$root.currentUser = user
          this.$router.push("/")
        })
        .catch(err => {
          log.error("Cannot login", err)
          this.errorMsg = "Login error!"
          this.password = ""
        })
    },

    devLogin() {
      console.log("development mode fake login for "+process.env.devLoginUser)
      this.email = process.env.devLoginUser
      this.password = process.env.devLoginPass
      this.doLogin()
    }

  },


}
</script>

<style>

</style>

<template>
  <div class="container">
    <h1>Liquido User Login</h1>

    <div class="alert alert-danger" v-if="errorMsg">
        {{errorMsg}}
    </div>

    <form role="form">
      <div class="form-group">
          <label for="username">Email:</label> <input type="text"
              class="form-control" id="email" name="email" v-model="email">
      </div>
      <div class="form-group">
          <label for="password">Password:</label> <input type="password"
              class="form-control" id="password" name="password" v-model="password"/>
      </div>
      <button type="submit" @click.prevent="doLogin()" class="btn btn-primary">Submit</button>
    </form>
  </div>
</template>

/**
 * HTML page where the user can login
 */
<script>

import loglevel from 'loglevel'
var log = loglevel.getLogger('LoginPage.vue');

export default {
  data () {
    return {
      errorMsg: '',
      email: '',
      password: ''
    }
  },

  methods: {
    doLogin: function() {
      log.debug("doLogin(", this.email, this.password)
    },

  },
 

}
</script>

<style>

</style>

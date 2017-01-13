<template>
  
  <div class="alert alert-danger" v-if="error.msg">
      There was a problem logging in. Please try again.
  </div>

  <form role="form">
    <div class="form-group">
        <label for="username">Username:</label> <input type="text"
            class="form-control" id="username" name="username" ng-model="controller.credentials.username"/>
    </div>
    <div class="form-group">
        <label for="password">Password:</label> <input type="password"
            class="form-control" id="password" name="password" ng-model="controller.credentials.password"/>
    </div>
    <button type="submit" class="btn btn-primary">Submit</button>
  </form>

</template>

/**
 * HTML page where the user can login
 */
<script>

export default {
  data () {
    return {
      
    }
  },

  methods: {
    doLogin: function(username, password) {
      
    },

  },
 

}
</script>

<style>
/*=== 3. Text Outside the Box ===*/
.etc-login-form {
  color: #919191;
  padding: 10px 20px;
}
</style>

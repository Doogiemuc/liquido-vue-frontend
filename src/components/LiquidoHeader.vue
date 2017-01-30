<template>

<div class="navbar navbar-default navbar-fixed-top">
  <div class="container">
    <div class="navbar-header">
      <button type="button" data-toggle="collapse" data-target=".navbar-collapse" class="navbar-toggle">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <router-link to="/" class="navbar-brand"><i class="fa fa-university"></i> Liquido</router-link>
    </div>
    <div class="collapse navbar-collapse">
      <ul class="nav navbar-nav">
        <li><router-link to="/userHome">UserHome</router-link></li>
        <li><router-link to="/areas">Areas</router-link></li>
        <li><router-link to="/ideas">Ideas</router-link></li>
        <li><router-link to="/createNewIdea">Add Idea</router-link></li>
        <li><router-link to="/laws">Laws</router-link></li>
      </ul>

      <ul class="nav navbar-nav navbar-right" v-if="currentUser">
        <li class="dropdown">
          <a href="#" data-toggle="dropdown" class="dropdown-toggle">
            <img v-bind:src="currentUser.profile.picture" alt="Avatar Image">
            {{currentUser.profile.name}}<i class="caret"></i>
          </a>
          <ul class="dropdown-menu">
            <li><router-link to="/proxies">My Proxies</router-link></li>
            <li><router-link to="/account">My Account</router-link></li>
            <li class="divider"></li>
            <li><router-link to="/logout'">Logout</router-link></li>
          </ul>
        </li>
      </ul>
      <ul class="nav navbar-nav navbar-right" v-else="currentUser">
        <li><router-link to="/login">Login</router-link></li>
        <li><router-link to="/signup">Create Account</router-link></li>
      </ul>
    </div>
  </div>
</div>

</template>

<script>
export default {
  props : ['currentUser'],
  
  mounted () {
    console.log("Current User in LiquidoHeader.vue = ", this.$root.currentUser)
    console.log("$root = ", this.$root)
  }
  
}
</script>

<style>
  .navbar-nav img {
    width: 30px;
    height: 30px;
    margin: -15px 15px -15px;
  }
</style>

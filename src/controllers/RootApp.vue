<template>
  <div>
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
          <ul class="nav navbar-nav nav-arrows">
            <li><a href="#">Ideas</a></li>
            <li class="active"><a href="#">Proposals</a></li>
            <li><a href="#">Polls</a></li>
            <li><a href="#">Laws</a></li>
          </ul>

          <ul class="nav navbar-nav navbar-right" v-if="currentUser">
            <button type="button" @click="$router.push('/addIdea')" class="btn btn-default navbar-btn">Add Idea</button>
            <li class="dropdown">
              <a href="#" data-toggle="dropdown" class="dropdown-toggle">
                <img v-bind:src="currentUser.profile.picture" alt="Avatar Image">
                {{currentUser.profile.name}}<i class="caret"></i>
              </a>
              <ul class="dropdown-menu">
                <li><router-link to="/proxies">My Proxies</router-link></li>
                <li><router-link to="/account">My Account</router-link></li>
                <li><router-link to="/messages">Messages</router-link></li>
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
    <router-view></router-view>
  </div>
</template>

<script>
/**
 * RootApp.vue - Vue component at the root of the component tree.
 */
export default {

  //TODO: make RootApp testable on its own: Problem: How to hanlde <router-view> ?

  //TODO: I could load the default user here in  beforeCreate()
}
</script>

<style>
  .navbar-nav img {
    width: 30px;
    height: 30px;
    margin: -15px 15px -15px;
  }
  .navbar-brand {
    font-size: 25px;
  }
  
  /* Arrows for nav links */
  .navbar-nav.nav-arrows {
    margin-left: 25px;
  }
  .navbar-nav.nav-arrows > li {
    margin-right: 30px;
  }
  .navbar-nav.nav-arrows > li > a {
    margin-top: 5px;
    padding-top: 10px;
    padding-bottom: 10px;
    background-color: #e7e7e7;
  }
  .navbar-nav.nav-arrows a:after {
    position: absolute;
    content: "";
    top: 0px;
    right: -20px;
    width: 0px;
    height: 0px;
    border-style: solid;
    border-width: 20px 0 20px 20px;
    border-color: transparent transparent transparent #e7e7e7;
    z-index: 150;
  }
  /* .navbar-nav.nav-arrows > :not(:first-child) a:before { */
  .navbar-nav.nav-arrows a:before {
    position: absolute;
    content: "";
    top: 0px;
    left: -20px;
    width: 0px;
    height: 0px;
    border-style: solid;
    border-width: 20px 0 20px 20px;
    border-color: #e7e7e7 #e7e7e7 #e7e7e7 transparent;
    z-index: 150;
  }

  /* Special colors for active link */
  ul.nav.navbar-nav.nav-arrows > .active > a {
    color: #FFF;
    background-color: #337ab7;
  }
  .navbar-nav.nav-arrows > .active a:after {
    border-color: transparent transparent transparent #337ab7;
  }
  .navbar-nav.nav-arrows > .active a:before {
    border-color: #337ab7  #337ab7  #337ab7 transparent ;
  }

  /* highlight on hover */
  ul.nav.navbar-nav.nav-arrows > :not(.active) > a:hover {
    color: #FFF;
    background-color: #e7e7e7;
  }
  /*
  .nav.navbar-nav.navbar-right > li > a {
    background-color: transparent;
  }
  */
</style>

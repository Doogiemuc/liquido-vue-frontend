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
          <ul id="navArrows" class="nav navbar-nav nav-arrows" v-if="currentUser">
            <li><router-link active-class="active" to="/ideas">Ideas</router-link></li>
            <li><router-link active-class="active" to="/proposals">Proposals</router-link></li>
            <li><router-link active-class="active" to="/polls">Polls</router-link></li>
            <li><router-link active-class="active" to="/laws">Laws</router-link></li>
          </ul>
          <ul id="navArrows" class="nav navbar-nav nav-arrows disabled" v-else>
            <li><a href="#">Ideas</a></li>
            <li><a href="#">Proposals</a></li>
            <li><a href="#">Polls</a></li>
            <li><a href="#">Laws</a></li>
          </ul>

          <ul id="userMenu" class="nav navbar-nav navbar-right" v-if="currentUser">
            <button type="button" @click="$router.push('/ideas/add')" class="btn btn-default navbar-btn">Add Idea</button>
            <li class="dropdown">
              <a href="#" data-toggle="dropdown" class="dropdown-toggle">
                <img v-bind:src="currentUser.profile.picture" alt="Avatar Image">
                {{currentUser.profile.name}}<i class="caret"></i>
              </a>
              <ul class="dropdown-menu">
							  <li><router-link to="/userHome">User Home</router-link></li>
                <li><router-link to="/proxies">Proxies</router-link></li>
                <li><router-link to="/account">My Account</router-link></li>
                <li><router-link to="/messages">Messages</router-link></li>
                <li class="divider"></li>
                <li><router-link to="/logout">Logout via URL</router-link></li>
              </ul>
            </li>
          </ul>
          <router-link v-if="!currentUser && $route.path != '/login'" role="button" to="/login" class="btn btn-default navbar-btn navbar-right">Login</router-link>
          <button v-if="showDevLogin" id="devLoginButton" @click="devLogin()" class="btn btn-default navbar-btn navbar-right">Dev Login '{{devLoginUser}}'</button>
          <div></div>
        </div>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
/**
 * RootApp.vue - Vue component at the root of the component tree.
 * Renders the NavBar at the top.
 */

var loglevel = require('loglevel')
var log = loglevel.getLogger("RootApp");
import apiClient from '../services/LiquidoApiClient'

export default {
  computed: {
    showDevLogin() { return process.env.NODE_ENV === 'development' && this.$root.currentUser === undefined },
    devLoginUser() { return process.env.devLoginUser }
  },

  methods: {
    //These methods can be called from all child components as this.$root.method()

    /** When user logged in and we got a JWT, then store it globally and fetch user details */
    login(jwt) {
      log.info("User login")
      apiClient.setJsonWebToken(jwt)
      apiClient.getMyUser()
        .then(user => {
          log.info(user)
          this.$root.currentUser = user
          this.$router.push('/userHome')
          //TODO: show iziToast on success (on users home page!)
        })
        .catch(err => {
          log.error("Cannot find user details with JWT. Invalid JWT?")
          throw new Error("Cannot find user details with JWT. Invalid JWT?")
        })
    },

    /** Logout the current user */
    logout() {
      console.log("LOGOUT ", this.$root.currentUser)
      apiClient.logout()
      this.$root.currentUser = undefined
      //TODO: Show flash message: "You have been successfully logged out."
      this.$router.push("/")
    },

    /** Quickly login a default user for development */
    devLogin() {
      console.log("development mode fake login for "+process.env.devLoginUser)
      apiClient.login(process.env.devLoginUser, process.env.devLoginPass)
        .then(user => {
          console.log("received user" , user)
          this.$root.currentUser = user
          this.$router.push("/")
        })
        .catch(err => {
          log.error("Cannot login", err)
        })
    },
  },

  mounted() {
    // Global configuration of our dismissable alert lib
    iziToast.settings({
      layout: 2,
      timout: 10000,
      animateInside: false,
      position: 'topRight',
      transitionIn: 'fadeInLeft',
    })
  }
}

</script>

<style>
  #devLoginButton {
    margin-right: 15px;
  }

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
    background-color: #ddd;
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
    border-color: transparent transparent transparent #ddd;
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
    border-color: #ddd #ddd #ddd transparent;
    z-index: 150;
  }

  /* Special colors for active link */
  #navArrows a.active {
    color: #FFF;
    background-color: #337ab7;
  }
  #navArrows a.active:after {
    border-color: transparent transparent transparent #337ab7;
  }
  #navArrows a.active:before {
    border-color: #337ab7  #337ab7  #337ab7 transparent ;
  }
  #navArrows a:not(.active) {
    color: #FFF;
    background-color: #ddd;
  }
  /* also highlight on hover */
  #navArrows:not(.disabled) a:hover {
    background-color: #337ab7;
  }
  #navArrows:not(.disabled) a:hover:before {
    border-color: #337ab7  #337ab7  #337ab7 transparent ;
  }
  #navArrows:not(.disabled) a:hover:after {
    border-color: transparent transparent transparent #337ab7;
  }
  /* disabled arrows when not yet logged in */
  #navArrows.disabled a {
    cursor: default;
  }


</style>

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
            <!-- button type="button" @click="$router.push('/ideas/add')" class="btn btn-default navbar-btn">
              <i class="fas fa-plus"></i>
            </button -->
            <li class="dropdown">
              <a href="#" data-toggle="dropdown" class="dropdown-toggle userDropdown">
                {{userNameShort}}<i class="caret"></i>
                <img v-bind:src="currentUser.profile.picture" class="avatarImg">
              </a>
              <ul class="dropdown-menu">
							  <li><router-link to="/userHome">User Home</router-link></li>
                <li><router-link to="/proxies">Proxies</router-link></li>
                <li><router-link to="/account">My Account</router-link></li>
                <li><router-link to="/ideas/add">Add new Idea</router-link></li>
                <!-- li><router-link to="/messages">Messages</router-link></li -->
                <li class="divider"></li>
                <li><router-link to="/logout">Logout via URL</router-link></li>
              </ul>

            </li>
          </ul>

          <router-link v-if="!currentUser && $route.path != '/login'" role="button" to="/login" class="btn btn-default navbar-btn navbar-right">Login</router-link>

          <div v-if="showDevLogin" id="devLoginButton" class="btn-group navbar-btn navbar-right">
            <!-- Development login -->
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              DevLogin <span class="caret"></span>
            </button>
            <ul class="dropdown-menu">
              <li><a href="#" @click="devLogin(0)">User 1</a></li>
              <li><a href="#" @click="devLogin(1)">User 2</a></li>
              <li><a href="#" @click="devLogin(2)">User 3</a></li>
              <li><a href="#" @click="devLogin(3)">User 4</a></li>
              <li><a href="#" @click="devLogin(4)">User 5</a></li>
              <li><a href="#" @click="devLogin(5)">User 6</a></li>
              <li><a href="#" @click="devLogin(6)">User 7</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <router-view></router-view>

    <footer>
      <div class="container text-right">
        <small>{{liqudioVersion}}</small>&nbsp;
        <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/" style="color:grey">
          <img alt="Creative Commons License" class="opaqueImg" style="border-width:0" src="/static/img/licensebutton-80x15.png">
        </a>
        <br/>
      </div>
    </footer>
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
    liqudioVersion() { return this.$root.props['liquido.version'] },
    showDevLogin() { return process.env.NODE_ENV === 'development' && this.$root.currentUser === undefined },
    userNameShort() {
      if (!this.currentUser) return ""
      if (this.currentUser.profile.name.length <= 15) return this.currentUser.profile.name;
      return this.currentUser.profile.name.substr(0,15)+"&hellip;"
    }
  },

  //The methods of RootApp.vue can be called from all child components as this.$root.method()
  methods: {

    /** Quickly login a default user for development */
    loginViaSms(mobilephone, smsCode) {
      var cleanMobilePhone = this.cleanMobilePhone(mobilephone)
      log.info("Login via SMS for "+cleanMobilePhone)
      return apiClient.loginWithSmsCode(cleanMobilePhone, smsCode)
        .then(jwt =>  { this.loginWithJWT(jwt) })
        .catch(err => { log.error("Cannot login dev user", err) })
    },

    /** When user logged in and we got a JWT, then store it globally and fetch user details */
    loginWithJWT(jwt, forwardTo) {
      log.info("User login")
      apiClient.setJsonWebToken(jwt)
      return apiClient.getMyUser()
        .then(user => {
          log.info(user)
          this.$root.currentUser = user
          this.$router.push(forwardTo ? forwardTo : '/userHome')
          iziToast.success({
            title: 'Login',
            message: 'You are now logged in as '+user.email,
            //position: 'bottomRight',
          });
        })
        .catch(err => {
          log.error("Cannot find user details with JWT. Invalid JWT?")
          return Promise.reject("Cannot find user details with JWT. Invalid JWT?")
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

    /** Quick login for development */
    devLogin(userNo) {
      this.loginViaSms(process.env.devLoginMobilePhones[userNo], process.env.devLoginDummySmsCode)
    },


    cleanMobilePhone(mobilephone) {
      if (mobilephone == undefined) return ""
      return mobilephone.replace(/[^0-9\+]/g, '')
    }
  },

  created() {
    // Global configuration of our dismissable alert lib
    iziToast.settings({
      layout: 2,
      timout: 10000,
      animateInside: false,
      position: 'topRight',
      transitionIn: 'fadeInLeft',
    })

    /*
    if (process.env.autoLoginMobilePhone) {
      log.info("Automatic DEV login for "+process.env.autoLoginMobilePhone)
      this.loginViaSms(process.env.autoLoginMobilePhone, process.env.autoLoginSmsCode)
    }
    */
  }
}

</script>

<style scoped>
  .navbar-brand {
    font-size: 25px;
  }

  .userDropdown {
    padding-top: 10px;
    padding-bottom: 0px;
  }

  .avatarImg {
    width: 32px;
    height: 32px;
  }

  .userNameEllipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    -o-text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
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

  footer {
    margin-top: 15px;
    background-color: #f8f8f8;
    border-top: 1px solid #e7e7e7;
    padding-top: 5px;
    padding-bottom: 20px;
  }
  footer a {
    font-size: 12px;
    color: gray;
  }
  footer a:hover {
    color: blue;
  }

</style>

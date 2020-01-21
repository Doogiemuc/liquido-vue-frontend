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
          <ul v-if="currentUser" id="navArrows" class="nav navbar-nav nav-arrows" >
            <li><router-link active-class="active" to="/ideas" id="IdeasArrow">Ideas</router-link></li>
            <li><router-link active-class="active" to="/proposals" id="ProposalsArrow">Proposals</router-link></li>
            <li><router-link active-class="active" to="/polls" id="PollsArrow">Polls</router-link></li>
            <li><router-link active-class="active" to="/laws" id="LawsArrow">Laws</router-link></li>
          </ul>
          <ul v-if="currentUser" class="nav navbar-nav nav-search-icon">
            <li>
              <router-link v-if="currentUser" id="SearchButton" active-class="active" title="Search" to="/search">
                <i class="fas fa-search"></i>
              </router-link>
            </li>
          </ul>
          <ul v-else id="navArrows" class="nav navbar-nav nav-arrows disabled" >
            <li><a href="#">Ideas</a></li>
            <li><a href="#">Proposals</a></li>
            <li><a href="#">Polls</a></li>
            <li><a href="#">Laws</a></li>
          </ul>

          <ul id="userMenu" class="nav navbar-nav navbar-right" v-if="currentUser">
            <!-- button type="button" @click="$router.push('/ideas/add')" class="btn btn-default navbar-btn">
              <i class="fas fa-plus"></i>
            </button -->
            <li>
              <router-link to="/userHome" class="avatarImgLink">
                <img v-bind:src="currentUser.profile.picture" class="avatarImg">
              </router-link>
            </li>
            <li class="dropdown userDropdown">
              <a href="#" data-toggle="dropdown" class="dropdown-toggle">
                <span v-html="userNameShort"></span><i class="caret"></i>
              </a>
              <ul class="dropdown-menu">
                <li><router-link to="/userHome">User Home</router-link></li>
                <li><router-link to="/proxies">Proxy Delegations</router-link></li>
                <li><router-link to="/account">My Account</router-link></li>
                <li><router-link id="addIdeaMenuItem" to="/ideas/add">Add new Idea</router-link></li>
                <!-- li><router-link to="/messages">Messages</router-link></li -->
                <li class="divider"></li>
                <li><router-link to="/logout">Logout</router-link></li>
              </ul>
            </li>
          </ul>

          <router-link v-if="!currentUser && $route.path != '/login'" role="button" to="/login" id="NavLoginButton" class="btn btn-default navbar-btn navbar-right">Login</router-link>

          <div v-if="showDevLogin" class="btn-group navbar-btn navbar-right">
            <!-- Development login -->
            <button type="button" id="DevLoginButton" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              DevLogin <span class="caret"></span>
            </button>
            <ul class="dropdown-menu">
              <li v-for="devUser in devUsers" :key="devUser.email"><a href="#" @click="devLogin(devUser.profile.mobilephone)">{{devUser.profile.name}} {{devUser.profile.mobilephone}}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <router-view></router-view>

    <footer>
      <div class="container">
        <div class="pull-right">
          <small>{{liquidoWebAppVersion}}</small><small v-if="nodeEnv !== 'production'"> env={{nodeEnv}} -> {{liquidoBackendInfo}}</small>&nbsp;
          <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/" style="color:grey">
            <img alt="Creative Commons License" class="opaqueImg" style="border-width:0" src="/static/img/licensebutton-80x15.png">
          </a>
        </div>
        <div>
          <a class="documentation-link" href="http://doc.liquido.vote" target="_blank"><i class="fas fa-question-circle"></i> LIQUIDO Documentation</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
/**
 * RootApp.vue - Vue component at the root of the component tree.
 * Renders the NavBar at the top.
 */

import auth from '../services/auth'
import loglevel from 'loglevel'
var log = loglevel.getLogger("RootApp");

export default {
  /*
    This RootApp's data properties are available to all child components e.g. this.$root.currentUser
    All data properties are injected in mains.js
  */


  computed: {
	liquidoWebAppVersion() { return process.env.liquidoWebAppVersion },
    liquidoBackendInfo()   { return "backend@"+this.props['liquido.backend.version'] + ' ' + process.env.backendBaseURL },
    nodeEnv()        { return process.env.NODE_ENV },
    currentUser()    { return auth.currentUser },
    showDevLogin()   { return process.env.NODE_ENV === 'development' && this.currentUser === undefined },
    userNameShort() {
      if (!this.currentUser) return ""
      if (this.currentUser.profile.name.length <= 15) return this.currentUser.profile.name;
      return this.currentUser.profile.name.substr(0,15)+"&hellip;"
    }
  },

  methods: {

	  // Also these methods are available to all components as this.$root.someMethod()

	  devLogin(mobilephone) {
		  auth.devLogin(mobilephone, process.env.devLoginToken)
	  }

  },

  created() {

  },

}

</script>

<style scoped>
	/*TODO: Navigation menu on mobile */


  .navbar-brand {
    font-size: 25px;
  }

	@media (max-width: 991px) {
		#navArrows>li>a {
			  /* Reduce padding for iPad */
				padding-left: 10px;
				padding-right: 10px;
		}
	}

  .userDropdown {
		color: white;
    background: #ddd;
		/*height: 32px;*/
		margin: 10px 10px 0 0;
    padding: 0;
  }

	.userDropdown:hover {
		color: white;
    background-color: #337ab7;
    border-color: #2e6da4;
	}

	.userDropdown>a.dropdown-toggle {
		margin: 0;
		padding: 6px 8px 0 8px;
		height: 32px;
	}


  .avatarImgLink {
    padding: 10px 0 0 0;
    margin: 0 10px 0 0;
  }

  .avatarImg {
    width: 32px;
    height: 32px;
  }

  .avatarImg:hover {
    opacity: 0.8;
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

  .nav-search-icon {
    font-size: 20px;
  }

  footer {
    margin-top: 30px;
		height: 50px;
    background-color: #f8f8f8;
    border-top: 1px solid #e7e7e7;
    padding-top: 5px;
    padding-bottom: 20px;
    color: gray;
  }
  footer a {
    font-size: 12px;
  }
  footer .documentation-link {
    font-size: 14px;
  }
  footer a:hover {
    color: blue;
  }

</style>

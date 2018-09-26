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
          <ul class="nav navbar-nav nav-arrows" v-if="currentUser">
            <li><router-link active-class="active" to="/ideas">Ideas</router-link></li>
            <li><router-link active-class="active" to="/proposals">Proposals</router-link></li>
            <li><router-link active-class="active" to="/polls">Polls</router-link></li>
            <li><router-link active-class="active" to="/laws">Laws</router-link></li>
          </ul>
          <ul class="nav navbar-nav nav-arrows" v-else>
            <li><a href="#">Ideas</a></li>
            <li><a href="#">Proposals</a></li>
            <li><a href="#">Polls</a></li>
            <li><a href="#">Laws</a></li>
          </ul>

          <ul id="userMenu" class="nav navbar-nav navbar-right" v-if="currentUser">
            <button type="button" @click="$router.push('/addIdea')" class="btn btn-default navbar-btn">Add Idea</button>
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

import apiClient from '../services/LiquidoApiClient'

export default {
  //TODO: make RootApp testable on its own: Problem: How to hanlde <router-view> ?

  methods: {
    //MAYBE: these methods could be called from all components as this.$root.method()
  }
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
  ul.nav.navbar-nav.nav-arrows a.active {
    color: #FFF;
    background-color: #337ab7;
  }
  .navbar-nav.nav-arrows a.active:after {
    border-color: transparent transparent transparent #337ab7;
  }
  .navbar-nav.nav-arrows a.active:before {
    border-color: #337ab7  #337ab7  #337ab7 transparent ;
  }

  /* non active arrows */
  ul.nav.navbar-nav.nav-arrows a:not(.active) {
    color: #FFF;
    background-color: #ddd;
  }
  /*
  .nav.navbar-nav.navbar-right > li > a {
    background-color: transparent;
  }
  */
</style>

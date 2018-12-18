<template>
  <div class="container">
    <h1>Liquid Democracy Proxy Voting</h1>
    <p>In Liquid Democracy voters can delegate their vote to a proxy. Maybe you now someone who is an expert in an area and trust him
      to vote better for you. Other voters might want to delegate their right to vote to you, so that you may vote for them as a proxy.
      When you accept these delegations, then your ballot will not count just once, but also for each of your delegees.</p>
    <p>It is always possible to vote for yourself, no matter if you have a proxy or not. Even when your proxy has already voted for you in a poll,
    you can still override his ballot and vote for youself as long as that poll is still in its voting phase. And a delegation to a proxy can be revoked at any time.</p>

    <h3>Your proxies</h3>
    <table id="proxyTable" class="table table-bordered">
      <thead><tr><th>Category</th><th>Your direct Proxy</th>
        <th>Top Proxy <span class="grey" data-toggle="popover" data-placement="top" data-trigger="hover"
          data-content="This is the top most proxy at the end of your delegation chain. This person will actually vote for you.">
            <i class="fas fa-info-circle"></i>
          </span>
        </th>
      </tr></thead>
      <tbody>
        <tr v-for="category in categories">
          <td>{{category.title}} - {{category.description}}</h3></td>
          <td v-if="proxyMap[category.title]">
            <span v-html="getDirectProxyInCategory(category)"></span>
            <router-link :to="{ path: 'editProxy', query: { categoryId: category.id }}">
              <span class="glyphicon glyphicon-edit text-primary pull-right" aria-hidden="true"></span>
            </router-link>
          </td>
          <td v-else>
            <router-link :to="{ path: 'editProxy', query: { categoryId: category.id }}">
              <span class="glyphicon glyphicon-edit text-primary pull-right" aria-hidden="true"></span>
            </router-link>
          </td>
          <td v-if="proxyMap[category.title]">
            <span v-html="getTopProxyInCategory(category)"></span>
          </td>
          <td v-else>
            &nbsp;
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

/**
 * On the proxy page a voter can add and remove his proxies
 * in each category.
 */

<script>

import apiClient from '../services/LiquidoApiClient'

export default {
  data () {
    return {
      categories: [],
      proxyMap: {}
    }
  },

  methods: {
    getAllCategories() {
      return this.$root.api.getAllCategories()
    },

    getVoterTokens(areas) {
      var requests = areas.map(area => {
        return this.$root.api.getVoterToken(area.id, process.env.tokenSecret, false)
      })
      return Promise.all(requests)
    },

    getDirectProxyInCategory: function(category) {
      //var categoryId = this.$root.api.getId(category)
      var proxy = this.proxyMap[category.title].directProxy
      if (!proxy) return "---"
      return '<img src="' + proxy.profile.picture + '">&nbsp;' +
        proxy.profile.name + ' <' + proxy.email + '>'
    },
    getTopProxyInCategory: function(category) {
      //var categoryId = this.$root.api.getId(category)
      var proxy = this.proxyMap[category.title].topProxy
      if (!proxy) return "---"
      return '<img src="' + proxy.profile.picture + '">&nbsp;' +
        proxy.profile.name + ' <' + proxy.email + '>'
    },

  },

  created () {
    this.getAllCategories()
      .then(this.getVoterTokens)
      .then(result => {
        console.log(result)
      })


      /*
      categories.forEach(category => {
        getVoterTokenInArea(category).then(voterToken => {
          this.$root.api.getMyProxyInfo(category.id, voterToken).then(proxyInfo => { this.proxyMap[category.id] = proxyInfo })
        })
      })
    })
    */
    $('[data-toggle="popover"]').popover()
  }

}
</script>

<style>
  #proxyTable td {
    vertical-align: middle;
  }
</style>

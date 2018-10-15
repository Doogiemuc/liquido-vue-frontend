<template>
  <div class="container">
    <h1>Your Proxies</h1>
    <hr>
    <p>Here you can delegate your vote to someone you trust, for example an expert in an area you know.
       This proxy will then vote on your behalf in that area. You may revoke this delegation
       at any time and vote for yourself. Click the blue edit button on the right to add or remove the
       proxy in that area.</p>
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

  mounted () {
    this.$root.api.getAllCategories().then(categories => { this.categories = categories })
    this.$root.api.getProxyMap(this.$root.currentUser).then(proxyMap => { this.proxyMap = proxyMap })
    $('[data-toggle="popover"]').popover()
  }

}
</script>

<style>
  #proxyTable td {
    vertical-align: middle;
  }
</style>

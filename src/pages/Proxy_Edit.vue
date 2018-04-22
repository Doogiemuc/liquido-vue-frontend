<template src="../views/proxyEdit.html"></template>

/**
 * ProxyEdit.vue - set or remove a proxy in one given category.
 */

<script>

import _ from 'lodash'
import DoogieTable from '../components/DoogieTable'
import loglevel from 'loglevel'

var log = loglevel.getLogger('ProxyEdit.vue');

export default {
  data () {
    return {
      category: { title: '' },      // the category of the proxy that is currently beeing edited, will be loaded in ready()
      proxy: null,                  // user information of currently set proxy in this category (if any)
      selectedProxy: null,          // currently selected row in the table
      // list of available users that could be assigned as proxies
      userList: [],
      usersColumns: [
        { title: "Avatar", path: "profile.picture", filter: 'userAvatar', rawHTML: true },
        { title: "Name", path: "profile.name" },
        { title: "Email", path: "email" },
      ],
      userKey: "_links.self.href",

    }
  },

  components: {
    DoogieTable
  },

  filters: {
    userAvatar(pic) {                   // filte for table cell
      return '<img src="'+pic+'" />'
    }
  },

  methods: {
    /**
     * Fetch all users that could be assigned as proxy.
     * ie. all users minus the currently logged in user and any already assigned proxy
     * @return (A Promise that will resolve to) a list of users that could be assigned as proxy
     */
    getAssignableProxies: function() {
      return this.$root.api.getAllUsers().then(userList => {
        _.remove(userList, user => {
          return user.email == this.$root.currentUser.email ||
                 (this.proxy != null && user.email == this.proxy.email)
        })
        return userList
      })
    },

    rowSelected: function(row) {
      this.selectedProxy = row
    },

    /** save the currently selected proxy */
    saveProxy: function() {
      log.debug("saveProxy: set '"+this.selectedProxy.email+"' as proxy for '"+this.$root.currentUser.email+"' in category '"+this.category.title+"'")

      this.$root.api.saveProxy(this.category, this.selectedProxy)
      .then(result => {
        log.debug("Successfully saved proxy:", result)
        this.$root.liquidoCache.deleteProxyMap()   // flush the complete proxy map
      })
      .catch(err => {
        log.error("Couldn't save proxy: ", err)
      })
    },

    /** remove the currently set proxy */
    removeProxy: function() {
      log.debug("Removing proxy in category ", this.category)
      this.$root.api.removeProxy(this.category)
      .catch(err => {
        log.error("Couldn't remove proxy: ", err)
      })
    }
  },

  /**
   * Pre load all data for the page:
   *  - category
   *  - assignable proxies
   *  - the proxy map of the currenlty logged in useer
   */
  mounted () {
    //TODO: checkMandatoryQueryParam('categoryId', 'Missing mandatory URL parameter categoryId', /proxies')  // will redirect to proxies page if query param categoryId is not set
    var categoryId = this.$route.query.categoryId
    if (categoryId == undefined || categoryId == null) {
      console.error("ProxyEdit.vue: Missing URL parametere categoryId!")
    }

    this.$refs.proxyTable.loading = true
    this.$refs.proxyTable.localizedTexts.searchFilter = 'Search for name or e-mail'
    this.$refs.proxyTable.setSortCol(this.usersColumns[1])

    // Here we send three parallel requests to our backend. Javascript Promises are cool :-)
    Promise.all([
      this.$root.api.getCategory(categoryId),
      this.getAssignableProxies(),
      this.$root.api.getProxyMap(this.$root.currentUser)
    ])
    .then(results => {
      this.category = results[0]
      this.userList = results[1]
      var proxyMap  = results[2]
      this.proxy    = proxyMap[this.category.title]   // may be null!
      this.$refs.proxyTable.loading = false

    })
    .catch(err => {
      log.error("Couldn't load data for ProxyEdidt.vue: "+err)
    })

  }

}
</script>

<style>
.buttonMarginRight {
  margin-right: 20px;
}
#searchDiv {
  margin-bottom: 12px;
}
#searchDiv input {
  width: 100%;
}

</style>

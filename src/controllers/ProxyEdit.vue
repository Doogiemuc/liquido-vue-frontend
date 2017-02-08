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
      proxy: null,              // user information of currently set proxy in this category (if any)
      // list of available users that could be assigned as proxies
      userList: [],
      usersColumns: [
        { title: "Avatar", path: "profile.picture", filter: 'userAvatar', rawHTML: true },
        { title: "Name", path: "profile.name" },
        { title: "Email", path: "email" },
      ],
      userKey: "_id.$oid",

    }
  },

  components: {
    DoogieTable
  },

  filters: {
    userAvatar(pic) {
      return '<img src="'+pic+'" />'
    }
  },

  computed: {
    //return true if one row in the table is selected (will enable "Set Proxy" button)
    isProxySelected: function() {
      //console.log("isProxySelected "+JSON.stringify(this.$refs.voterTable.selectedRow) )
      return this.$refs.voterTable.selectedRow != null
    }
  },

  methods: {
    /**
     * Fetch all users that could be assigned as proxy.
     * ie. all users minus the currently logged in user and any already assigned proxy
     * @return (A Promise that will resolve to) a list of users that could be assigned as proxy
     */
    getAssignableProxies: function() {
      return this.$root.api.fetchAllUsers().then(userList => {
        _.remove(userList, user => {
          return user == this.$root.currentUser ||
                 user == this.proxy
        })
        return userList
      })
    },

    /** save the currently selected proxy */
    saveProxy: function() {
      var chosenProxy   = this.$refs.voterTable.selectedRow
      var currentUserId = this.$root.api.getId(this.$root.currentUser)
      var categoryId    = this.$root.api.getId(this.category)
      var proxyId       = this.$root.api.getId(chosenProxy)
      log.debug("saveProxy: set '"+chosenProxy.email+"' as proxy for '"+this.$root.currentUser.email+"' in category '"+this.category.title+"'")

      this.$root.api.saveProxy(categoryId, proxyId)
      .then(result => {
        log.debug("Successfully saved proxy:", result)
        this.proxy = chosenProxy
        this.$root.liquidoCache.deleteProxyMap()   // flush the complete proxy map
      })
      .catch(err => {
        log.error("Couldn't save proxy: ", err)
      })
    },

    /** remove the currently set proxy */
    removeProxy: function() {
      log.debug("Removing proxy in category ", this.category)
      delegationService.removeProxy(currentUserId, categoryId)
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
   * from remote source of from caches if possible.
   */
  mounted () {
    log.trace('ProxyEdit.vue: mounted')
    //TODO: checkMandatoryQueryParam('categoryId', 'Missing mandatory URL parameter categoryId', /proxies')  // will redirect to proxies page if query param categoryId is not set
    var categoryId = this.$route.query.categoryId
    if (categoryId == undefined || categoryId == null) {
      console.error("ProxyEdit.vue: Missing URL parametere categoryId!")
    }

    this.$refs.voterTable.loading = true
    this.$refs.voterTable.localizedTexts.searchFilter = 'Search for name or e-mail'
    this.$refs.voterTable.setSortCol(this.usersColumns[1])

    Promise.all([
      this.$root.api.getCategoryById(categoryId),
      this.getAssignableProxies(),
      this.$root.liquidoCache.fetchProxyMap(this.$root.currentUser)
    ])
    .then(results => {
      this.category = results[0]

      this.userList = results[1]

      var proxyMap  = results[2]
      this.proxy    = proxyMap[categoryId]
      this.$refs.voterTable.loading = false

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

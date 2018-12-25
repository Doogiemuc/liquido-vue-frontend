<template>
  <div class="container">
    <h1>Liquid Democracy Proxy Voting</h1>
    <p>In Liquid Democracy voters can delegate their vote to a proxy. Maybe you now someone who is an expert in an area and trust him
      to vote better for you. Other voters might want to delegate their right to vote to you, so that you may vote for them as a proxy.
      When you accept these delegations, then your ballot will not count just once, but also for each of your delegees.</p>
    <p>It is always possible to vote for yourself, no matter if you have a proxy or not. Even when your proxy has already voted for you in a poll,
    you can still override his ballot and vote for youself as long as that poll is still in its voting phase. And a delegation to a proxy can be revoked at any time.</p>

    <div class="row">
      <div class="col-sm-6" v-for="area in categories" :key="area.id">
        <div v-if="proxyInfoMap[area.id]" class="panel panel-default proxyPanel">
          <div class="panel-heading">
            <a class="editIcon pull-right" @click="editProxy(area)"><i class="fas fa-edit" aria-hidden="true"></i></a>
            <h4>{{area.title}} - {{area.description}}</h4>
          </div>
          <div class="panel-body proxyPanelBody">
            <div class="row row-no-gutters">
              <div class="col-md-6 ">
                <div v-if="proxyInfoMap[area.id].directProxyDelegation">
                  <a href="#" @click="editProxy(area)">
                    <img :src="proxyInfoMap[area.id].directProxyDelegation.toProxy.profile.picture" class="avatarImg pull-left"/>
                  </a>
                  <b v-if="proxyInfoMap[area.id].directProxyDelegation.delegationRequest">
                    Requested delegation to
                  </b>
                  <b v-else>
                    Your {{ !proxyInfoMap[area.id].directProxyDelegation.transitive ? "non-transitive" : ""}} proxy
                  </b>
                  <br/>
                  {{proxyInfoMap[area.id].directProxyDelegation.toProxy.profile.name}}<br/>
                  &lt;{{ proxyInfoMap[area.id].directProxyDelegation.toProxy.email }}&gt;
                </div>
                <div v-else>
                  <a href="#" @click="editProxy(area)">
                    <img src="/static/img/placeholder.png" class="avatarImg pull-left placeholderImg"/> Assign a proxy
                  </a>
                </div>
              </div>
              <div class="col-md-6">
                <div v-if="showTopProxy(area)">
                  <img :src="proxyInfoMap[area.id].topProxy.profile.picture" class="avatarImg pull-left"/>
                  <b>Top proxy</b><br/>
                  {{proxyInfoMap[area.id].topProxy.profile.name}}<br/>
                  &lt;{{ proxyInfoMap[area.id].topProxy.email }}&gt;
                </div>
              </div>
            </div>

          </div>
          <div class="panel-footer proxyDataSmall">
            <a href="#" v-if="!proxyInfoMap[area.id].isPublicProxy" class="pull-right" @click="becomePublicProxy(area)">
              <i class="far fa-fw fa-circle" aria-hidden="true"></i>&nbsp;public proxy
            </a>
            <span v-if="proxyInfoMap[area.id].isPublicProxy"  class="pull-right"><i class="far fa-fw fa-check-circle" aria-hidden="true"></i>&nbsp;public proxy</span>
            <i class="fas fa-fw fa-forward" aria-hidden="true"></i>&nbsp;{{proxyInfoMap[area.id].acceptedDelegations.length}}&nbsp;delegations
            <a href="#" v-if="proxyInfoMap[area.id].delegationRequests.length > 0" @click="acceptDelegationRequest(area)">
              &nbsp;({{proxyInfoMap[area.id].delegationRequests.length}}&nbsp;request{{proxyInfoMap[area.id].delegationRequests.length > 1 ? "s" : ""}})
            </a>

          </div>
        </div>
      </div>
    </div>

    <div v-if="status === 'loading'">
      <span><i class="fas fa-2x fa-spinner grey fa-spin"></i> Loading ...</span>
    </div>

  </div>
</template>

/**
 * Show an overview of all proxies in each area
 */
<script>

import apiClient from '../services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('Proxies_Show.vue');


export default {
  data () {
    return {
      status: "loading",
      categories: [],
      voterTokenMap: {},      // voterToken for each area. key is areaURI
      proxyInfoMap: {}        // information about proxies per area.  key is areaURI
    }
  },

  methods: {
    getAllCategories() {
      return this.$root.api.getAllCategories().then(categories => this.categories = categories)
    },

    /**
     * Fetch voter token for this area and cache it.
     * Will immideately return token from cache if already fetched.
     */
    fetchCachedVoterToken(area) {
      if (this.voterTokenMap[area.id]) return Promise.resolve(this.voterTokenMap[area.id])
      return this.$root.api.getVoterToken(area, process.env.tokenSecret, false).then(token => {
        this.voterTokenMap[area.id] = token.voterToken
        return token.voterToken
      })
    },

    /* Super advanced promise chaining. The div panels will appear as they area loded */
    loadProxyInfo(area) {
      log.debug("Loading proxy info for area.id="+area.id)
      return this.$root.api.getMyProxy(area).then(proxyInfo => {
        this.$set(this.proxyInfoMap, area.id, proxyInfo)    // need vues reactive setter so that UI gets updated dynamically.
        //log.debug("DONE: Loaded proxy info for area.id="+area.id)
      })
    },

    getProxy(area) {   // ES6 defenitely needs a null-save dereferencing operator like groovy's  "?."    https://github.com/davidyaha/ecmascript-optionals-proposal
      return  this.proxyInfoMap[area.id] &&
              this.proxyInfoMap[area.id].directProxyDelegation ?
              this.proxyInfoMap[area.id].directProxyDelegation.toProxy :
              undefined
    },

    showTopProxy(area) {
      return this.proxyInfoMap[area.id] &&
             this.proxyInfoMap[area.id].topProxy &&
             this.proxyInfoMap[area.id].directProxyDelegation &&
             this.proxyInfoMap[area.id].directProxyDelegation.toProxy &&
             this.proxyInfoMap[area.id].topProxy.id !== this.proxyInfoMap[area.id].directProxyDelegation.toProxy.id
    },

    becomePublicProxy(area) {
      this.fetchCachedVoterToken(area).then(voterToken => {
        this.$root.api.becomePublicProxy(area, voterToken).then(res => {
          log.info("User is now public proxy in area(id="+area.id+")")
          this.proxyInfoMap[area.id].isPublicProxy = true
          iziToast.success({
            title: 'Success',
            message: "Your are now a public proxy in<br/>"+area.title,
          })
        })
      })

    },

    acceptDelegationRequest(area) {
      this.$root.api.acceptDelegationRequests(area).then(res => {
         this.loadProxyInfo(area)
      })
    },

    editProxy(area) {
      log.debug("Edit proxy in area(id="+area.id+") current proxy:", this.getProxy(area))
      this.$router.push({ name: 'editProxy', params: {
        categoryId: area.id,
        category:   area,
        voterToken: this.voterTokenMap[area.id],
        delegation: this.proxyInfoMap[area.id] ? this.proxyInfoMap[area.id].directProxyDelegation : undefined
      }})
    }


  },

  created () {
    $('[data-toggle="popover"]').popover()
    var start = Date.now()
    // fetch all proxy details for every area
    this.getAllCategories().then(categories => {
      var requests = categories.map(category => {
        return this.loadProxyInfo(category)
      })
      Promise.all(requests).then(res => {
        this.status = "finished"
        var end = Date.now()
        log.debug("Finished loading proxyInfo for ALL areas in "+(end-start)+"ms.")
      })
    })

  }

}
</script>

<style>
  .proxyPanelBody {
    padding: 10px;
    font-size: 12px;
    height: 80px;
  }
  .proxyPanel .panel-heading {
    padding: 5px 15px;
  }
  .proxyPanel:hover .editIcon {
    visibility: visible;
  }
  .editIcon {
    visibility: hidden;
    font-size: 16px;
    vertical-align: middle;
    color: #AAA;
    cursor: pointer;
  }
  .proxyPanel .avatarImg {
    width: 50px;
    height: 50px;
    margin-right: 0.5em;
  }
  .placeholderImg {
    opacity: 0.5;
    filter: alpha(opacity=50); /* For IE8 and earlier */
  }
  .placeholderImg:hover {
    opacity: 1;
    filter: alpha(opacity=100); /* For IE8 and earlier */
  }
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
  }
  .proxyDataSmall {
    color: #999;
    font-size: 12px;
    line-height: 1.4;
    padding-top: 4px;
    padding-bottom: 4px;
  }
</style>

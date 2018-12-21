<template>
  <div class="container">
    <h1>Liquid Democracy Proxy Voting</h1>
    <p>In Liquid Democracy voters can delegate their vote to a proxy. Maybe you now someone who is an expert in an area and trust him
      to vote better for you. Other voters might want to delegate their right to vote to you, so that you may vote for them as a proxy.
      When you accept these delegations, then your ballot will not count just once, but also for each of your delegees.</p>
    <p>It is always possible to vote for yourself, no matter if you have a proxy or not. Even when your proxy has already voted for you in a poll,
    you can still override his ballot and vote for youself as long as that poll is still in its voting phase. And a delegation to a proxy can be revoked at any time.</p>


    <div class="row">
      <div class="col-sm-6" v-for="proxyInfo in proxyInfoMap">
        <div class="panel panel-default proxyPanel">
          <div class="panel-heading">
            <h4>{{proxyInfo.area.title}} - {{proxyInfo.area.description}}</h4>
          </div>
          <div class="panel-body proxyPanelBody">
            <div class="row">
              <div class="col-md-6">
                <div v-if="proxyInfo.directProxyDelegation">
                  <img :src="proxyInfo.directProxyDelegation.toProxy.profile.picture" class="avatarImg pull-left"/>
                  Your direct proxy:
                  <span v-if="proxyInfo.directProxyDelegation.delegationRequest">(requested)</span>
                  <span v-if="!proxyInfo.directProxyDelegation.transitive">(non-transitive)</span>
                  <a class="removeHover" @click="removeProxy(proxyInfo.area)"><i class="far fa-fw fa-times-circle" aria-hidden="true"></i>remove</a>
                  <br/>
                  {{proxyInfo.directProxyDelegation.toProxy.profile.name}}<br/>
                  &lt;{{ proxyInfo.directProxyDelegation.toProxy.email }}&gt;
                </div>
                <div v-else>
                  <a href="#" @click="assignProxy(proxyInfo.area)">
                    <img src="/static/img/placeholder.png" class="avatarImg pull-left placeholderImg"/> Assign a proxy
                  </a>
                </div>
              </div>
              <div class="col-md-6">
                <div v-if="proxyInfo.topProxy">
                  <img :src="proxyInfo.topProxy.profile.picture" class="avatarImg pull-left"/>
                  Top proxy:<br/>
                  {{proxyInfo.topProxy.profile.name}}<br/>
                  &lt;{{ proxyInfo.topProxy.email }}&gt;
                </div>
              </div>
            </div>

          </div>
          <div class="panel-footer proxyDataSmall">
            <a href="#" v-if="!proxyInfo.isPublicProxy" class="pull-right" @click="becomePublicProxy(proxyInfo.area)">
              <i class="far fa-fw fa-circle" aria-hidden="true"></i>&nbsp;public proxy
            </a>
            <span v-if="proxyInfo.isPublicProxy"  class="pull-right"><i class="far fa-fw fa-check-circle" aria-hidden="true"></i>&nbsp;public proxy</span>
            <i class="fas fa-fw fa-forward" aria-hidden="true"></i>&nbsp;{{proxyInfo.delegationCount}}&nbsp;delegations
            <a href="#" v-if="proxyInfo.delegationRequests.length > 0" @click="acceptDelegationRequest(proxyInfo.area)">
              &nbsp;({{proxyInfo.delegationRequests.length}}&nbsp;request{{proxyInfo.delegationRequests.length > 1 ? "s" : ""}})
            </a>

          </div>
        </div>
      </div>
    </div>

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
      proxyInfoMap: {}   // information about proxies per area.  key is areaURI
    }
  },

  methods: {
    getAllCategories() {
      return this.$root.api.getAllCategories().then(categories => this.categories = categories)
    },

    getVoterTokens(areas) {
      var requests = areas.map(area => {
        return this.$root.api.getVoterToken(area.id, process.env.tokenSecret, false)
      })
      return Promise.all(requests)
    },

    getProxyInfos(tokens) {
      var requests = tokens.map(token => {
        var areaURI = this.$root.api.getHateoasLink(token, "area")
        return this.$root.api.getMyProxyInfo(areaURI, token.voterToken)
      })
      return Promise.all(requests).then(proxyInfos => {
        for (const proxyInfo of proxyInfos) {
          var areaURI = this.$root.api.getHateoasLink(proxyInfo, "area")
          this.$set(this.proxyInfoMap, areaURI, proxyInfo)
        }
        return proxyInfos
      })
    },

    getDirectProxyInCategory: function(category) {
      try {
        var categoryURI = this.$root.api.getURI(category)
        var delegation = this.proxyInfoMap[categoryURI].directProxyDelegation
        return '<img src="' + delegation.toProxy.profile.picture + '">' +
          delegation.toProxy.profile.name + '<br/>&lt;' + delegation.toProxy.email + '&gt;' +
          (delegation.delegationRequest ? "(requested)" : "")
      } catch(err) {
        return "&nbsp;"
      }
    },

    getTopProxyInCategory: function(category) {
      try {
        var categoryURI = this.$root.api.getURI(category)
        var topProxy = this.proxyInfoMap[categoryURI].topProxy
        return '<img src="' + topProxy.profile.picture + '">' +
          topProxy.profile.name + '<br/>&lt;' + topProxy.email + '&gt;'
      } catch (err) {
        return "&nbsp;"
      }
    },

    becomePublicProxy(area) {
      this.$root.api.becomePublicProxy(area).then(res => {
         this.loadProxyMap(voterToken)
      })
    },

    acceptDelegationRequest(area) {
      this.$root.api.acceptDelegationRequests(area).then(res => {
         this.loadProxyMap(voterToken)
      })
    },



  },

  created () {
    $('[data-toggle="popover"]').popover()

    // fetch all proxy details for every area
    this.getAllCategories()         // returns an array of areas
      .then(this.getVoterTokens)    // returns an array of voterTokens
      .then(this.getProxyInfos)     // returns an array of proxyInfos
      .then(result => {
        console.log(result)
      })

  }

}
</script>

<style>
  .proxyPanelBody {
    height: 80px;
    padding: 10px;
  }
  .proxyPanel .panel-heading {
    padding: 5px 15px;
  }
  .proxyPanelBody {
    font-size: 12px;
  }
  .proxyPanel .avatarImg {
    margin-right: 1em;
  }
  .removeHover {
    color: red;
    /*visibility: hidden;*/
  }
  .removeHover:hover {
    visibility: show;
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

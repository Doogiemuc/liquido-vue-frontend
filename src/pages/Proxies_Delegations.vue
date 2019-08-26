<template>
<div class="container">
	<h1>You as a proxy</h1>

	<p>When other voters delegate their vote to you, then you can become their proxy. Your vote will then also be counted for them. But every delegee always
		has the possibility to vote for himself. And delegees may also revoke their delegation to you at any time.</p>
	<p>There is one thing to consider: When you accept delegations and thus become a proxy, then your delegees will know how you voted, because you also voted for them. Therefore becoming a proxy
		by default is an opt-in step in Liquido. You must manually accept delegation requests. You may decide to become a public proxy. Then all delegations to you will automatically be accepted.</p>

	<p>TODO: Button: Accept all delegation requests     Assign your proxy >></p>


	<div class="row">

		<div class="col-sm-6" v-for="area in categories" :key="area.id">
			<div class="panel panel-default proxyPanel">
				<div class="panel-heading">
					<h4>{{area.title}} - {{area.description}}</h4>
				</div>
				<div class="panel-body">
					<ul class="fa-ul userProxyInfo">
						<li><i class="fas fa-fw fa-user"></i>&nbsp;You are the proxy for {{delegations[area.id].delegationCount}} voter(s) in this area.</li>
						<li v-if="delegations[area.id].delegationRequests.length > 0">
							<i class="far fa-fw fa-question-circle"></i>&nbsp;
							<a href="#" @click="acceptDelegationRequest(area)">Accept {{delegations[area.id].delegationRequests.length}} delegation request{{delegations[area.id].delegationRequests.length > 1 ? "s" : ""}}</a>
						</li>
						<li v-else>
							<i class="far fa-fw fa-question-circle"></i>&nbsp;Currently no further delegation requests.
						</li>
						<li v-if="delegations[area.id].isPublicProxy"><i class="far fa-fw fa-check-circle" aria-hidden="true"></i>&nbsp;You are a public proxy in this area.</li>
						<li v-else>
							<a href="#" @click="becomePublicProxy(area)">
								<i class="far fa-fw fa-circle" aria-hidden="true"></i>&nbsp;Become a public proxy in this area.
							</a>
						</li>
					</ul>
				</div>
			</div>
		</div>

		
	</div>

	<div v-if="status === 'loading'" class="row">
		<span><i class="fas fa-2x fa-spinner grey fa-spin"></i> Loading ...</span>
	</div>
	
</div>
</template>

<script>
/**
 * Show an overview of all proxies in each area
 */

import apiClient from '../services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('Proxies_Show.vue');

export default {
  data () {
    return {
      status: "loading",
      categories: [],
      voterTokenMap: {},      // voterToken for each area. (key is area.id)
      proxyInfo: {},          // the user's proxy in each area (key in map is area.id)
      delegations: {}         // delegations to this user as a proxy
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

    /* Load information about this users proxy in that area. */
    loadProxyInfo(area) {
      //log.debug("Loading proxy info for area.id="+area.id)
      return this.$root.api.getMyProxy(area).then(proxyInfo => {
        this.$set(this.proxyInfo, area.id, proxyInfo)    // need vues reactive setter so that UI gets updated dynamically.
      })
    },

    /** load info about delegations TO this user as a proxy */
    loadDelegations(area) {
      this.fetchCachedVoterToken(area).then(voterToken => {
        this.$root.api.getMyDelegations(area, voterToken).then(dels => {
          this.$set(this.delegations, area.id, dels)
        })
      })
    },

    /** Get information about the user's direct proxy */
    myProxy(area) {
      // ES6 defenitely needs a null-save dereferencing operator like groovy's  "?."    https://github.com/davidyaha/ecmascript-optionals-proposal
      return  this.proxyInfo[area.id] &&
              this.proxyInfo[area.id].directProxyDelegation ?
              this.proxyInfo[area.id].directProxyDelegation.toProxy :
              undefined
    },

    /** Only show the top proxy, if he is different (ie. further up in the proxy tree) than the voter's directly assigned proxy. */
    showTopProxy(area) {
      return this.proxyInfo[area.id] &&
             this.proxyInfo[area.id].topProxy &&
             this.proxyInfo[area.id].directProxyDelegation &&
             this.proxyInfo[area.id].directProxyDelegation.toProxy &&
             this.proxyInfo[area.id].topProxy.id !== this.proxyInfo[area.id].directProxyDelegation.toProxy.id
    },

    /**
     * Become a public proxy in this area.
     * This will automatically accept all pending delegations
     */
    becomePublicProxy(area) {
      this.fetchCachedVoterToken(area).then(voterToken => {
        this.$root.api.becomePublicProxy(area, voterToken).then(res => {
          log.info("User is now public proxy in area(id="+area.id+")")
          this.loadDelegations(area) // reload delegations for that area. (User is now proxy info and delegtion requests might have been accepted.)
          iziToast.success({
            title: 'Success',
            message: "Your are now a public proxy in<br/>"+area.title,
          })
        })
      })

    },

    /** Accept all pending delegation requests in that area and reload delegation info */
    acceptDelegationRequest(area) {
      //var delReqCount = this.delegations[area.id].delegationRequests.length
      this.fetchCachedVoterToken(area).then(voterToken => {
        this.$root.api.acceptDelegationRequests(area, voterToken).then(res => {
          log.info("Pending delegation requests in area(id="+area.id+") accepted.")
          this.loadDelegations(area)
          iziToast.success({
            title: 'Success',
            message: "Delegation requests accepted.",
          })
        })
      })
    },

    editProxy(area) {
      log.debug("Edit proxy in area(id="+area.id+") current proxy:", this.myProxy[area.id])
      this.$router.push({ name: 'editProxy', params: {
        categoryId: area.id,
        category:   area,
        voterToken: this.voterTokenMap[area.id],
        delegation: this.proxyInfo[area.id] ? this.proxyInfo[area.id].directProxyDelegation : undefined
      }})
    }


  },

  created () {
    //$('[data-toggle="popover"]').popover()
    var start = Date.now()
    // fetch all proxy details for every area
    this.getAllCategories().then(categories => {
      var requests = categories.map(category => {
        return this.loadProxyInfo(category)
      })
      requests.push(categories.map(category => {
        return this.loadDelegations(category)
      }))
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
	.smallFont {
		font-size: 12px;
	}
	.userProxyInfo {
		margin: 0;
		font-size: 12px;
	}
 
</style>

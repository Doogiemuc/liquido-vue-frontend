<template>
<div class="container" id="ProposalsList">
  <h1><i class="fa far fa-file-alt"></i> Proposals</h1>
  <p>When an idea reaches its quorum, then it becomes a proposal. A proposal can be further discussed and improved. The creator of a proposal can either start a new poll
    or he can join his proposal into an already existing poll.</p>
  <button type="button" class="btn btn-xs btn-default pull-right" @click="showUsersOwnProposals">Your proposals <i class="fa fa-angle-double-right"></i></button>
  <p>You can search for ideas and proposals on the <router-link to="search">search page</router-link>.
  
  <div class="row">
    <div class="col-sm-6">
      <law-list :laws="recentProposals" id="recentlyNewProposals" lawListTitle="Recently new proposals"></law-list>
    </div>
    <div class="col-sm-6">
      <law-list :laws="recentlyDiscussed" id="trendingProposals" lawListTitle="Trending proposals"></law-list>
     
    </div>
  </div>


</div>

</template>

<script>
import LawList from 'components/LawList'



export default {
  components: {
    'law-list': LawList
  },

  data () {
    return {
      recentProposals: [],
      recentlyDiscussed: [],
    }
  },

  methods: {
  	/* Jump to search page and show all proposals that were created by this user */
	showUsersOwnProposals() {
		var query = {
			statusList: ["PROPOSAL", "ELABORATION" ],
			createdByYou: true
		}
		this.$router.push( { name: 'search', params: { initQuery: query }})
	}
  },

  created () {
    this.$root.api.getReachedQuorumSince("2017-09-18").then(proposals => {
      this.recentProposals = proposals.slice(0,10)
    })
    //TODO: "trending" may also mean: a lot of (recent?) likes. Don't just count comments
    this.$root.api.getRecentlyDiscussed().then(recentlyDiscussedProposals => {
      this.recentlyDiscussed = recentlyDiscussedProposals
    })

  },

}
</script>

<style>
</style>

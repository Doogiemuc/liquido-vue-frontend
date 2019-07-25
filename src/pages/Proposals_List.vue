<template>
<div class="container" id="ProposalsList">
  <h1><i class="fa far fa-file-alt"></i> Proposals</h1>
  <p>When an idea reaches its quorum, then it becomes a proposal. A proposal can be further discussed and improved. The creator of a proposal can either start a new poll
    or he can join his proposal into an already existing poll.</p>
  <p>You can search for ideas and proposals on the <router-link to="search">search page.</router-link></p>

  <div class="row">
    <div class="col-sm-6">
      <law-list :laws="recentProposals" id="recentlyNewProposals" lawListTitle="Recently new proposals"></law-list>
    </div>
    <div class="col-sm-6">
      <law-list :laws="recentlyDiscussed" id="trendingProposals" lawListTitle="Trending proposals"></law-list>
      <p>
      	<button type="button" class="btn btn-default" @click="showUsersOwnProposals()">Your proposals</button>
      </p>
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
			status: ["PROPOSAL", "ELABORATION" ],
			createdBy: this.$root.currentUser
		}
		//TODO: this.$router.push('/search?query='+query)
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

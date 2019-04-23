<template>
<div class="container">
  <h1>Proposals</h1>
  <p>When an idea reaches its quorum, then it becomes a proposal. A proposal can be further discussed and improved. The creator of a proposal can either start a new poll
    or he can join his proposal into an already existing poll.</p>
  <p>You can search for ideas and proposals on the <router-link to="search">search page.</router-link></p>

  <div class="row">
    <div class="col-sm-6">
      <law-list :laws="recentProposals" lawListTitle="Recently new proposals"></law-list>
    </div>
    <div class="col-sm-6">
      <law-list :laws="recentlyDiscussed" lawListTitle="Trending proposals"></law-list>
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

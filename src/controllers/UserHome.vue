<template src="../views/userHome.html"></template>

<script>
var IdeaPanel   = require('../components/IdeaPanel.vue')
var LawPanel    = require('../components/LawPanel.vue')
var RestClient = require('../services/RestClient.js')

export default {
  components: {
    'idea-panel' : IdeaPanel,
    'law-panel' : LawPanel
  },

  data () {
    return {
      recentIdeas: [],     // recently created ideas sorted by date desc
      openForVotingProposals: []  // proposals for laws that are currently in the voting phase
    }
  },
  
  created () {
    RestClient.getRecentIdeas().then(recentIdeas => {
      this.recentIdeas = recentIdeas
    })
    RestClient.getOpenForVotingProposals().then(openProposals => {
      this.openForVotingProposals = openProposals
    })
  },
  
}
</script>

<style scoped>
  .news_heading {
    color: #999;
    font-size: 12px;
  }
</style>

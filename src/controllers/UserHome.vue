<template src="../views/userHome.html"></template>

<script>
var IdeaPanel   = require('../components/IdeaPanel.vue')
var LawPanel    = require('../components/LawPanel.vue')
import moment from 'moment'

export default {
  components: {
    'idea-panel' : IdeaPanel,
    'law-panel' : LawPanel
  },

  data () {
    return {
      recentIdeas: [],            // recently created ideas sorted by date desc
      openForVotingProposals: []  // proposals for laws that are currently in the voting phase
    }
  },
  
  created () {
    this.$root.api.fetchRecentIdeas().then(recentIdeas => {
      this.recentIdeas = recentIdeas
    })
    this.$root.api.fetchOpenForVotingProposals().then(openProposals => {
      this.openForVotingProposals = openProposals
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
  }
  
}
</script>

<style scoped>
  .ideaIcon {
    font-size: 30px;
  }
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
  }
  .ideaDataRight {
    padding-top: 18px;
    color: grey;
    font-size: 12px;
    
  }
  .ideaDataRight ul.fa-ul {
    margin-left: 1.5em;
  }
  .ideaDataRight .userPicture {
    margin-bottom: 8px;
  }

</style>

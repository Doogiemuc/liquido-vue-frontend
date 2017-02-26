<template>
  <div class="container">
    <div class="page-header">
      <h3>Welcome {{$root.currentUser.profile.name}}</h3>
    </div>
    <div class="row">

      <div class="col-sm-6">

        <h2>Proposals currently open for voting</h2>
        <law-panel v-for="law in openForVotingProposals" :law="law"></law-panel>

        <br/><br/>
        <h2 v-if="recentIdeas">Recently created ideas</h2>
        <idea-panel v-for="idea in recentIdeas" :idea="idea" v-on:reloadIdea="loadRecentIdeas"></idea-panel>
      </div>

      <div class="col-sm-6">
        <h2>Your ideas and proposals</h2>
        <div class="panel panel-default">
          <div class="panel-heading">
            <h4>Latest activity</h4>
          </div>
          <div class="panel-body">
            <ul>
              <li><i class="fa fa-lightbulb-o" aria-hidden="true"></i> Your idea "foo bar" needs at least 8 more supporters.</li>
              <li><i class="fa fa-lightbulb-o" aria-hidden="true"></i> Your idea "liasdf lkasdkl fj" reached its quorum</li>
              <li><i class="fa fa-university"></i>"Current propsal in work" is in elaboration phase and currenlty has 4 alternatives. 15 days left until voting will start.</li>
              <li><i class="fa fa-university"></i>"Some other proposal" currently is in voting phase until March 23rd (25 days left). 232 votes casted.</li>
            </ul>
          </div>
        </div>


        <br/><br/>
        <h2>Some other list</h2>
        <div class="panel panel-default">
          <div class="panel-heading">
            <i aria-hidden="true" class="pull-right fa fa-lightbulb-o fa-lg grey"></i>
            <h4>WIP (expanded view of ideas)</h4>
          </div>
          <table class="table ideaTable">
            <tbody>
              <tr v-for="idea in recentIdeas">
                <td width="80%">
                  <img src="/static/img/Avatar_32x32.jpeg" class="userPictureLeft">
                  <h4 class="ideaTitle">{{idea.title}}</h4>
                  <p>{{idea.description}}
                </td>
                <td class="ideaDataRight">
                  <ul class="fa-ul">
                    <li><i class="fa-li fa fa-user"></i>{{idea.createdBy.profile.name}}</li>
                    <li><i class="fa-li fa fa-clock-o"></i>{{getFromNow(idea.createdAt)}}</li>
                    <li><i class="fa-li fa fa-bookmark"></i>{{idea.area.title}}</li>
                  </ul>
                  <button v-if="idea.supportedByCurrentUser" type="button" class="btn btn-default btn-xs active supportedIdeaButton">
                    <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
                  </button>
                  <button v-else type="button" class="btn btn-default btn-xs" v-on:click="likeToDiscuss(idea)">
                    <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
        </div>
      </div>
    </div>
  </div>
</template>

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
    this.loadRecentIdeas()
    this.$root.api.fetchOpenForVotingProposals().then(openProposals => {
      this.openForVotingProposals = openProposals
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
    loadRecentIdeas: function() {   // We also simply call this, when a supportes is added to one idea.
      this.$root.api.fetchRecentIdeas().then(recentIdeas => {   
        this.recentIdeas = recentIdeas
      })
    }
  }
  
}
</script>

<style scoped>
  .ideaIcon {
    font-size: 30px;
  }
  .userPictureLeft {
    float: left;
    margin-right: 8px;
  }
  .ideaTitle {
    margin-top: 0;
  }
  .ideaDataRight {
    padding-top: 18px;
    color: grey;
    font-size: 12px;
    background-color: rgb(245,245,245);
  }
  .ideaDataRight ul.fa-ul {
    margin-left: 1.5em;
  }
  .ideaDataRight .userPicture {
    margin-bottom: 8px;
  }

</style>

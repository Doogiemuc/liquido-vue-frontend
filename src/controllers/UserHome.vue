<template>
  <div class="container">
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
            <h4>Latest activity around your stuff</h4>
          </div>
          <ul class="list-group">
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-lightbulb-o pull-left"></i>
              <p style="overflow: hidden">This is better used for short text. Only one line of text. asdölfj asölkfja ölefjöklwef öklasdjflasdökl fl</p>
            </li>
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-lightbulb-o pull-left"></i>
              <p style="overflow: hidden">Your idea "liasdf lkasdkl fj" reached its quorum</p>
            </li>
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-university pull-left"></i>
              <p style="overflow: hidden">"Current propsal in work" is in elaboration phase and currenlty has 4 alternatives. 15 days left until voting will start.</p>
            </li>
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-university pull-left"></i>
              <p style="overflow: hidden">"Some other proposal" currently is in voting phase until March 23rd (25 days left). 232 votes casted.</p>
            </li>
          </ul>
        </div>



        <div class="panel panel-default">
          <div class="panel-heading">
             <h4>Some other messages - v2</h4>
          </div>
          <div class="panel-body">
            <div class="media">
              <div class="media-left">
                <i class="fa fa-lightbulb-o fa-2x"></i>
              </div>
              <div class="media-body">
                <small class="pull-right text-muted">4 hours ago</small>
                <h4 class="media-heading">Media heading</h4>
                <p>
                  Your idea "foo bar" needs at least 8 more supporters.asd föklj a g b e fasökldj föaklj klj235 klj klsdjöfkl asdöoln 35lnöiov ff
                  asdöklfj lkj asdölfkj asöldfj ölaksd fj asölkjf öklsdjfklaj sdf lasdöl fj
                </p>
              </div>
            </div>
        
            <div class="media">
              <div class="media-left">
                <i class="fa fa-lightbulb-o fa-2x"></i>
              </div>
              <div class="media-body">
                <small class="pull-right text-muted">4 hours ago</small>
                <h4 class="media-heading">Media heading</h4>
                <p>
                  Your idea "foo bar" needs at least 8 more supporters.asd föklj a g b e fasökldj föaklj klj235 klj klsdjöfkl asdöoln 35lnöiov ff
                  asdöklfj lkj asdölfkj asöldfj ölaksd fj asölkjf öklsdjfklaj sdf lasdöl fj
                </p>
              </div>
            </div>
     
            <div class="media">
              <div class="media-left">
                <i class="fa fa-lightbulb-o fa-2x"></i>
              </div>
              <div class="media-body">
                <small class="pull-right text-muted">4 hours ago</small>
                <h4 class="media-heading">Media heading</h4>
                <p>
                  Your idea "foo bar" needs at least 8 more supporters.asd föklj a g b e fasökldj föaklj klj235 klj klsdjöfkl asdöoln 35lnöiov ff
                  asdöklfj lkj asdölfkj asöldfj ölaksd fj asölkjf öklsdjfklaj sdf lasdöl fj
                </p>
              </div>
            </div>
          </div>
        </div>


        <br/><br/>
        <h2>Some other list</h2>
        <div class="panel panel-default">
          <div class="panel-heading">
            <i aria-hidden="true" class="pull-right fa fa-lightbulb-o fa-lg grey"></i>
            <h4>Condensed preview of ideas</h4>
          </div>
          <table class="table ideaTable">
            <tbody>
              <tr v-for="idea in recentIdeas">
                <td width="80%">
                  <img src="/static/img/Avatar_32x32.jpeg" class="userPictureLeft">
                  <h4 class="ideaTitle">{{idea.title}}</h4>
                  <div class="maxHeightPreviewWrapper">
                    <div class="maxHeightPreview">{{idea.description}}</div>
                  </div>
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
      console.log(openProposals);
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
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
  }
  .ideaIcon {
    font-size: 30px;
  }
  .userPictureLeft {
    float: left;
    margin-right: 8px;
  }
  .ideaTitle {
    margin-top: 0;
    margin-bottom: 8px;
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
  .maxHeightPreviewWrapper {
    position: relative;
  }
  .maxHeightPreview {
    height:55px; 
    overflow:hidden;  
  }
  .maxHeightPreview:before {
    content:'';
    width:100%;
    height:100%;    
    position:absolute;
    left:0;
    top:0;
    /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+0,ffffff+90,ffffff+100&0+0,0+90,1+100 */  
    background: -moz-linear-gradient(top, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 90%, rgba(255,255,255,1) 100%); /* FF3.6-15 */
    background: -webkit-linear-gradient(top, rgba(255,255,255,0) 0%,rgba(255,255,255,0) 90%,rgba(255,255,255,1) 100%); /* Chrome10-25,Safari5.1-6 */
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%,rgba(255,255,255,0) 90%,rgba(255,255,255,1) 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ffffff', endColorstr='#ffffff',GradientType=0 ); /* IE6-9 */
  }
  .item-condensed {
    padding-top: 3px;
    padding-bottom: 3px;
  }
  .item-condensed i {
    line-height: inherit;  /* necessary to vertically align fontawesome icons */
  }
  .item-condensed p {
    margin-bottom: 0;
  }
  
   
</style>

<template>
  <div class="container">
    <div class="row">
      <div class="col-sm-6">

        <h2>Polls currently open for voting</h2>

        <div v-for="poll in openForVotingPolls" class="panel panel-default pollPanel">
          <div class="panel-heading">
            <div class="row">
            <div class="col-xs-4">
              <h4><i class="fa fa-fw fa-balance-scale"></i> Poll</h4>
            </div>
            <div class="col-xs-4 text-center">
              <small class="poll-timeleft">24 days lef to vote</small>
            </div>
            <div class="col-xs-4 text-right">
              <router-link :to="{ path: '/showPoll', query: { poll: getPollURI(poll) }}" role="button" class="btn btn-default btn-xs pull-right">
                Goto poll &raquo;
              </router-link>
            </div>
            </div>
          </div>
          <div class="panel-body poll-list">
            <span v-for="proposal in poll._embedded.proposals">
              <h4>{{proposal.title}}</h4>
              <p class="collapse collapseDescription">{{proposal.description}}</p>
              <p class="pfooter">
                <i class="fa fa-user"></i> {{proposal.createdBy.profile.name}} &nbsp;&nbsp; 
                <i class="fa fa-clock-o"></i> {{getFromNow(proposal.createdAt)}} &nbsp;&nbsp; 
                <i class="fa fa-bookmark"></i> {{proposal.area.title}}&nbsp;&nbsp;
                <i class="fa fa-thumbs-o-up"></i> {{proposal.numSupporters}}
              </p>
              <hr/>
            </span>
            <button type="button" class="btn btn-default btn-xs expandButton" data-toggle="collapse" data-target=".collapseDescription" aria-expanded="false" aria-controls="collapseDescription">
              <i class="fa fa-angle-double-down"></i>
            </button>
          </div>
        </div>

        <div v-for="poll in openForVotingPolls" class="panel panel-default">
          <div class="panel-heading">
            <router-link :to="{ path: '/showPoll', query: { poll: getPollURI(poll) }}" role="button" class="btn btn-default btn-xs pull-right">
              Goto poll &raquo;
            </router-link>
            <i aria-hidden="true" class="fa fa-balance-scale fa-lg pull-left"></i>
            <h4>Poll</h4>
            <div style="padding: 10px">
              <timeline :timelineData="getTimelineDataFor(poll)"></timeline>
            </div>
          </div>
          <table class="table pollTable">
            <tbody>
              <tr v-for="proposal in poll._embedded.proposals">
                <td width="80%">
                  <img src="/static/img/Avatar_32x32.jpeg" class="userPictureLeft">
                  <h4 class="proposalTitle">{{proposal.title}}</h4>
                  <div class="maxHeightPreviewWrapper">
                    <div class="maxHeightPreview">{{proposal.description}}</div>
                  </div>
                </td>
                <td class="greyDataRight">
                  <ul class="fa-ul">
                    <li><i class="fa-li fa fa-user"></i>{{proposal.createdBy.profile.name}}</li>
                    <li><i class="fa-li fa fa-clock-o"></i>{{getFromNow(proposal.createdAt)}}</li>
                    <!-- <li><i class="fa-li fa fa-check-circle-o"></i>{{getFromNow(proposal.reachedQuorumAt)}} </li> -->
                    <li><i class="fa-li fa fa-bookmark"></i>{{proposal.area.title}}</li>                  
                    <li><i class="fa-li fa fa-thumbs-o-up"></i> {{proposal.numSupporters}}</li> 
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        
        <h2 v-if="recentIdeas">Recently created ideas</h2>
        <idea-panel v-for="idea in recentIdeas" :idea="idea" v-on:reloadIdea="loadRecentIdeas"></idea-panel>

      </div>

      <!-- right column -->
      <div class="col-sm-6">
        <h2>Your ideas and proposals</h2>

        <div class="panel panel-default">
          <div class="panel-heading">
            <h4>Newsfeed</h4>
          </div>
          <ul class="list-group">
            <li v-for="proposal in reachedQuorum" class="list-group-item item-condensed">
              <i class="fa fa-fw fa-balance-scale pull-left"></i>
              <p style="overflow: hidden">Your idea 
                <router-link :to="{ path: '/ideas/31' }">'{{proposal.title}}'</router-link> reached its quorum. You can now 
                <router-link :to="{ path: '/createNewPoll', query: {proposalId: proposal.id} }">start a new poll</router-link> or 
                <router-link :to="{ path: '/joinPoll', query: {proposalId: proposal.id} }">join an existing poll.</router-link>
              </p>
            </li>
            
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-lightbulb-o pull-left"></i>
              <p style="overflow: hidden">Your idea "liasdf lkasdkl fj" reached its quorum</p>
            </li>
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-balance-scale pull-left"></i>
              <p style="overflow: hidden">"Current propsal in work" is in elaboration phase and currenlty has 4 alternatives. 15 days left until voting will start.</p>
            </li>
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-balance-scale pull-left"></i>
              <p style="overflow: hidden">"Some other proposal" currently is in voting phase until March 23rd (25 days left). 232 votes casted.</p>
            </li>
            <li class="list-group-item item-condensed">
              <i class="fa fa-fw fa-university pull-left"></i>
              <p style="overflow: hidden">"Best proposal" became a law</p>
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
    				

    		<h2>Trending proposals</h2>
        <p>(Demo for LawPanel)</p>
    		
    		<law-panel v-for="proposal in trendingProposals" 
    		  :law="proposal" 
    		  :showTimeline="true">  
    		</law-panel> 
    		
    				
    		
        <h2>Ideas and proposals supported by you</h2>
    		<p>Demo for LawList</p>
    		
    		<law-list 
    		  :laws="supportedIdeasAndProps"
    		  title="LawList Title">
    		</law-list>
		
	   </div>
    </div>
  </div>
</template>

<script>
import IdeaPanel from '../components/IdeaPanel.vue'
import LawPanel from '../components/LawPanel.vue'
import LawList from '../components/LawList.vue'
import Timeline from '../components/Timeline.vue'
import moment from 'moment'


export default {
  components: {
    'idea-panel' : IdeaPanel,
    'law-panel' : LawPanel,
	  'law-list' : LawList,
    'timeline' : Timeline
  },

  data () {
    return {
      recentIdeas: [],            // recently created ideas sorted by date desc
      reachedQuorum: [],          // ideas of this user that (recently) reached their quorum and became proposals
      openForVotingPolls: [],     // polls that are currently in the voting phase
	    trendingProposals: [],      // 
	    supportedIdeasAndProps: []  // ideas and proposals that this user liked
    }
  },
  
  created () {
    this.$root.api.noCacheForNextRequest()
    this.loadRecentIdeas()

    this.$root.api.noCacheForNextRequest()
    this.$root.api.getReachedQuorumSince("2017-09-18").then(proposals => {
      this.reachedQuorum = proposals
    })
    
    this.$root.api.noCacheForNextRequest()
    this.$root.api.findSupportedBy(this.$root.currentUser, 'PROPOSAL').then(proposals => {
      console.log("findSupportedBy returned", proposals)
      this.supportedIdeasAndProps = proposals
    })

    this.$root.api.noCacheForNextRequest()
    this.$root.api.findSupportedBy(this.$root.currentUser, 'PROPOSAL').then(proposals => {
      this.trendingProposals = proposals
    })

    this.$root.api.noCacheForNextRequest()
    this.$root.api.findPollsByStatus('VOTING').then(votingPolls => {
      this.openForVotingPolls = votingPolls
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
    
    getPollURI: function(poll) {
    	return this.$root.api.getURI(poll)
    },
    
    loadRecentIdeas: function() {
      this.$root.api.getRecentIdeas().then(recentIdeas => {   
        this.recentIdeas = recentIdeas
      })
    },
    
    /** a lot of data calculations for our pretty timeline
	    SEE ALSO   LawPanel!  Same function ?!?!??!
    	*/
    getTimelineDataFor(poll) {
      //TODO: simply past dates into timeline and let all the calculation be done in the timeline class */
    	if (poll === undefined) return {}
      var daysUntilVotingStarts = this.$root.api.getGlobalProperty("liquido.days.until.voting.starts")     // number of days
      var durationOfVotingPhase = this.$root.api.getGlobalProperty("liquido.duration.of.voting.phase")     // also in days
      var durationInDays        = Number(daysUntilVotingStarts)+ Number(durationOfVotingPhase)
      var msSincePollCreated    = Date.now() - Date.parse(poll.createdAt)

      var pollCreatedLoc        = moment(poll.createdAt).format('L')
      var votingStartsLoc       = moment(poll.createdAt).add(daysUntilVotingStarts, 'days').format('L')   // moment.js FTW!
      var votingEndsLoc         = moment(poll.createdAt).add(durationInDays, 'days').format('L')
      var percentVotingStarts   = (daysUntilVotingStarts / durationInDays)*100
      var percentFilled         = (msSincePollCreated / (durationInDays*24*3600*1000) )*100
      
    	var timelineData = {
        percentFilled: percentFilled,
        events: [ 
          { percent:   "0", above: pollCreatedLoc,  below: "Poll<br/>created" },
          { percent: percentVotingStarts, above: votingStartsLoc, below: "Voting<br/>starts"},
          { percent: "100", above: votingEndsLoc,   below: "Voting<br/>ends"}
        ]
      }
      return timelineData
    }
  }
  
}
</script>

<style scoped>
  .poll-list h4 {
    margin-top: 5px;
    margin-bottom: 5px;
  }
  .poll-list hr {
    margin-top: 10px;
    margin-bottom: 10px;
  }
  .poll-list p {
    margin: 0;
  }
  .poll-list .pfooter {
    text-align: right;
    color: #999;
    font-size: 12px;
    line-height: 1.4;
  }

  /* Button in the lower right corner of poll-pannel */
  .pollPanel {
    position: relative;
  }
  .expandButton {
    position: absolute;
    bottom: 0;
    right: 0;
  }


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
  .greyDataRight {
    padding-top: 18px;
    color: grey;
    font-size: 12px;
    background-color: rgb(245,245,245);
  }
  .greyDataRight ul.fa-ul {
    margin-left: 1.5em;
  }
  .greyDataRight .userPicture {
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

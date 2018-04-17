<template>
  <div class="container">
    <div class="row">
      <div class="col-sm-6">

        <h2>Polls in elaboration phase</h2>

        <p>The proposals in these polls can be discussed and improved.</p>

        <div v-for="poll in pollsInElaboration" class="panel panel-default pollPanel">
          <div class="panel-heading">
            <div class="row">
            <div class="col-xs-4">
              <h4><i class="fas fa-balance-scale"></i> Poll</h4>
            </div>
            <div class="col-xs-4 text-center">
              &nbsp;  
            </div>
            <div class="col-xs-4 text-right">
                <router-link :to="{ path: '/showPoll', query: { poll: getPollURI(poll) }}" role="button" class="btn btn-default btn-xs pull-right">
                  Show details &raquo;
                </router-link>
            </div>
            </div>
          </div>
          <div class="panel-body poll-list" :id="'Poll_'+poll.id">
            <div v-for="proposal in poll._embedded.proposals">
              <h4>{{proposal.title}}</h4>
              <p class="collapse collapseDescription">{{proposal.description}}</p>
              <p class="pfooter">
                <i class="far fa-user"></i> {{proposal.createdBy.profile.name}} &nbsp;&nbsp; 
                <i class="far fa-clock"></i> {{getFromNow(proposal.createdAt)}} &nbsp;&nbsp; 
                <i class="far fa-bookmark"></i> {{proposal.area.title}}&nbsp;&nbsp;
                <i class="far fa-thumbs-up"></i> {{proposal.numSupporters}}
              </p>
            </div>
            <button type="button" class="btn btn-default btn-xs expandButton" data-toggle="collapse" :data-target="'#Poll_'+poll.id+' .collapseDescription'" aria-expanded="false" aria-controls="collapseDescription">
              <i class="fas fa-angle-double-down"></i>
            </button>
          </div>
        </div>

       
      </div>

      <!-- right column -->
      <div class="col-sm-6">

        <h2>Polls currently open for voting</h2>

        <p>You can cast your ballot in these polls.</p>

        <div v-for="poll in pollsInVotingPhase" class="panel panel-default pollPanel">
          <div class="panel-heading">
            <div class="row">
            <div class="col-xs-4">
              <h4><i class="fas fa-balance-scale"></i> Poll</h4>
            </div>
            <div class="col-xs-4 text-center">
              <small class="poll-timeleft">24 days lef to vote</small>
            </div>
            <div class="col-xs-4 text-right">
                <router-link :to="{ path: '/castVote', query: { poll: getPollURI(poll) }}" role="button" class="btn btn-default btn-xs pull-right">
                  Cast vote &raquo;
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
              <i class="fas fa-angle-double-down"></i>
            </button>
          </div>
        </div>

  	  </div>
    </div>
  </div>
</template>

<script>
import Timeline from '../components/Timeline.vue'
import moment from 'moment'


export default {
  components: {
    'timeline' : Timeline
  },

  data () {
    return {
      pollsInElaboration: [],
      pollsInVotingPhase: [],
    }
  },
  
  created () {
    this.$root.api.findPollsByStatus('ELABORATION').then(elaborationPolls => {
      this.pollsInElaboration = elaborationPolls
    })
    this.$root.api.findPollsByStatus('VOTING').then(votingPolls => {
      this.pollsInVotingPhase = votingPolls
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
    
    getPollURI: function(poll) {
    	return this.$root.api.getURI(poll)
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
  .poll-list p {
    margin: 0;
  }
  .poll-list .pfooter {
    text-align: right;
    color: #999;
    font-size: 12px;
		margin-bottom: 15px;
  }
	

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

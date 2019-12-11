<template>
  <div class="container" id="PollsList">
    <div class="row">
      <div class="col-sm-6" id="pollsInElaboration">
        <h2>Polls in elaboration phase</h2>
        <p>The proposals in these polls can be discussed and improved.</p>
		<poll-panel v-for="poll in pollsInElaboration" :key="poll.id" :poll="poll"></poll-panel>

        <h2>Recently finished polls</h2>
        <p>Polls that have a winning proposal.</p>
        <poll-panel v-for="poll in finishedPolls" :key="poll.id" :poll="poll"></poll-panel>
      </div>
      <div class="col-sm-6" id="pollsInVoting">
        <h2>Polls currently open for voting</h2>
        <p>You can cast your vote in these polls.</p>
		<poll-panel v-for="poll in pollsInVotingPhase" :key="poll.id" :poll="poll"></poll-panel>
  	  </div>
    </div>
  </div>
</template>

<script>
import Timeline from '../components/Timeline.vue'
import PollPanel from '../components/PollPanel.vue'
import moment from 'moment'


export default {
  components: {
    'timeline' : Timeline,
		'pollPanel': PollPanel,
  },

  data () {
    return {
      pollsInElaboration: [],
      pollsInVotingPhase: [],
      finishedPolls: [],
    }
  },

  created () {
    this.$root.api.findPollsByStatus('ELABORATION').then(elaborationPolls => {
      this.pollsInElaboration = elaborationPolls
    })
    this.$root.api.findPollsByStatus('VOTING').then(votingPolls => {
      this.pollsInVotingPhase = votingPolls
    })
    this.$root.api.findPollsByStatus('FINISHED').then(finishedPolls => {
      this.finishedPolls = finishedPolls
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
  .poll-list p {
    margin: 0;
  }
  .poll-list .pfooter {
    text-align: right;
    color: #999;
    font-size: 12px;
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

<template>
  <div class="container" id="UserHomePage">
    <div class="row">
      <div class="col-sm-12">
        <h2>Welcome {{username}}!</h2>
      </div>
    </div>
    <div class="row">

      <!-- left column: public and general things -->
      <div class="col-sm-6">

        <law-list :laws="supportedProposals" lawListTitle="Proposals supported by you"></law-list>

      </div>

      <!-- right column: voters personal stuff -->
      <div class="col-sm-6">

        <div class="panel panel-default">
          <div class="panel-heading">
             <h4>Newsfeed</h4>
          </div>
          <div class="panel-body">
            <div class="media">
              <div class="media-left">
                <i class="far fa-share-square fa-2x"></i>
              </div>
              <div class="media-body">
                <small class="pull-right text-muted">4 hours ago</small>
                <h4 class="media-heading">Delegation requests</h4>
                <p>
                  10 other voters would like to delegate their vote in the area XYZ to you as their proxy. Do you want to accept these delegations?
                </p>
              </div>
            </div>

            <div class="media">
              <div class="media-left">
                <i class="fas fa-balance-scale-left fa-2x"></i>
              </div>
              <div class="media-body">
                <small class="pull-right text-muted">2 days ago</small>
                <h4 class="media-heading">Voting for your poll has started</h4>
                <p>
                  Your idea "foo bar" needs at least 8 more supporters.asd föklj a g b e fasökldj föaklj klj235 klj klsdjöfkl asdöoln 35lnöiov ff
                  asdöklfj lkj asdölfkj asöldfj ölaksd fj asölkjf öklsdjfklaj s
                </p>
              </div>
            </div>

            <div class="media">
              <div class="media-left">
                <i class="far fa-file-alt fa-2x"></i>
              </div>
              <div class="media-body">
                <small class="pull-right text-muted">15 minutes ago</small>
                <h4 class="media-heading">New comments on your proposal</h4>
                <p>
                  Your idea "foo bar" needs at least 8 more supporters.asd föklj a g b e fasökldj föaklj klj235 klj klsdjöfkl asdöoln 35lnöiov ff
                  asdöklfj lkj asdölfkj asöldfj ölaksd fj asölkjf öklsdjfklaj sdf lasdöasfd a sklfja sölkfja öksjf lks flkd fl
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="reachedQuorum.length > 0" class="panel panel-default">
          <div class="panel-heading">
            <h4>Your ideas that recently reached their quorum</h4>
          </div>
          <ul class="list-group">
            <li v-for="proposal in reachedQuorum" :key="proposal.id" class="list-group-item item-condensed">
              <router-link :to="{ path: '/proposals/'+proposal.id }"><i class="far fa-file-alt"></i> {{proposal.title}}</router-link>
            </li>
          </ul>
        </div>


	   </div>
    </div>
  </div>
</template>

<script>
import IdeaPanel from '../components/IdeaPanel.vue'
import LawPanel from '../components/LawPanel.vue'
import LawList from '../components/LawList.vue'
import PollPanel from '../components/PollPanel.vue'
import Timeline from '../components/Timeline.vue'
import moment from 'moment'

export default {
  components: {
    'idea-panel' : IdeaPanel,
    'law-panel' : LawPanel,
	  'law-list' : LawList,
		'poll-panel': PollPanel,
    'timeline' : Timeline
  },

  data () {
    return {
      openForVotingPolls: [],     // polls that are currently in their voting phase
	    supportedProposals: [],     // proposals that this user liked
      reachedQuorum: [],          // user's ideas that recently reached their quorum and became a proposal
    }
  },

  computed: {
    username: function() { return this.$root.currentUser ? this.$root.currentUser.profile.name : "" },
  },

  created () {
    // here we load quite a lot of stuff. But all in parallel.

    this.$root.api.findSupportedBy(this.$root.currentUser, 'PROPOSAL').then(proposals => {
      this.supportedProposals = proposals.slice(0,10)
    })
    this.$root.api.findPollsByStatus('VOTING').then(votingPolls => {
      this.openForVotingPolls = votingPolls
    })
    var oneWeekAgo = moment().subtract(7, 'days').format("YYYY-MM-DD")
    var currentUserURI = this.$root.api.getURI(this.$root.currentUser)
    this.$root.api.reachedQuorumSinceAndCreatedBy(oneWeekAgo, currentUserURI).then(proposals => {
      this.reachedQuorum = proposals
    })
    //this.$root.api.getAllCategories().then(areas => this.areas = areas)
  },

  methods: {
    getFromNow(dateVal) {
      return moment(dateVal).fromNow();
    },

    /** a lot of data calculations for our pretty timeline
	    SEE ALSO   LawPanel!  Same function ?!?!??!
    	*/
    getTimelineEvents(poll) {
    	if (poll === undefined) return {}
      //var daysUntilVotingStarts = this.$root.api.getGlobalProperty("liquido.days.until.voting.starts")     // number of days
      //var durationOfVotingPhase = this.$root.api.getGlobalProperty("liquido.duration.of.voting.phase")     // also in days
      //var durationInDays        = Number(daysUntilVotingStarts)+ Number(durationOfVotingPhase)
      //var msSincePollCreated    = Date.now() - Date.parse(poll.createdAt)

      var pollCreatedLoc        = moment(poll.createdAt).format('L')
      var votingStartLoc        = moment(poll.votingStartAt).format('L')
      var votingEndLoc          = moment(poll.votingEndAt).format('L')

      //var votingStartLoc        = moment(poll.createdAt).add(daysUntilVotingStarts, 'days').format('L')   // moment.js FTW!
      //var votingEndLoc          = moment(poll.createdAt).add(durationInDays, 'days').format('L')
      //var percentVotingStarts   = (daysUntilVotingStarts / durationInDays)*100

      return [
        { date: new Date(poll.createdAt),     above: pollCreatedLoc,  below: "Poll<br/>created" },
        { date: new Date(poll.votingStartAt), above: votingStartLoc, below: "Voting<br/>starts" },
        { date: new Date(poll.votingEndAt),   above: votingEndLoc,   below: "Voting<br/>ends" }
      ]
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

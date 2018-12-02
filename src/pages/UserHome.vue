<template>
  <div class="container">
    <div class="row">
      <div class="col-sm-6">

        <h2 id="pollsOpenForVotingHeader">Polls currently open for voting</h2>

				<poll-panel v-for="poll in openForVotingPolls" :poll="poll"></poll-panel>

				<h2>Alternative to pollPanel</h2>
        <p>This manually created HTML also shows a poll with all its proposals in a compact form. But my new poll panel with expanding is maybe already better.</p>
        <div v-for="poll in openForVotingPolls" class="panel panel-default">
          <div class="panel-heading">
            <div class="pull-right">
              <router-link :to="{ path: '/polls/'+poll.id }" role="button" class="btn btn-default btn-xs pull-right">
                <i class="fas fa-angle-double-right"></i>
              </router-link>
            </div>
            <h4><i class="fas fa-balance-scale"></i> Poll
              <template v-if="poll.status === 'ELABORATION'">in elaboration phase</template>
              <template v-if="poll.status === 'VOTING'">in voting phase</template>
            </h4>
            <div style="padding: 10px">
              <timeline :height="60" :fillTo="new Date()" :events="getTimelineEvents(poll)"></timeline>
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
                    <li><span class="fa-li"><i class="far fa-user"></i></span>{{proposal.createdBy.profile.name}}</li>
                    <li><span class="fa-li"><i class="far fa-clock"></i></span>{{getFromNow(proposal.createdAt)}}</li>
                    <li><span class="fa-li"><i class="far fa-bookmark"></i></span>{{proposal.area.title}}</li>
                    <li><span class="fa-li"><i class="far fa-thumbs-up"></i></span>{{proposal.numSupporters}}</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>


        <h2 v-if="recentIdeas">Recently created ideas</h2>
        <p>Demo for law-panel</p>
        <law-panel v-for="idea in recentIdeas"
          :law="idea"
          :showTimeline="false">
        </law-panel>

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
              <i class="far fa-lightbulb "></i>
              Your idea
              <router-link :to="{ path: '/proposals/'+proposal.id }">'{{proposal.title}}'</router-link> reached its quorum.
              <!--
              You can now
              <router-link :to="{ path: '/createNewPoll', query: {proposalId: proposal.id} }">start a new poll</router-link> or
              <router-link :to="{ path: '/joinPoll', query: {proposalId: proposal.id} }">join an existing poll.</router-link>
              //-->
            </li>
            <li class="list-group-item item-condensed">
              ----
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
                <i class="far fa-lightbulb fa-2x"></i>
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
                <i class="far fa-lightbulb fa-2x"></i>
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
                <i class="far fa-lightbulb fa-2x"></i>
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
      recentIdeas: [],            // recently created ideas sorted by date desc
      reachedQuorum: [],          // ideas of this user that (recently) reached their quorum and became proposals
      openForVotingPolls: [],     // polls that are currently in the voting phase
	    supportedIdeasAndProps: []  // ideas and proposals that this user liked
    }
  },

  created () {
    this.loadRecentIdeas()

    this.$root.api.getReachedQuorumSince("2017-09-18").then(proposals => {
      this.reachedQuorum = proposals.slice(0,10)
    })

    this.$root.api.findSupportedBy(this.$root.currentUser, 'PROPOSAL').then(proposals => {
      this.supportedIdeasAndProps = proposals.slice(0,20)
    })

    this.$root.api.findPollsByStatus('VOTING').then(votingPolls => {
      this.openForVotingPolls = votingPolls
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    loadRecentIdeas: function() {
      this.$root.api.getRecentIdeas().then(recentIdeas => {
        this.recentIdeas = recentIdeas.slice(0,10)
      })
    },

    /*
    getTimelinePercentFilled(poll) {
      var daysUntilVotingStarts = this.$root.api.getGlobalProperty("liquido.days.until.voting.starts")     // number of days
      var durationOfVotingPhase = this.$root.api.getGlobalProperty("liquido.duration.of.voting.phase")     // also in days
      var durationInDays        = Number(daysUntilVotingStarts)+ Number(durationOfVotingPhase)
      var msSincePollCreated    = Date.now() - Date.parse(poll.createdAt)
      var percentFilled         = (msSincePollCreated / (durationInDays*24*3600*1000) )*100
      return percentFilled
    },
    */

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

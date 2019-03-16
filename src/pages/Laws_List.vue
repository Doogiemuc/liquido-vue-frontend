<template>
  <div class="container" id="UserHomePage">
    <div class="row">

      <!-- left column -->
      <div class="col-sm-6">
        <h2>Laws</h2>
        <law-list :laws="recentLaws" lawListTitle="Recent laws"></law-list>
      </div>

      <!-- right column -->
      <div class="col-sm-6">
        <h2>Your laws</h2>
        <law-list :laws="usersLaws" lawListTitle="Laws created by you"></law-list>

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
      recentLaws: [],         // proposals that recently became a law
      usersLaws: [],          // proposals created by the user that became a law
    }
  },

  computed: {
  },

  created () {
    this.$root.api.findByStatus("LAW").then(laws => {
      this.recentLaws = laws
    })
    this.$root.api.findByStatus("LAW").then(laws => {
      this.usersLaws = laws
    })
  },

  methods: {
    getFromNow(dateVal) {
      return moment(dateVal).fromNow();
    },

    loadRecentIdeas() {
      this.$root.api.getRecentIdeas().then(recentIdeas => {
        this.recentIdeas = recentIdeas.slice(0,10)
      })
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

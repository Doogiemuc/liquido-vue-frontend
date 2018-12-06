<template>
  <div class="container">

    <h1><i class="fas fa-balance-scale"></i> Sort proposals into your ballot</h1>

    <div class="panel panel-default">
      <div class="panel-body"">
        <p>You have {{untilVotingEnd}} left to cast your vote for this poll. Simply drag some proposals from the left into your ballot on the right. In LIQUIDO you do not just vote for or against one proposal. You sort proposals into your personally preferred order in your ballot. You
        do not have to drag all the proposals into your ballot. Just pick the ones you want to cast a vote for. And then sort them into your preferred order
        with the proposal that you like best at the top.</p>
        <timeline ref="pollTimeline" :height="80" :fillTo="new Date()" :events="timelineEvents"></timeline>
      </div>
    </div>

    <div id="castVoteButtonWrapper" class="pull-right"
      data-container="body" data-toggle="popover" data-placement="top" data-trigger="manual"
      data-content="Drag at least one proposal from the left into your ballot on the right.">
      <button type="button" id="castVoteButton" class="btn btn-primary btn-lg"
        v-bind:disabled="this.ballotIsEmpty"
        @click="clickCastVoteButton">
          Cast vote
      </button>
    </div>

    <table class="table pollTable">
      <tbody>
        <tr>
          <td width="49%" class="text-center">
            <h3>Proposals</h3>
            <p>These are the competing alternative proposals in this poll.</p>
          </td>
          <td width="2%"></td>
          <td width="49%" class="text-center">
            <h3>Your ballot</h3>
            <p>Sort your favorite proposal to the top.</p>
          </td>
        </tr>
        <tr>
          <td width="49%" id="leftContainer">

            <law-panel v-for="proposal in poll._embedded.proposals"
              :law="proposal"
              :showTimeline="false"
              :fixedHeight="100"
              :readOnly="true">
            </law-panel>

          </td>
          <td width="2%" class="middleColumn">
            <i class="fa fa-angle-double-right fa-4x" aria-hidden="true"></i>
          </td>
          <td width="49%" id="rightContainer">
            <div class="rightWrapper">
              <div v-if="ballotIsEmpty" class="rightDropHere">
                Drop proposals here!
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <button type="button" id="castVoteButtonBottom" class="btn btn-primary btn-lg pull-right" v-bind:disabled="this.ballotIsEmpty" @click="clickCastVoteButton">Cast vote</button>

  </div>
</template>

<script>
import LawPanel from '../components/LawPanel'
import timeline from '../components/Timeline'
import moment from 'moment'
import dragula from 'dragula'   // TODO: https://github.com/RubaXa/Sortable
import loglevel from 'loglevel'
 var log = loglevel.getLogger("Poll_CastVote");

export default {
  components: { LawPanel, timeline },

  props: {
    'pollId': { type: String, required: true }  // String is passed from url-param
  },

  data () {
    return {
      poll: { _embedded: { proposals: [] }},
      ballotIsEmpty: true,
      voterToken: "",
      checksum: "",
      loading: true,
      step1_status: 'loading',
      step2_status: 'dimmed',
      step3_status: 'dimmed',
      mainButton: "Processing ...",
      successMessage: "",
      errorMessage: "",
      errorMessageDetails: "",
    }
  },

  computed: {
    pollCreated()    { return moment(this.poll.createdAt).format('L') },
    votingStart()    { return moment(this.poll.votingStartAt).format('L') },
    votingEnd()      { return moment(this.poll.votingEndAt).format('L') },
    untilVotingEnd() { return moment().to(this.poll.votingEndAt, true) },  // e.g. "14 days"  (including the word days/minutes/seconds etc.)
    timelineEvents() {
      return [
        { date: new Date(this.poll.createdAt),     above: this.pollCreated, below: "Poll<br/>created" },
        { date: new Date(this.poll.votingStartAt), above: this.votingStart, below: "Voting</br>start" },
        { date: new Date(this.poll.votingEndAt),   above: this.votingEnd,   below: "Voting<br/>end" }
      ]
    },
    hideErrorMessage() { return this.errorMessage == "" },
  },

  created () {
    this.$root.api.getPoll(this.pollId).then(poll => {
      this.poll = poll
    })
  },

  mounted() {
    this.$nextTick(() => {
      var drake = dragula([document.getElementById('leftContainer'), document.getElementById('rightContainer')]);
      //console.log(drake, document.getElementById('test'))
      drake.on('drop', this.ballotDropped)
    })
    // Show a popover when button is disabled (needs some more CSS adaptions below)
    var that = this
    $('#castVoteButtonWrapper').popover()
    $('#castVoteButtonWrapper').hover(
      function() { if (that.ballotIsEmpty) $(this).popover('show') },
      function() { $(this).popover('hide') }
    )
  },

  methods: {
    getFromNow(dateVal) {
      return moment(dateVal).fromNow();
    },

    ballotDropped(el, target, source, sibbling) {
      //console.log("dropped onto target=", target, $('#rightContainer div.panel').length)
      this.ballotIsEmpty = $('#rightContainer div.panel').length == 0

    },

    /**
     * Cast vote for this VoteOrder
     */
    clickCastVoteButton() {
      var voteOrder = []        // get vote Order from #rightContainer as sorted by user
      $('#rightContainer div.lawPanel').each((idx, panel) => {
        voteOrder.push(panel.dataset.proposaluri)
      })
      log.info("clickCastVoteButton", this.poll.id, voteOrder)
      this.$router.push({ name: 'castVote', params: { pollId: this.poll.id, voteOrder: voteOrder }})
    }

  }

}
</script>

<style scoped>
  .pollTable td, .pollTable th {
    border: none;
  }
  .tableTitle {
    text-align: center;
    font-size: 20px;
  }
  .middleColumn {
    text-align: center;
    padding-top: 100px;
  }
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
  }
  .userPictureLeft {
    float: left;
    margin-right: 8px;
  }

  #castVoteButtonWrapper .btn[disabled] {
    /* don't let button block mouse events from reaching wrapper
       https://stackoverflow.com/questions/43651179/bootstrap-tooltip-on-disabled-button-workaround */
    pointer-events: none;
  }

  #leftContainer {
    min-height: 200px;
    background: #DDD;
  }

  #leftContainer div.panel,
  #rightContainer div.panel {
    cursor: move;
    cursor: grab;
    cursor: -moz-grab;
    cursor: -webkit-grab;
    transition: opacity 0.4s ease-in-out;
  }

  .gu-mirror {
    cursor: grabbing;
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
  }

  #rightContainer {
    border: 1px solid #DDD;
    background-color: rgba(255,255,232, 0.5);
  }

  .rightWrapper {
    position: relative;
    /*border: 1px solid green; */
  }

  .rightDropHere {
    z-index: -1;      /* in the background */
    width: 100%;
    position: absolute;
    text-align: center;
    color: #DDD;
    font-size: 2em;
    margin-top: 70px;
    padding-top: 20px;
    padding-bottom: 20px;
    border: 4px dashed #DDD;
    border-radius: 8px;
  }

  .stepTitle {
    padding-top: 3px;
  }

  .fa-li {
    left: -2.5em;
  }

  .fa-ul>li {
    margin-bottom: 2em;
  }

  .expandButton {
    float: right;
    color: #a94442;
  }

  #steps div.well {
    margin-bottom: 0;
  }

  .monspaceFont {
    font-family: monospace;
  }

</style>

/*
  BUGFIX: DOM content created with v-html are not affected by scoped styles, but you can still style them using deep selectors
  https://vue-loader.vuejs.org/guide/scoped-css.html
*/
<style>
 .roundedMessage {
    padding: 10px;
    border-radius: 4px;
  }

  .errorMessageDetails {
    font-size: 10px;
    font-family: monospace;
    overflow: scroll;
  }

  .dimmed {
    color: #EEE;
  }

  .red {
    color: red;
  }

  .green {
    color: green;
  }

</style>

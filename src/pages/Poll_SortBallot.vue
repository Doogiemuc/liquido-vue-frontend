<template>
  <div class="container">

    <h1><i class="fas fa-poll"></i> Sort proposals into your ballot</h1>

    <div class="panel panel-default">
      <div class="panel-body"">
        <p>In LIQUIDO you do not just vote for or against one proposal. Instead you sort proposals into your personally preferred order in your ballot. Simply drag some proposals from the left into your ballot on the right. You do not have to sort all the proposals into your ballot. You can just pick the ones you want to cast a vote for. Sort the proposals into your preferred order with the proposal that you like best at the top.</p>

        <div id="castVoteButtonWrapper" class="pull-right"
          data-container="body" data-toggle="popover" data-placement="top" data-trigger="manual"
          data-content="Drag at least one proposal from the left into your ballot on the right.">
          <button type="button" id="castVoteButton" class="btn btn-primary btn-lg"
            v-bind:disabled="this.ballotIsEmpty"
            @click="clickCastVoteButton">
              Cast vote <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>

    <table class="table pollTable">
      <tbody>
        <tr>
          <td width="49%" class="text-center">
            <h3>Proposals</h3>
            <p>These are the competing proposals in this poll.</p>
          </td>
          <td width="2%"></td>
          <td width="49%" class="text-center">
            <h3>Your ballot</h3>
            <p>Sort your favorite proposal to the top.</p>
          </td>
        </tr>
        <tr>
          <td width="49%" id="leftContainer">

            <law-panel v-for="proposal in notVotedForProposals"
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
            <div v-if="ballotIsEmpty" class="rightWrapper">
              <div class="rightInner">
                <div class="proposalPlaceHolder">
                  <h3>Slot 1</h3>
                  <p>Your most preferred proposal</p>
                </div>
                <div class="proposalPlaceHolder">
                  <h3>Slot 2</h3>
                  <p>Your next preferred proposal</p>
                </div>
                <div class="proposalPlaceHolder proposalPlaceHolderLast">
                  <h3>Slot 3</h3>
                  <p>Vote for as many proposals as you like.</p>
                </div>
              </div>

            </div>
            <!-- already voted for proposals -->
            <law-panel v-for="proposal in votedForProposals"
              :law="proposal"
              :showTimeline="false"
              :fixedHeight="100"
              :readOnly="true">
            </law-panel>
          </td>
        </tr>
      </tbody>
    </table>

    <button type="button" id="castVoteButtonBottom" class="btn btn-primary btn-lg pull-right" v-bind:disabled="this.ballotIsEmpty" @click="clickCastVoteButton">
      Cast vote <i class="fas fa-angle-double-right"></i>
    </button>

  </div>
</template>

<script>
import LawPanel from '../components/LawPanel'
//import timeline from '../components/Timeline'
import moment from 'moment'
import dragula from 'dragula'   // TODO: https://github.com/RubaXa/Sortable
import loglevel from 'loglevel'
 var log = loglevel.getLogger("Poll_CastVote");

export default {
  components: { LawPanel },

  props: {
    'pollId': { type: String, required: true },    // String is passed from url-param
    'voteOrder': { type: Array, required: false }  // optional array of proposals, if voter already has a ballot
  },

  data () {
    return {
      poll: undefined,
      voterToken: "",
      checksum: "",
      loading: true,
      ballotIsEmpty: true,    // cannot have this as computed prop, because it's hard to make it reactive
      step1_status: 'loading',
      step2_status: 'dimmed',
      step3_status: 'dimmed',
      mainButton: "Processing ...",
      //TODO: add AlertPanel for errors
    }
  },

  computed: {
    /*
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
    */
    /**
     * Get all proposals for the left container. That the user did not yet vote for.
     * @return subset of poll._embedded.proposals
     */
    notVotedForProposals() {
      if (!this.poll) return []
      if (!this.voteOrder) return this.poll._embedded.proposals
      var result = this.poll._embedded.proposals.filter(proposal => {
        return !this.voteOrder.some(votedForProp => proposal.id == votedForProp.id)
      })
      //console.log("notVotedForProposals result", result)
      return result
    },
    /**
     * Get all proposals for the right container. Empty or the list of proposals that the user already voted for.
     * We return proposal JSONs from poll._embedded.proposals, that we loaded from the backend, because they contain HATEOAS links.
    */
    votedForProposals() {
      if (!this.poll) return []  // reactive: only return something after poll is loaded
      if (!this.voteOrder) return []
      return this.poll._embedded.proposals.filter(proposal => {
        return this.voteOrder.some(votedForProp => proposal.id == votedForProp.id)   // return all elements from poll._embedded.proposals that are contained in the voteOrder with the same ID
      })
    },


  },

  /** reload the poll from poll Id */
  created () {
    this.$root.api.getPoll(this.pollId).then(poll => { this.poll = poll })
  },

  /** init "Dragula" the great drag'n'drop lib */
  mounted() {
    this.$nextTick(() => {
      var drake = dragula([document.getElementById('leftContainer'), document.getElementById('rightContainer')]);
      //console.log(drake, document.getElementById('test'))
      drake.on('drop', this.ballotDropped)
    })
    if (this.voteOrder && this.voteOrder.length > 0) this.ballotIsEmpty = false
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
      var voteOrderUris = []        // get voteOrderUris from #rightContainer as sorted by user
      $('#rightContainer div.lawPanel').each((idx, panel) => {
        voteOrderUris.push(panel.dataset.proposaluri)
      })
      log.info("Sorted Ballot in poll", this.poll.id, voteOrderUris)
      this.$router.push({ name: 'castVote', params: { pollId: this.poll.id, voteOrderUris: voteOrderUris }})
    }
  }

}
</script>

<style>
  body {
    overflow-y: scroll;
  }
  .lawFooterTable {
    background-color: transparent;
  }
</style>

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
    padding-top: 172px;
  }
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
  }

  #castVoteButtonWrapper .btn[disabled] {
    /* don't let button block mouse events from reaching wrapper
       https://stackoverflow.com/questions/43651179/bootstrap-tooltip-on-disabled-button-workaround */
    pointer-events: none;
  }

  #leftContainer {
    min-height: 200px;
    background: #CCC;
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
    min-height: 200px;
    border: 1px solid #DDD;
    background-color: #CCC;
  }

  .rightWrapper {
    position: relative;
  }

  .rightInner {
    position: absolute;
    width: 100%;
  }

  .proposalPlaceHolder {
    background: #f8f8f8;
    height: 182px;
    text-align: center;
    color: #CCC;
    padding-top: 10px;
    margin-bottom: 20px;
    /*border: 2px dashed #DDD;*/
    border-radius: 8px;
  }


  .rightInner:before {
    content:'';
    width:100%;
    height:100px;
    position: absolute;
    left:0;
    bottom:0;
    /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+0,ffffff+100&0+0,1+100 */
    /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+0,cccccc+100&0+0,1+100 */
    background: -moz-linear-gradient(top, rgba(255,255,255,0) 0%, rgba(204,204,204,1) 70%); /* FF3.6-15 */
    background: -webkit-linear-gradient(top, rgba(255,255,255,0) 0%,rgba(204,204,204,1) 70%); /* Chrome10-25,Safari5.1-6 */
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%,rgba(204,204,204,1) 70%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ffffff', endColorstr='#cccccc',GradientType=0 ); /* IE6-9 */
  }

  .ellipsis {
    color: ddd;
    text-align: center;
    color: #DDD;
    font-weight: bolder;
    font-size: 20pt;
    margin-top: 10px;
  }

</style>

/*
  BUGFIX: DOM content created with v-html are not affected by scoped styles, but you can still style them using deep selectors
  https://vue-loader.vuejs.org/guide/scoped-css.html
*/
</style>

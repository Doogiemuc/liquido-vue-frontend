<template>
  <div class="container">

    <h1><i class="fas fa-balance-scale"></i> Cast your vote</h1>
    
    <div class="panel panel-default">
      <div class="panel-body"">
        <p>You have {{untilVotingEnd}} left to cast your vote. Drag the proposals you want to vote for from the poll on the left into your ballot on the right.
        In Liquid Democracy you do not just vote for or against a proposal, but you sort the proposals into your preferred order.</p>
        <timeline :height="80" :percentFilled="timelinePercentFilled" :events="timelineEvents"></timeline>
      </div>
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
          
            <law-panel v-for="proposal in proposals" 
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

    <button type="button" class="btn btn-primary btn-lg pull-right" v-bind:disabled="this.ballotIsEmpty" @click="castVote()">Cast vote</button>
    
  </div>
</template>

<script>
import LawPanel from '../components/LawPanel'
import timeline from '../components/Timeline'
import moment from 'moment'
import dragula from 'dragula'

// import bootbox from 'bootbox'

export default {
  components: { LawPanel, timeline }, 

  props: {
    'pollId': { type: String, required: true }
  },

  data () {
    return {
      poll: {},
      proposals: [],
      ballotIsEmpty: true
    }
  },

  computed: {
    pollCreated() { return moment(this.poll.createdAt).format('L') },
    votingStart() { return moment(this.poll.votingStartAt).format('L') },
    votingEnd()   { return moment(this.poll.votingEndAt).format('L') },
    untilVotingEnd() { return moment().to(this.poll.votingEndAt, true) },  // e.g. 14 days
    votingEndsAt() { return moment(this.proposals[0].votingEndsAt).format('L') },
    timelinePercentFilled() { return 30 },      // TODO: make timeline specific to polls and laws
    timelineEvents() {
      return [ 
        { percent: "0",  above: this.pollCreated, below: "Poll<br/>created" },
        { percent: "50", above: this.votingStart, below: "Voting</br>start" },
        { percent: "95", above: this.votingEnd, below: "Voting<br/>end" }
      ]
    },
  },
  
  //TODO: Can I do this in created()  ????
  mounted () {
    this.$root.api.noCacheForNextRequest()
    this.$root.api.getPoll(this.pollId).then(poll => { 
      this.poll = poll
      this.proposals = poll._embedded.proposals
      //this.votingEndsAtLoc = moment(this.proposals[0].votingEndsAt).format('L')
      this.$nextTick(() => {
        var drake = dragula([document.getElementById('leftContainer'), document.getElementById('rightContainer')]);
        //console.log(drake, document.getElementById('test'))
        drake.on('drop', this.ballotDropped)
      })
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    ballotDropped: function(el, target, source, sibbling) {
      //console.log("dropped onto target=", target, $('#rightContainer div.panel').length)
      this.ballotIsEmpty = $('#rightContainer div.panel').length == 0
    },

    castVote: function(evt) {
      //var password = prompt("Please enter your Liquido password to anonymize your vote.") 
      var pollURI = this.poll._links.self.href   
      var voteOrder = []
      $('#rightContainer div.panel').each((idx, panel) => {
        //console.log(panel.dataset.proposaluri)
        voteOrder.push(panel.dataset.proposaluri)
      })

      var newBallot = {
        "poll": pollURI,
        "voteOrder": voteOrder
      }

      console.log("castVote", newBallot)
      this.$root.api.postBallot(newBallot)
        .then(res =>  { 
        	console.log("Ballot posted successfully")
        	swal({
        		title: "Ballot saved successfully",
        		text:  "Your vote has been cast and your ballot was saved.\n\n"+
        		       "You can still change the sorting insinde your ballot as long as the poll is running.",
        		type:  "success"
        	})
        })
        .catch(err => { console.error("Cannot postBallot: "+err) })
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


  


</style>

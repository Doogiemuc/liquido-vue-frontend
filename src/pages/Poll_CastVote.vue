<template>
  <div class="container">

    <h1><i class="fas fa-balance-scale"></i> Cast your vote</h1>
    
    <div class="panel panel-default">
      <div class="panel-body"">
        <p>You have {{untilVotingEnd}} left to cast your vote for this poll. Drag the proposals you want to vote for from the left into your ballot on the right.
        In Liquid Democracy you do not just vote for or against a proposal, you can sort proposals into your preferred order in your ballot.</p>
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

    <button type="button" class="btn btn-primary btn-lg pull-right" v-bind:disabled="this.ballotIsEmpty" @click="showCastVoteWizard()">Cast vote</button>
    
    <!-- Get token - modal popup - wizard with two steps -->
    <div id="castVoteWizard" class="modal fade" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title">Cast your vote - Get Token</h4>
          </div>
          <div class="modal-body">

            <div id="step1">
              <p>Every vote is casted anonymously. Therefore we need to get you a 'voter token' from the server.
                This token is a secret that belongs to you only. You get a voter token for each category.
                You do not need to remember all these tokens. We can fetch them every time when you cast a vote.</p>
              <p>Therefore we ask for your password in this step:</p>
              
              <form class="form-inline text-center">
                <div class="form-group">
                  <input type="password" class="form-control" id="userPasswordInputId" v-model="userPassword">
                </div>
              </form>
            </div>

            <div id="step2" class="hidden">
              <p>Your voterToken for category '{{this.poll.area.title}}' is: {{areaToken}}</p>

            </div>

            <div id="errorStep" class="hidden">
              Ther was an error when casting your vote. Please try again later.
            </div>
            
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" :class="{disabled: !isPasswordFilled}" @click="getVoterToken">Get Voter Token</button>
          </div>
        </div><!-- /.modal-content -->
      </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->


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
    'pollId': { type: String, required: true }
  },

  data () {
    return {
      poll: {},
      proposals: [],
      ballotIsEmpty: true,
      userPassword: "",
      areaToken: undefined
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
    isPasswordFilled() { return this.userPassword !== "" && this.userPassword.trim() !== "" && this.userPassword.length > 3 },
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
    //TODO: load aready saved ballot, if any
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
     * Cast a vote
     * See docs/CastVote.png for a UML sequence diagram of this flow.
     * 1) Get a voterToken for this area.  Need to ask user for his password
     * 2) Then anonoumusly(!) cast the vote with this token.
     */
    showCastVoteWizard(evt) {
      $('#castVoteWizard').modal('show')
    },

    getVoterToken() {
      log.debug("getVoterToken(area.title="+this.poll.area.title+")")
      this.$root.api.getVoterToken(this.poll.area)
        .then(res => { this.areaToken = res.areaToken })
        .catch(err => { 
          console.error("Cannot postBallot: "+err) 
          $('#step1').addClass("hidden")
          $('#step2').addClass("hidden")
          $('#step2').removeClass("hidden")
        })
    },


      /*

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
        	console.log("Ballot posted successfully", res)
        	swal({
        		title: "Ballot saved successfully",
        		text:  "Your vote has been cast and your ballot was saved.\n\n"+
        		       "You can still change the sorting insinde your ballot as long as the poll is running.",
        		type:  "success"
        	})
        })
        .catch(err => { console.error("Cannot postBallot: "+err) })

      */
    
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

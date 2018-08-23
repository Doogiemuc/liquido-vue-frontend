<template>
  <div class="container">

    <h1><i class="fas fa-balance-scale"></i> Cast your vote</h1>
    
    <div class="panel panel-default">
      <div class="panel-body"">
        <p>You have {{untilVotingEnd}} left to cast your vote for this poll. Drag the proposals you want to vote for from the left into your ballot on the right.
        In Liquid Democracy you do not just vote for or against a proposal, you can sort proposals into your preferred order in your ballot.</p>
        <timeline ref="pollTimeline" :height="80" :fillTo="new Date()" :events="timelineEvents"></timeline>
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

    <button type="button" id="castVoteButton" class="btn btn-primary btn-lg pull-right" v-bind:disabled="this.ballotIsEmpty" @click="clickCastVoteButton">Cast vote</button>
    
    <!-- Cast vote - modal popup - wizard with steps -->
    <div id="castVoteModal" class="modal fade" tabindex="-1" role="dialog" data-backdrop="static" data-keyboard="false">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">Cast your vote</h4>
          </div>
          <div class="modal-body">

            <div id="steps">
              <ol class="fa-ul">
                <li>
                  <span v-show="step1_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
                  <span v-show="step1_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
                  <span v-show="step1_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
                  <p class="stepTitle">Fetch your voterTokens</p>
                  <textarea class="form-control monspaceFont" readonly="true">{{voterTokensStr}}</textarea>
                  <small>These tokens are your digital right to vote. The first token is your own one. You may receive further tokens,
                    if others delegated their vote to you as their proxy. You do not need to remember these tokens. They can
                    be fetched again everytime you vote. These tokens are confidential! Do not share them!
                  </small>
                </li>
                <li>
                  <span v-show="step2_status === 'dimmed'"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
                  <span v-show="step2_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
                  <span v-show="step2_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
                  <span v-show="step2_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
                  <p class="stepTitle">Anonymously cast your vote</p>
                  <textarea class="form-control" readonly="true">{{checksumsStr}}</textarea>
                  <small>You can validate that your vote was counted correctly with this anonymous checksum. There will be one
                    checksum for each token. Your checksum(s) should appear on the poll's public list of ballots. These values are confidential. Do not share them!
                  </small>
                </li>
                <li>
                  <span v-show="step3_status === 'dimmed'"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
                  <span v-show="step3_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
                  <span v-show="step3_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
                  <span v-show="step3_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
                  <p class="stepTitle">Your vote was counted successfully</p>
                </li>
              </ol>
            </div>

            <div id="errorMessage" :class="{ invisible: hideErrorMessage }" class="panel panel-danger"> 
              <div class="panel-heading"> 
                <h4 class="panel-title">
                  <i class='fas fa-exclamation-circle red'></i> {{errorMessage}}
                  <div class="expandButton" v-on:click="toggleCollapse">
                    <i class="fas fa-caret-down"></i>
                  </div>
                </h4>
              </div> 
              <div class="panel-body errorMessageDetails collapse" id="errorMessageDetails">
                {{errorMessageDetails}} 
              </div> 
            </div>
            
          </div>
          <div class="modal-footer">
            <button v-if="loading" type="button" class="btn btn-default pull-left" @click="clickModalCancel">Cancel</button>
            <button type="button" class="btn btn-primary" :class="{disabled: loading}" @click="clickModalMain">{{mainButton}}</button>
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
      poll: { _embedded: { proposals: [] }},
      ballotIsEmpty: true,
      voterTokens: [],
      checksums: [],
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

    voterTokensStr()   { return Array.isArray(this.voterTokens) ? this.voterTokens.join(",\n") : "" },
    checksumsStr()     { return Array.isArray(this.checksums) ? this.checksums.join(",\n") : "" },
    hideErrorMessage() { return this.errorMessage == "" },
  },
  
  created () {
    this.$root.api.noCacheForNextRequest()
    this.$root.api.getPoll(this.pollId).then(poll => { 
      this.poll = poll
    })
    //TODO: load aready saved ballot, if any, and then show to user that he already voted
  },

  mounted() {
    this.$nextTick(() => {
      var drake = dragula([document.getElementById('leftContainer'), document.getElementById('rightContainer')]);
      //console.log(drake, document.getElementById('test'))
      drake.on('drop', this.ballotDropped)
    })
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
    clickCastVoteButton() {
      this.loading = true
      $('#castVoteModal').modal('show')
      this.DelayPromise(1000)()
        .then(this.getVoterTokens)
        .then(this.castVote)
        .then(res => {
          this.loading = false
          this.mainButton = "Ok"
        })
        .catch(err => {
          this.loading = false
          this.mainButton = "Close"
          if (!this.errorMessage) this.errorMessage = "Could not cast your vote. Please try again later."
          if (!this.errorMessageDetails) this.errorMessageDetails = JSON.stringify(err)
        })
    },

    clickModalMain() {
      if (this.loading) return
      $('#castVoteModal').modal('hide')
      if (this.step3_status === "success") {
        this.$root.$router.push('/polls/'+this.poll.id)
      }
      this.resetModal()
    },

    clickModalCancel() {
      $('#castVoteModal').modal('hide')
      //TODO: cancel voting process.
      this.resetModal()
    },

    getVoterTokens() {
      this.step1_status = " loading"
      return this.$root.api.getVoterTokens(this.poll.area.id)
        .then(voterTokens => {
          this.voterTokens = voterTokens 
          this.step1_status = "success"
          return voterTokens
        })
        .catch(err => {
          log.error("Could not getVoterTokens", err)
          //old version $('#spinner1').removeClass('fa-spin').removeClass('grey').addClass('red').removeClass('fa-spinner').addClass('fa-times')
          this.step1_status = 'error', 
          this.errorMessage = "Could not fetch your voterTokens!"
          this.errorMessageDetails = JSON.stringify(err)
          this.mainButton = "Close"
          return Promise.reject(this.errorMessage)
        })
    },

    castVote(voterTokens) {
      this.step2_status = "loading"
      var voteOrder = []        // get vote Order from #rightContainer as sorted by user
      $('#rightContainer div.panel').each((idx, panel) => {
        voteOrder.push(panel.dataset.proposaluri) 
      })
      return this.$root.api.castVote(this.poll, this.voterTokens, voteOrder)
        .then(res => {
          this.checksums = res.checksums
          this.step2_status = "success"
          this.step3_status = "success"
          this.mainButton = "Ok"
          return this.checksums
        })
        .catch(err => {
          log.error("Could not castVote", err)
          this.step2_status = 'error', 
          this.errorMessage = "Could not cast your vote. Please try again later."
          this.errorMessageDetails = JSON.stringify(err)
          this.mainButton = "Close"
          return Promise.reject(this.errorMessage)
        })
    },

    resetModal() {
      this.voterTokens = []
      this.checksums = []
      this.loading = true
      this.step1_status = 'loading'
      this.step2_status = 'dimmed'
      this.step3_status = 'dimmed'
      this.mainButton = "Processing ..."
      this.successMessage = ""
      this.errorMessage = ""
      this.errorMessageDetails = ""
    },

    /**
     * Wait for some millisconds in a promise chain
     * @see    https://blog.raananweber.com/2015/12/01/writing-a-promise-delayer/ 
     * @param  delay in milliseconds
     * @return A function that accepts one "data" variable.
     *         This function in turn returns a promise that will resolve with that data after delay milliseconds
     */
    DelayPromise(delay) {  
      //return a function that accepts a single variable
      return function(data) {
        //this function returns a promise.
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            //a promise that is resolved after "delay" milliseconds with the data provided
            resolve(data)
          }, delay)
        })
        //This could also be written like this :-)
        // return new Promise(resolve => setTimeout(data => resolve(data), delay));
      }
    },

    /**
     * open or collapse errorMessageDetails
     * And toggle the expand/collapse icon   (Needs some fontawesome SVG magic *G*)
     */
    toggleCollapse(evt) {
      $('#errorMessageDetails').collapse('toggle')
      $(evt.currentTarget)
        .find('[data-fa-i2svg]')
        .toggleClass('fa-caret-up')
        .toggleClass('fa-caret-down');
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

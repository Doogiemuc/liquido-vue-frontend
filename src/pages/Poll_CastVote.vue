<template>
  <div class="container">

    <h1><i class="fas fa-balance-scale"></i> Cast your vote</h1>

    <div class="panel panel-default">
      <div class="panel-heading">
        <h4>Your ballot</h4>
      </div>
      <div class="panel-body"">
        <ol>
          <li v-for="proposal in voteOrderProposals">"{{proposal.title}}" by {{proposal.createdBy.email}}</li>
        </ol>
      </div>
    </div>


    <!-- Cast vote - wizard with steps -->
    <div id="castVotePanel" class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">Step 1 - Fetch your voter token</h3>
      </div>
      <div class="panel-body">
        <div id="steps">
          <ol class="fa-ul">
            <li>
              <span v-show="step2_status === 'dimmed'"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
              <span v-show="step1_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
              <span v-show="step1_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
              <span v-show="step1_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
              <p class="stepTitle">Fetch your voterToken</p>
              <div class="well well-sm monspaceFont">{{voterToken}}</div>
              <small>This voterToken is the digital representation of your right to vote. With this token your ballot will be casted <b>anonymously</b>
                You do not need to remember this token. It can be fetched again whenever needed. This token is <b>confidential!</b> Do not share it!
              </small>
            </li>

            <button type="button" id="fetchVoterTokenButton" class="btn btn-primary" @click="fetchVoterToken">Fetch voter token</button>

            <li>
              <span v-show="step2_status === 'dimmed'"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
              <span v-show="step2_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
              <span v-show="step2_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
              <span v-show="step2_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
              <p class="stepTitle">Anonymously cast your ballot</p>
              <div class="well well-sm monspaceFont">{{checksum}}</div>
              <small>You can validate that your ballot was counted correctly with this anonymous checksum. Your checksum should appear on the poll's public list of ballots. The checksum is also confidential. Do not share it!
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
    </div><!-- /.panel -->

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
    'pollId':    { type: Number, required: true },  // Nummbe is passed via named route params
    'voteOrder': { type: Array,  required: true }
  },

  data () {
    return {
      poll: { _embedded: { proposals: [] }},
      voteOrderProposals: [],
      voterToken: "",
      checksum: "",
      loading: true,
      step1_status: 'dimmed',
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

      // Get proposals from URIs in pased voteOrder[]
      var proposalsByURI = {}
      poll._embedded.proposals.forEach(proposal => {
        var uri = this.$root.api.getURI(proposal)
        proposalsByURI[uri] = proposal
      })
      for(var i = 0; i < this.voteOrder.length; i++) {
        this.$set(this.voteOrderProposals, i, proposalsByURI[this.voteOrder[i]])
      }
      log.debug("voteOrderProposals", this.voteOrderProposals)
    })
    .then(() => {
       this.$root.api.getPublicChecksum(this.poll.area, this.$root.currentUser).then(publicChecksum => {
        log.debug("publicProxyChecksum", publicChecksum)
      })
    })


    //TODO: check for pending delegations


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
      log.info("Starting to cast the vote.")
      $('#castVoteModal').modal('show')
      this.DelayPromise(1000)()
        .then(this.fetchVoterToken)
        .then(this.castVote)
        .then(res => {
          //MAYBE: larger ok animation, e.g. zooming fading green checkmark
          this.loading = false
          this.mainButton = "Ok"
        })
        .catch(err => {
          log.error("Error while casting the vote", err)
          this.loading = false
          this.mainButton = "Close"
          console.log("clickCastVoteButton.errorMessageDetails", this.errorMessageDetails)

          if (!this.errorMessage) this.errorMessage = "Could not cast your vote. Please try again later. clickCastVoteButton"
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

    fetchVoterToken() {
      this.step1_status = " loading"
      return this.$root.api.getVoterToken(this.poll.area.id)
        .then(voterToken => {
          this.voterToken = voterToken
          this.step1_status = "success"
          return voterToken
        })
        .catch(err => {
          log.error("Could not getVoterToken", err)
          //old version $('#spinner1').removeClass('fa-spin').removeClass('grey').addClass('red').removeClass('fa-spinner').addClass('fa-times')
          this.step1_status = 'error',
          this.errorMessage = "Could not fetch your voterToken!"
          this.errorMessageDetails = JSON.stringify(err)
          this.mainButton = "Close"
          return Promise.reject(this.errorMessage)
        })
    },

    castVote(voterToken) {
      this.step2_status = "loading"
      var voteOrder = []        // get vote Order from #rightContainer as sorted by user
      $('#rightContainer div.lawPanel').each((idx, panel) => {
        voteOrder.push(panel.dataset.proposaluri)
      })
      return this.$root.api.castVote(this.poll, voteOrder, voterToken)
        .then(res => {
          this.checksum = res.checksum
          this.step2_status = "success"
          this.step3_status = "success"
          this.mainButton = "Ok"
          return this.checksum
        })
        .catch(err => {
          log.error("Could not castVote", err)
          this.step2_status = 'error',
          this.errorMessage = "Could not cast your vote. Please try again later XXX castVote."
          this.errorMessageDetails = JSON.stringify(err)
          this.mainButton = "Close"
          console.log("castVote.errorMessageDetails", this.errorMessageDetails)

          return Promise.reject(this.errorMessage)
        })
    },

    resetModal() {
      this.voterToken = ""
      this.checksum = ""
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
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
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

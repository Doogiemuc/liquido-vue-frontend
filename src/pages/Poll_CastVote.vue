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

    <!-- Cast vote - Step 1 - Fetch voter token -->
    <div id="getVoterTokenPanel" class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">Fetch your voter token</h3>
      </div>
      <div class="panel-body">
        <ul class="fa-ul">
          <li>
            <span v-show="step1_status === 'dimmed'"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
            <span v-show="step1_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
            <span v-show="step1_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
            <span v-show="step1_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>

            <p>A voter token is the digital representation of your right to vote. With this token your ballot can be casted <b>anonymously.</b>
              This token is <b>confidential!</b> Do not share it!</p>

            <!--input type="text" class="form-control" name="tokenSecret" id="tokenSecretInput" v-model="tokenSecret" placeholder="tokenSecret"></input -->

            <div class="well well-sm monspaceFont">{{voterToken || '&nbsp;'}}</div>

            <button type="button" id="fetchVoterTokenButton" class="btn btn-primary" @click="fetchVoterToken" :disabled="step1_status === 'loading'">
              Fetch voter token
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="numDelReq > 0 || delegationRequestsAccepted > 0" class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">Delegation requests</h3>
      </div>
      <div class="panel-body">
        <ul class="fa-ul">
          <li>
            <span v-show="step2_status === 'dimmed'"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
            <span v-show="step2_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
            <span v-show="step2_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
            <span v-show="step2_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
            <p v-if="numDelReq == 1">
              A voter would like to delegate his vote to you as his proxy. Do you want to accept this request?
              Your vote would then count two times. This voter will be able to see how you voted. But only him because you are his proxy.
            </p>
            <p v-if="numDelReq > 1">{{numDelReq}} voters would like to delegate their votes to you.
              Do you want to accept these requests? These voters will be able to see how you voted. But only them because you are their proxy.
              Your vote would then count {{areaData.numVotes + numDelReq}} times. (Including your own vote.)
            </p>
            <button v-if="numDelReq > 0" type="button" id="acceptDelegationRequestButton" class="btn btn-primary" @click="acceptDelegationRequests">
              Accept delegation requests
            </button>
            <p v-if="delegationRequestsAccepted > 0">Accepted {{delegationRequestsAccepted}} delegation requests. You are now a proxy for {{delegationRequestsAccepted}} more voters. Your vote as a proxy will now count {{numVotes}} times in total.</p>
          </li>
        </ul>
      </div>
    </div><!-- /.panel -->

    <div class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">Anonymously cast your vote</h3>
      </div>
      <div class="panel-body">
        <div id="steps">
          <ul class="fa-ul">
            <li>
              <span v-show="step3_status === 'dimmed'"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
              <span v-show="step3_status === 'loading'" class="fa-li"><i class="fas fa-2x fa-spinner grey fa-spin"></i></span>
              <span v-show="step3_status === 'error'"   class="fa-li"><i class="fas fa-2x fa-times red"></i></span>
              <span v-show="step3_status === 'success'" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
              <p>Here we cast you vote completely anonymously. <span v-if="numVotes > 1">Your vote will count {{numVotes}} times (including your own vote)</span> When your ballot was counted successfully, the server will return a checksum. You can validate that your ballot was counted correctly with this anonymous checksum. Your checksum should appear on the poll's public list of ballots. This checksum is also confidential. Do not share it!</p>
              <div class="well well-sm monspaceFont">{{checksum || '&nbsp;'}}</div>
              <button type="button" id="castVoteButton" class="btn btn-primary" @click="castVote" :disabled="disableCastVoteButton">
                Cast vote anonymously
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div><!-- /.panel -->



    <button v-if="step3_status === 'success'" type="button" id="gotoPollButton" class="btn btn-primary" @click="goToPoll">
      Go to poll <i class="fas fa-angle-double-right"></i>
    </button>

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
    'pollId':        { type: Number, required: true },  // Nummbe is passed via named route params
    'voteOrderUris': { type: Array,  required: true }
  },

  data () {
    return {
      poll: { _embedded: { proposals: [] }},
      voteOrderProposals: [],
      isPublicProxy: false,
      directProxy: undefined,
      topProxy: undefined,
      voterToken: "",
      numVotes: 1,
      checksum: "",
      step1_status: 'dimmed',
      step2_status: 'dimmed',
      step3_status: 'dimmed',
      successMessage: "",
      errorMessage: "",
      errorMessageDetails: "",
      delegationRequests: [],
      delegationRequestsAccepted: 0,
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
    disableCastVoteButton() {
      return this.step1_status !== 'success' ||
             this.step1_status === 'loading' ||
             this.step2_status === 'loading' ||
             this.step3_status === 'loading' ||
             this.step3_status === 'success'
    },
    numDelReq() { return this.delegationRequests.length },
  },

  created () {
    this.$root.api.getPoll(this.pollId).then(poll => {
      // Get proposals(as JSON) from pased voteOrderUris[]
      this.poll = poll
      var proposalsByURI = {}
      poll._embedded.proposals.forEach(proposal => {
        var uri = this.$root.api.getURI(proposal)
        proposalsByURI[uri] = proposal
      })
      for(var i = 0; i < this.voteOrderUris.length; i++) {
        this.$set(this.voteOrderProposals, i, proposalsByURI[this.voteOrderUris[i]])
      }
      //log.debug("voteOrderProposals", this.voteOrderProposals)
    })
    // Cannot fetch numVotes yet. Need voterToken

  },

  methods: {
    getFromNow(dateVal) {
      return moment(dateVal).fromNow();
    },

    /**
     * Fetch the voter token for  voter in this area. Voter may set a flag to become a public proxy.
     * If an error appears then we show an error message with expandable error details.
     */
    fetchVoterToken() {
      log.info("Starting to cast the vote.")
      this.step1_status = "loading"
      return this.$root.api.getVoterToken(this.poll.area.id, process.env.tokenSecret, false)  // do not automatically become a proxy here
        .then(res => {
          this.voterToken = res.voterToken
          this.numVotes   = res.numVotes
          this.step1_status = "success"
          return this.voterToken
        })
        .catch(err => {
          log.error("Could not getVoterToken", err)
          this.step1_status = 'error',
          this.errorMessage = "Could not fetch your voterToken!"
          this.errorMessageDetails = JSON.stringify(err)
          return Promise.reject(this.errorMessage)
        })
    },

    acceptDelegationRequests() {
      this.step2_status = "loading"
      return this.$root.api.acceptDelegationRequests(this.poll.area, this.voterToken).then(res => {
        this.delegationRequestsAccepted = this.delegationRequests.length
        this.numVotes = res.numVotes
        this.delegationRequests = []
        this.step2_status = "success"
        log.info("Proxy accepted "+this.delegationRequestsAccepted+" delegation requests and now has "+this.numVotes+" votes");
      })
      .catch(err => {
        log.error("Could not accept delegation requests", err)
        this.step2_status = 'error',
        this.errorMessage = "Could not accept delegation requests."
        this.errorMessageDetails = JSON.stringify(err)
        return Promise.reject(this.errorMessage)
      })
    },

    castVote() {
      this.step3_status = "loading"
      return this.$root.api.castVote(this.poll, this.voteOrderUris, this.voterToken)
        .then(res => {
          this.checksum = res.checksum
          this.step3_status = "success"
          log.info("Vote for poll.id="+this.poll.id+" casted successfully.")
          return this.checksum
        })
        .catch(err => {
          log.error("Could not castVote", err)
          this.step3_status = 'error',
          this.errorMessage = "Could not cast your vote. Please try again later."
          this.errorMessageDetails = JSON.stringify(err)
          return Promise.reject(this.errorMessage)
        })
    },

    goToPoll() {
      this.$router.push('/polls/'+this.poll.id)
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

  .fa-li {
    left: -2.5em;
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

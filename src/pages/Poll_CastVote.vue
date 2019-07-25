<template>
  <div class="container">

    <h1><i class="fas fa-balance-scale"></i> Cast your vote</h1>

    <div class="panel panel-default">
      <div class="panel-heading">
        <h4>Your ballot (with proposals as sorted by you)</h4>
      </div>
      <div class="panel-body ballot-body">
        <ol>
          <li v-for="proposal in voteOrderProposals" :key="proposal.id">"{{proposal.title}}" <span class="grey">by {{proposal.createdBy.profile.name}} &lt;{{proposal.createdBy.email}}&gt;</span></li>
        </ol>
      </div>
    </div>

	<p>&nbsp;</p>

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

            <button type="button" id="fetchVoterTokenButton" class="btn btn-primary" @click="fetchVoterToken" :disabled="disableFetchVoterTokenButton">
              Fetch voter token<span v-if="step1_status === 'success'">&nbsp;<i class="fas fa-check-circle"></i></span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="delegationCount > 0 || numDelReq > 0" class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">Delegations to you as a proxy</h3>
      </div>
      <div class="panel-body">
        <ul class="fa-ul">
          <li>
            <span v-show="numDelReq > 0"  class="fa-li"><i class="fas fa-2x fa-check-circle dimmed"></i></span>
            <span v-show="numDelReq === 0" class="fa-li"><i class="fas fa-2x fa-check-circle green"></i></span>
            <p v-if="numDelReq == 1">
              A voter would like to delegate his vote to you as his proxy. Do you want to accept this request?
              Your vote would then count two times. This voter will be able to see how you voted. But only him because you are his proxy.
            </p>
            <p v-if="numDelReq > 1">{{numDelReq}} voters would like to delegate their right to vote to you.
              Do you want to accept these requests? These voters would then be able to see how you voted. But only them because you are their proxy.
              Your vote would then count {{delegationCount + numDelReq + 1}} times (including your own vote).
            </p>
            <button v-if="numDelReq > 0" type="button" id="acceptDelegationRequestButton" class="btn btn-primary" @click="acceptDelegationRequests">
              Accept delegation requests
            </button>
            <p v-if="delegationCount == 1">You are the proxy for one voter. Your vote will also create a ballot for this delegee.</p>
            <p v-if="delegationCount >  1">You are the proxy for {{delegationCount}} voters. Your vote will also create ballots for these delegees.</p>
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
              <p>Here we cast you vote completely anonymously. When your ballot was counted successfully, the server will return a checksum. You can validate that your ballot was counted correctly with this anonymous checksum. Your checksum should appear on the poll's public list of ballots. Do not reveal that this is <em>your</em> checksum!</p>
              <div class="well well-sm monspaceFont">{{checksum || '&nbsp;'}}</div>
              <button type="button" id="castVoteButton" class="btn btn-primary" @click="castVote" :disabled="disableCastVoteButton">
                Cast vote anonymously<span v-if="step3_status === 'success'">&nbsp;<i class="fas fa-check-circle"></i></span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div><!-- /.panel -->



    <button v-if="step3_status === 'success'" type="button" id="gotoPollButton" class="btn btn-primary pull-right" @click="goToPoll">
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
    // pollId is passed as a Number from named route params.
    // If Poll_CastVote would be called via URL, then pollId would be a String and Vue's validation would fail. This is what we want. Poll_CastVoute page should not be opened directly.
    'pollId':        { type: Number, required: true },
    'voteOrderUris': { type: Array,  required: true }   // MUST pass voteOrder
  },

  data () {
    return {
      poll: { _embedded: { proposals: [] }},
      voteOrderProposals: [],
      isPublicProxy: false,
      directProxy: undefined,
      topProxy: undefined,
      voterToken: "",
      delegationCount: 0,
      checksum: "",
      voteCount: undefined,
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
    hideErrorMessage() { return this.errorMessage == "" },
    disableFetchVoterTokenButton() {
      return this.step1_status === 'success' ||
             this.step1_status === 'loading'
    },
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
    // Cannot fetch delegations yet. Need voterToken

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
      return this.$root.api.getVoterToken(this.poll.area, process.env.tokenSecret, false)  // do not automatically become a proxy here
        .then(res => {
          console.log("got voterToken", res)
          this.voterToken         = res.voterToken
          this.delegationCount    = res.delegationCount    // overall recursive count of delegations
          this.delegationRequests = res.delegationRequests
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
        this.delegationCount = res.delegationCount
        this.delegationRequests = []
        this.step2_status = "success"
        log.info("Proxy accepted "+this.delegationRequestsAccepted+" delegation requests and now has "+this.delegationCount+" delegations");
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
          this.voteCount = res.voteCount
          this.step3_status = "success"
          log.info("Vote for poll.id="+this.poll.id+" casted successfully.")

          swal({
            title: "SUCCESS",
            text: "Your vote was casted successfully.",
            type: "success"
          },
          function () {
            //that.$router.push('/userHome')
          })

          /*
          iziToast.success({
            title: 'Success',
            message: "Your vote was casted successfully."
          })
          */
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

  .ballot-body {
    background-color: #F9F9F9;
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

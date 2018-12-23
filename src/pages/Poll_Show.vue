<!--
	Page that shows one poll.
	If a user has proposals in elaboration (that are not yet part of any poll)
	then he can join this poll.
-->

<template>
  <div class="container">
		<h1><i class="fas fa-poll"></i>
			<template v-if="poll.status === 'ELABORATION'">Poll in elaboration phase</template>
			<template v-if="poll.status === 'VOTING'">Poll in voting phase</template>
			<template v-if="poll.status === 'FINISHED'">Finished Poll</template>
		</h1>

		<div v-if="poll.status == 'VOTING'" class="panel panel-default">
	    <div class="panel-body"">
	      <p>The voting phase of this poll has started. There are {{untilVotingEnd}} left until the voting phase will close.</p>
	      <timeline ref="pollTimeline" :height="80" :fillTo="new Date()" :events="timelineEvents"></timeline>
	      <router-link :to="{ path: '/polls/'+poll.id+'/sortBallot' }" id="goToCastVoteButton" role="button" class="btn btn-primary btn-lg pull-right">
					Cast vote <i class="fas fa-angle-double-right"></i>
				</router-link>
				<p>If you already voted in this poll, then you can <a href="#" @click="getOwnBallot">check your ballot.</a></p>
	    </div>
	  </div>

		<div v-if="poll.status == 'FINISHED'" class="panel panel-default">
	    <div class="panel-body"">
	      <p>This poll is finished. The winning proposal is now a law.</p>
				<timeline ref="pollTimeline" :height="80" :fillTo="new Date()" :events="timelineEvents"></timeline>
	    </div>
	  </div>

	  <div v-if="poll.status == 'VOTING'" class="panel panel-default">
	  	<div class="panel-heading">
	  		<h4>Your info for this area</h4>
	  	</div>
	  	<div class="panel-body"">
	  		<ul>
	  			<li v-if="isPublicProxy">You already are a public proxy in this area. Voters can immideatly delegate their vote to you.</li>
	  			<li v-else="isPublicProxy">You are not yet a public proxy in this area. Voters can not yet delegate their vote to you. Do you want to
	  				<a href="#" @click="becomePublicProxy">become a public proxy</a>?
	  			</li>
	  			<li v-if="delegationRequests.length > 0">{{delegationRequests.length}} voters would like to delegate their vote to you. Do you want
	  				to <a href="#" @click="acceptDelegations">accept these requests</a>?
	  			</li>
	  			<li v-if="directProxy">Your direct proxy in this area is {{directProxy.profile.name}} &lt;{{directProxy.email}}&gt;</li>
	  		</ul>
	    </div>
	  </div>

		<div class="row" v-if="poll.status !== 'FINISHED'">
			<div class="col-sm-12">
				<h3>Alternative proposals in this poll</h3>
			</div>
		  <div class="col-sm-6" v-for="proposal in poll._embedded.proposals">
				<law-panel
				  :law="proposal"
				  :showTimeline="false"
				  :fixedHeight="200"
				  v-on:like="likeToDiscuss">
				</law-panel>
			</div>
		</div>


		<div v-if="poll.status === 'FINISHED'">
			<h3>Winning proposal</h3>
			<law-panel
				:law="poll._embedded.winner"
				:showTimeline="false"
				:fixedHeight="200"
				:readOnly="true">
			</law-panel>

			<h3>Poll results</h3>
			<h4>Duel Matrix</h4>
			<p>This matrix shows the comparison between each pair of proposals in this poll. The numbers in each cell show how many voters
			sorted the proposal of that <em>row</em> higher than the proposal in that <em>col</em> in their ballot.</p>

			<table class="table table-bordered">
			  <thead>
					<tr>
						<th>&nbsp;</th>
						<th>Prop1</th>
						<th>Prop2</th>
						<th>Prop3</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th>Prop1</th>
						<td>23</td>
						<td>17</td>
						<td>12</td>
					</tr>
				</tbody>
			</table>
		</div>

		<br/>
		<div v-if="canJoinPoll" id="joinPollDiv" class="text-right collapse in">
			<button type="button" id="joinPollButton" class="btn btn-default" data-container="body" data-toggle="popover" data-placement="top"
			  data-content="If the topic of this ballot matches one of your proposals, then you can join your proposal into this poll and put it to the vote."
			  v-on:click="toggleCollapse">
			  Join this poll
			</button>
		</div>

		<div v-if="canJoinPoll" id="joinPollPanel" class="panel panel-default collapse">
	    <div class="panel-heading">
	    	<button type="button" class="close" aria-label="Close" v-on:click="toggleCollapse">&times;</button>
				<h4 class="panelTitle">Join this poll</h4>
	    </div>
	    <div class="panel-body"">
	      <p>If you think that one of your proposals matches this ballot's topic, then you can <em>join this poll</em> and put your proposal to the vote.</p>
	      <div class="form-inline">
	      	<div class="input-group">
		      	<input id="dropdownMenu" type="text" name="searchInput" placeholder="Search for porposal title" autocomplete="off" data-toggle="dropdown"
		      	 class="form-control" style="width: 300px" v-model="searchVal">
		      	<ul role="menu" aria-labelledby="dropdownMenu" class="dropdown-menu">
		      		<li v-for="prop in matchingProposals"><a v-on:click="selectUserProposal(prop)">{{prop.title}}</a></li>
		      	</ul>
		      </div>
		      <button type="button" class="btn btn-primary" :class="joinProposalButtonClass" v-on:click="joinPoll">
					  Join your proposal
					</button>
	      </div>
	    </div>
		</div>

	</div>
</template>

<script>
import moment from 'moment'
//import TypeAhead from 'vue2-typeahead'
import LawPanel from '../components/LawPanel'
import Timeline from '../components/Timeline'


export default {
	props: {
		'pollId': { type: String, required: true }
	},

	data () {
    return {
      poll: { _embedded: { proposals: [] }},

      isPublicProxy: false,
      delegationRequests: [],
      directProxy: undefined,
      topProxy: undefined,

      userProposals: [],  										// all the proposals of the currently logged in user (needed for joining the poll)
      searchVal: "",
      selectedUserProposal: undefined,				// the currently selected user proposal (in the dropdown select) when joining this poll
		}
	},

	components: {
		timeline: Timeline,
		lawPanel: LawPanel,
//		typeahead: TypeAhead
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
		canJoinPoll() {
			var alreadyJoined = false  //TODO: Can a user join a poll with more than one of its own proposals?  Maybe not?
			return this.poll.status === 'ELABORATION' && this.userProposals.length > 0 && !alreadyJoined
		},
		// return a list of user's proposals that match the search string, case insensitive
		matchingProposals() {
			var val = this.searchVal.toLowerCase().trim()
			this.selectedUserProposal = undefined			// disable joinProposalButton again
			if (val == "") {
				return this.userProposals.slice(0,3)		// remember: slice returns copy of array, whilst splice() only removes array elements
			}
			return this.userProposals.filter(prop => {
				return prop.title.toLowerCase().indexOf(val) != -1
			})
		},
		//join proposal button is only active, when one of the user's proposal has been selected
		joinProposalButtonClass() {
			return { 'disabled' : this.selectedUserProposal === undefined }
		}
	},

	created() {
		this.$root.api.getPoll(this.pollId)
			.then(poll => { this.poll = poll })
			.then(this.getAreaInfo)
		//.then(this.getOwnBallot)

		this.$root.api.findByStatusAndCreator('PROPOSAL', this.$root.currentUser).then(proposals => {
			this.userProposals = proposals
		})


	},

	mounted() {
		$('#joinPollButton').popover({trigger: 'hover'})
	},

	methods: {
		/** get localized display Value of a date */
    getFromNow(dateVal) {
      return moment(dateVal).fromNow();
    },

		/**
		 * When a user likes a proposal, then we update its properties
		 * (a little bit of a small dirty hack, but better than reloading the whole poll from the backend)
		 */
  	likeToDiscuss(likedProposal) {
  		this.poll._embedded.proposals.forEach(proposal => {
  			if (proposal.id === likedProposal.id) {
  				proposal.numSupporters++
  				proposal.supportedByCurrentUser = true
  			}
  		})
  	},

  	getAreaInfo() {
      console.log("getAreaInfo")
      return this.$root.api.getAreaInfo(this.poll.area.id)
        .then(res => {
          this.isPublicProxy = res.isPublicProxy
          this.delegationRequests = res.delegationRequests
          this.directProxy = directProxy
          this.topProxy = topProxy
        })
    },

  	getOwnBallot() {
  		var that = this
  		return this.$root.api.getVoterToken(this.poll.area, process.env.tokenSecret, false).then(voterToken => {
  			this.$root.api.getOwnBallot(that.poll.id, voterToken).then(ballot => {
  				console.log(ballot)
	  		})
  		})
  	},

  	becomePublicProxy() {
  		return this.$root.api.becomePublicProxy(this.poll.area.id)
  	},

		toggleCollapse() {
			$('#joinPollDiv').collapse('toggle')
			$('#joinPollPanel').collapse('toggle')
		},

		selectUserProposal(proposal) {
			this.searchVal = proposal.title
			this.$nextTick(function() {
			  this.selectedUserProposal = proposal
			})
		},

		joinPoll() {
			return this.$root.api.joinPoll(this.selectedUserProposal, this.poll).then(res => {
				console.log("joined proposal into poll.", res)
			})
		}
  }
}
</script>

<style scoped>
	.panel-heading h4 {
		margin-top: 0;
		margin-bottom: 0;
	}
	.grey{
		color: grey;
	}
  .searchInput {
    display: inline-block;
    height: 22px;
    width: 50%;
    padding-left: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  ul.dropdown-menu li {
  	padding: 0 !important;
  	margin: 0 !important;
  }
  ul.dropdown-menu > li > a {
  	overflow: hidden;
  	padding: 5px;
  	margin: 0;
  }
</style>


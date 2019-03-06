<!--
	Page that shows one poll.
	If a user has proposals in elaboration (that are not yet part of any poll)
	then he can join this poll.
-->

<template>
  <div class="container" id="PollShow">
		<h1><i class="fas fa-poll"></i>
			<template v-if="poll.status === 'ELABORATION'">Poll in elaboration phase</template>
			<template v-if="poll.status === 'VOTING'">Poll in voting phase</template>
			<template v-if="poll.status === 'FINISHED'">Finished Poll</template>
		</h1>

		<div v-if="poll.status == 'VOTING'" class="panel panel-default">
	    <div class="panel-body"">
	      <p>The voting phase of this poll has started. There are {{untilVotingEnd}} left until the voting phase will close.</p>
	      <timeline ref="pollTimeline" :height="80" :fillTo="new Date()" :events="timelineEvents"></timeline>
	      <button type="button" class="btn btn-primary btn-lg pull-right" v-on:click="gotoSortBallot">
				  Cast vote <i class="fas fa-angle-double-right"></i>
				</button>
	    </div>
	  </div>

		<div v-if="poll.status == 'FINISHED'" class="panel panel-default">
	    <div class="panel-body"">
	      <p>This poll is finished. The winning proposal is now a law.</p>
				<timeline ref="pollTimeline" :height="80" :fillTo="new Date()" :events="timelineEvents"></timeline>
	    </div>
	  </div>

	  <div v-if="ownBallot">
		  <h3>Your sorted ballot in this poll</h3>
	  	<p v-if="ownBallot.level == 0">This ballot was casted by yourself.</p>
	  	<p v-if="ownBallot.level == 1">This ballot was casted for you by your direct proxy.</p>
	  	<p v-if="ownBallot.level > 1">This ballot was casted for you by a transitive proxy.</p>
	    <p v-if="poll.status == 'VOTING'">This poll is still in its voting phase. You may still update the voteOrder in your ballot by clicking on the cast vote button again.</p>
	 		<div v-if="ownBallot" class="panel panel-default">
		    <div class="panel-body"">
		      <ol>
	          <li v-for="proposal in voteOrder">"{{proposal.title}}" <span class="grey">by {{proposal.createdBy.profile.name}} &lt;{{proposal.createdBy.email}}&gt;</span></li>
	        </ol>
		    </div>
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

			<h3>Poll result - DuelMatrix</h3>
			<p>This matrix shows the comparison between each pair of proposals. The numbers show how many voters
			preferred the proposal of that <em>row</em> over the proposal in the <em>col header</em>. These voters sorted the proposal in that row higher in their ballot.
			The winning proposal has the most green cells in its row.</p>

			<table class="table table-bordered">
				<thead>
					<th></th>
					<th v-for="colVal,colIndex in poll.duelMatrix.rawData[0]">
						#{{colIndex+1}}
					</th>
				</thead>
				<tbody>
					<tr v-for="row,rowIndex in poll.duelMatrix.rawData">
						<th>#{{rowIndex+1}}: {{poll._embedded.proposals[rowIndex].title}}</th>
						<td v-for="colVal,colIndex in row" :class="getDuelMatrixCellClass(rowIndex,colIndex)">
							{{colIndex == rowIndex ? "" : colVal }}
						</td>
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

		<h3>You as a proxy in this area</h3>
		<ul v-if="delegations">
			<li v-if="delCount == 1">You are the proxy for one voter who delegated his right to vote to you.</li>
			<li v-if="delCount >  1">You are the proxy for {{delCount}} voters who delegated their right to vote to you.</li>
			<li v-if="delReq == 1">A voter would like to delegate his right to vote to you as his proxy. Do you want
				to <a href="#" @click="acceptDelegations">accept this request?</a> Then your ballot will also be casted for this delegee. This voter will thus be able to see how you voted.
			</li>
			<li v-if="delReq > 1">{{delReq}} voters would like to delegate their vote to you as their proxy. Do you want
				to <a href="#" @click="acceptDelegations">accept these request?</a>
			</li>
			<li v-if="delegations.isPublicProxy">You are a public proxy in this area. Voters can immideatly delegate their vote to you.</li>
			<li v-else="delegations.isPublicProxy">You are not yet a public proxy in this area. Furhter voters can not yet immideately delegate their vote to you. Do you want to
				<a href="#" @click="becomePublicProxy">become a public proxy?</a>
			</li>
		</ul>


	</div>
</template>

<script>
import moment from 'moment'
import LawPanel from '../components/LawPanel'
import Timeline from '../components/Timeline'
var loglevel = require('loglevel')
var log = loglevel.getLogger("Poll_Show")

export default {
	props: {
		'pollId': { type: String, required: true }
	},

	data () {
    return {
      poll: { _embedded: { proposals: [] }},
      delegations: undefined,
      voterToken: undefined,
      ownBallot: undefined,
      userProposals: [],  										// all the proposals of the currently logged in user (needed for joining the poll)
      searchVal: "",
      selectedUserProposal: undefined,				// the currently selected user proposal (in the dropdown select) when joining this poll
		}
	},

	components: {
		timeline: Timeline,
		lawPanel: LawPanel,
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

		delCount()  { return this.delegations.delegationCount },
		delReq()    { return this.delegations.delegationRequests.length },
		voteOrder() { return this.ownBallot ? this.ownBallot.voteOrder : undefined },

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
		this.loadPoll()
			.then(this.loadOwnBallot)
			.then(this.loadDelegations)
		this.$root.api.findByStatusAndCreator('PROPOSAL', this.$root.currentUser).then(proposals => {
			this.userProposals = proposals
		})
	},

	mounted() {
		$('#joinPollButton').popover({trigger: 'hover'})
	},

	methods: {
		loadPoll() {
			return this.$root.api.getPoll(this.pollId).then(poll => { this.poll = poll })
		},

    /**
     * Load info about delegations TO this user as a proxy
     * On this Poll_Show page, we only show the info about delegations TO this user.
     * The information about being a proxy himself can be seen under /proxies -> Proxies_Show  !
     */
  	loadDelegations() {
  		return this.fetchVoterToken().then(voterToken => {
	      return this.$root.api.getMyDelegations(this.poll.area, this.voterToken).then(del => {
	      	this.delegations = del
	      })
	    })
    },

    /* lazily fetch the user's voterToken and cache it locally */
    fetchVoterToken() {
    	if (this.voterToken !== undefined) return Promise.resolve(this.voterToken)
    	return this.$root.api.getVoterToken(this.poll.area, process.env.tokenSecret, false).then(token => {
    		this.voterToken = token.voterToken
    		return this.voterToken
    	})
    },

    /**
     * load voter's own ballot, if he has voted already.
     * Will set this.ownBallot when loaded. May still be undefind if user has not voted yet!
     */
  	loadOwnBallot() {
  		return this.fetchVoterToken().then(voterToken => {
  			this.$root.api.getOwnBallot(this.poll, voterToken).then(ballot => {
  				this.ownBallot = ballot  // may be undefined!
	  		})
  		})
  	},

  	becomePublicProxy() {
  		var that = this
  		return this.fetchVoterToken().then(voterToken => {
  			return this.$root.api.becomePublicProxy(this.poll.area, voterToken).then(res => {
  				log.info("User is now a public proxy")
  				this.loadDelegations()
  				iziToast.success({
            title: 'Success',
            message: "Your are now a public proxy in<br/>"+this.poll.area.title,
          })
  			})
  		})
  	},

  	acceptDelegations() {
  		var that = this
  		return this.fetchVoterToken().then(voterToken => {
  			this.$root.api.acceptDelegationRequests(this.poll.area, voterToken).then(res => {
  				log.info("Accepted delgation requests")
  				this.loadDelegations()
  				iziToast.success({
            title: 'Success',
            message: "Delegation requests accepted."
          })
  			})
  		})
  	},

  	gotoSortBallot() {
  		this.$router.push({name: 'sortBallot', params: {
  			pollId: this.poll.id+'',    // MUST convert to String, so that the prop validation in Poll_CastVote accepts it
  			voteOrder: this.voteOrder   // if user already voted
  		}})
  	},

  	/* jump to the edit proxy page */
  	editProxy() {
  		this.$router.push({name: "editProxy", params: {
  			categoryId: this.poll.area.id,
  			category:   this.poll.area,
  			//we do not have the currently assigned proxy.  Proxy_edit.vue will load it
  		}})
  	},

  	joinPoll() {
  		return this.$root.api.joinPoll(this.selectedUserProposal, this.poll).then(res => {
				console.log("joined proposal into poll.", res)
			})
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

  	/** get localized display Value of a date */
    getFromNow(dateVal) {
      return moment(dateVal).fromNow();
    },

    getDuelMatrixCellClass(row, col) {
    	var a = this.poll.duelMatrix.rawData[row][col]
    	var b = this.poll.duelMatrix.rawData[col][row]
    	if (a > b) return "winner"
    	if (a < b) return "looser"
    	return "tie"
    },

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
  .winner {
  	background: #DFD;
  }
  .looser {
  	background: #FDD;
  }
  .tie {
  	background: #EEE;
  }
</style>


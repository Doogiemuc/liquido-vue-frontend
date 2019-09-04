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

		<div v-if="poll.status === 'ELABORATION'" class="panel panel-default">
			<div class="panel-heading">
				<h4 id="pollTitle">{{poll.title}}</h4>
			</div>
			<div class="panel-body">
				<p>The voting phase of this poll has not yet started. There are {{untilVotingStart}} left to discuss all the proposals.
					Click on the title of each proposal to join the discussion and suggest improvements. Further alternative proposals may also still be added to this poll.</p>
				<p v-if="poll._embedded.proposals.length === 1">There is just one proposal in this poll yet. Others must join this poll before the voting phase can start.</p>	
				<timeline ref="pollTimeline" :height="80" :fillToDate="new Date()" :events="timelineEvents"></timeline>
			</div>
		</div>

		<div v-if="poll.status === 'VOTING'" class="panel panel-default">
			<div class="panel-heading">
				<h4>{{poll.title}}</h4>
			</div>
			<div class="panel-body">
				<p>The voting phase of this poll has started. There are {{untilVotingEnd}} left until the voting phase will close.</p>
				<timeline ref="pollTimeline" :height="80" :fillToPercent="60" :events="timelineEvents"></timeline>
			</div>
		</div>

		<div v-if="poll.status === 'FINISHED'" class="panel panel-default">
			<div class="panel-heading">
				<h4>{{poll.title}}</h4>
			</div>
			<div class="panel-body">
				<p>This poll is finished. The winning proposal is now a law.</p>
				<timeline ref="pollTimeline" :height="80" :fillToPercent="100" :events="timelineEvents"></timeline>
			</div>
		</div>

		<div v-if="ownBallot" class="panel panel-default">
			<div class="panel-heading">
				<h4>Your current ballot in this poll</h4>
			</div>
			<div class="panel-body ballot-body">
				<p>
					<span v-if="ownBallot.level == 0">This ballot was casted by yourself {{ownBallotCreatedAt}}.</span>
					<span v-if="ownBallot.level == 1">This ballot was casted for you by your direct proxy {{ownBallotCreatedAt}}.</span>
					<span v-if="ownBallot.level > 1">This ballot was casted for you by a transitive proxy {{ownBallotCreatedAt}}.</span>
					<span v-if="poll.status == 'VOTING'">You may still change your mind and update	the vote order in your ballot as long as the poll is in its voting phase. Simply click on the cast vote button again.</span>
				</p>
				<ol>
					<li v-for="proposal in voteOrder" :key="proposal.id">"{{proposal.title}}" <span class="grey">by {{proposal.createdBy.profile.name}} &lt;{{proposal.createdBy.email}}&gt;</span></li>
				</ol>
			</div>
		</div>

		<button v-if="poll.status==='VOTING'" type="button" class="btn btn-primary btn-lg pull-right" v-on:click="gotoSortBallot">
			Cast vote <i class="fas fa-angle-double-right"></i>
		</button>

		<div class="row" v-if="poll.status !== 'FINISHED'">
			<div class="col-sm-12">
				<h3>Alternative proposals in this poll</h3>
			</div>
			<div class="col-sm-6" v-for="proposal in poll._embedded.proposals" :key="proposal.id">
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
				:readOnly="true">
			</law-panel>

			<p>&nbsp;</p>
			<h3>Poll result</h3>
			<p>This matrix shows the direct comparison between each pair of proposals. The number in each cell shows how many voters
			preferred the proposal of that <em>row</em> over the proposal in the <em>col header</em>. That many voters sorted the proposal in that row higher in their ballot as the proposal in the col header.
			Then the winning proposal is the one that won the most direct comparisons, ie. the proposal with the most green cells in its row.</p>

			<table class="table table-bordered">
				<thead>
					<th></th>
					<th v-for="(colVal,colIndex) in poll.duelMatrix.rawData[0]" :key="colIndex">
						#{{colIndex+1}}
					</th>
				</thead>
				<tbody>
					<tr v-for="(row,rowIndex) in poll.duelMatrix.rawData" :key="rowIndex">
						<th>#{{rowIndex+1}}: {{poll._embedded.proposals[rowIndex].title}}</th>
						<td v-for="(colVal,colIndex) in row" :class="getDuelMatrixCellClass(rowIndex,colIndex)" :key="colIndex">
							{{colIndex == rowIndex ? "" : colVal }}
						</td>
					</tr>
				</tbody>
			</table>

			<p>&nbsp;</p>
			<h3>Verify your ballot</h3>
			<p>Here you can check, if your ballot was counted correctly in this poll. If you voted in this poll, you should have received a checksum for your ballot that you can verify here.</p>
			<div class="form form-inline">
				<input type="text" class="form-control" name="checksum" id="checksumInput" v-model="checksum" placeholder="">
				<button type="button" class="btn btn-default" v-bind:disabled="disableChecksumButton" @click="verifyChecksum">Verify checksum</button>
			</div>
			<div v-if="checksumValidity === 'valid'" class="alert alert-success checksumAlert" role="alert">This checksum is valid and your ballot was counted in this poll.</div>
			<div v-if="checksumValidity === 'invalid'" class="alert alert-danger checksumAlert" role="alert">This checksum is <b>not</b> valid</div>
		</div>

		<br/>

		<div v-if="canJoinPoll" id="joinPollPanel" class="panel panel-default">
			<div class="panel-heading">
			<h4 class="panelTitle">Join this poll</h4>
			</div>
			<div class="panel-body">
				<p>If you think that one of your proposals <b>in this area</b> matches this poll's topic, then you can add your proposal into this poll and put it to the vote.</p>
				<div class="form-inline">
					<div class="input-group">
						<input id="dropdownMenu" type="text" name="searchInput" placeholder="Search for your porposal's title" autocomplete="off" data-toggle="dropdown"
						 class="form-control" style="width: 300px" v-model="searchVal">
						<ul role="menu" aria-labelledby="dropdownMenu" class="dropdown-menu">
							<li v-for="prop in matchingProposals" :key="prop.id"><a v-on:click="selectUserProposal(prop)">{{prop.title}}</a></li>
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
			poll: { 
				_embedded: { proposals: [] }
			},
			delegations: undefined,
			voterToken: undefined,
			ownBallot: undefined,
			userProposals: [],											// all the proposals of the currently logged in user in this area (needed for joining the poll)
			searchVal: "",
			selectedUserProposal: undefined,				// the currently selected user proposal (in the dropdown select) when joining this poll
			checksum: undefined,
			checksumValidity: undefined,
		}
	},

	components: {
		timeline: Timeline,
		lawPanel: LawPanel,
	},

	computed: {
		pollCreated()				 { return moment(this.poll.createdAt).format('L') },
		votingStart()				 { return moment(this.poll.votingStartAt).format('L') },
		votingEnd()					 { return moment(this.poll.votingEndAt).format('L') },
		ownBallotCreatedAt() { return this.ownBallot ? moment(this.ownBallot.createdAt).fromNow() : "" },
		untilVotingStart()	 { return moment().to(this.poll.votingStartAt, true) },	 // e.g. "14 days"	(including the word days/minutes/seconds etc.)
		untilVotingEnd()		 { return moment().to(this.poll.votingEndAt, true) },	 // e.g. "14 days"	(including the word days/minutes/seconds etc.)
		timelineEvents() {
			return [
				{ percent:  10, date: new Date(this.poll.createdAt),	 above: this.pollCreated, below: "Poll<br/>created" },
				{ percent:  50, date: new Date(this.poll.votingStartAt), above: this.votingStart, below: "Voting</br>start" },
				{ percent:  90, date: new Date(this.poll.votingEndAt),	 above: this.votingEnd,	  below: "Voting<br/>end" }
			]
		},

		delCount()	{ return this.delegations.delegationCount },
		delReq()    { return this.delegations.delegationRequests.length },
		voteOrder() { return this.ownBallot ? this.ownBallot.voteOrder : undefined },

		/**
			A user can join a poll, when the poll is still in elaboration
			and he has a proposal in that area
			and he did not already join this poll with one of his proposals.
		 */
		canJoinPoll() {
			var alreadyJoined = this.poll._embedded.proposals.some(prop => prop.createdBy.id === this.$root.currentUser.id)
			return this.poll.status === 'ELABORATION' && this.userProposals.length > 0 && !alreadyJoined
		},

		/** return a list of user's proposals that match the search string, case INsensitive */
		matchingProposals() {
			var val = this.searchVal.toLowerCase().trim()
			this.selectedUserProposal = undefined			// disable joinProposalButton again
			if (val == "") {
				return this.userProposals.slice(0,3)		// remember: slice returns copy of array, whilst splice() only removes array elements
			}
			return this.userProposals.filter(prop => prop.title.toLowerCase().indexOf(val) != -1)
		},
		//join proposal button is only active, when one of the user's proposal has been selected
		joinProposalButtonClass() {
			return { 'disabled' : this.selectedUserProposal === undefined }
		},
		disableChecksumButton() {
			return this.checksum === undefined || this.checksum.length < 10
		}

	},

	created() {
		this.loadPoll()
			.then(this.loadOwnBallot)
			.then(this.loadUsersProposalsInArea)
			//.then(this.loadDelegations)		 //MAYBE: Could load delegations since I already have the user's voterToken
			
	},

	mounted() {
		$('#joinPollButton').popover({trigger: 'hover'})
	},

	methods: {
		loadPoll() {
			return this.$root.api.getPoll(this.pollId).then(poll => { this.poll = poll })
		},

		/**
			 Load proposals that the currently logged in user has in the area of the poll.
			 He could join the poll with one of those proposals.
		 */
		loadUsersProposalsInArea() {
			return this.$root.api.findByStatusAndCreator('PROPOSAL', this.$root.currentUser).then(proposals => {
				this.userProposals = proposals.filter(prop => prop.area.id === this.poll.area.id)
			})
		},

		/**
		 * Load info about delegations TO this user as a proxy
		 * On this Poll_Show page, we only show the info about delegations TO this user.
		 * The information about being a proxy himself can be seen under /proxies -> Proxies_Show	 !
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
			if (this.poll.status === 'VOTING') {
				return this.fetchVoterToken().then(voterToken => {
					this.$root.api.getOwnBallot(this.poll, voterToken).then(ballot => {
						this.ownBallot = ballot	 // may be undefined if user did not vote yet!
					})
				})
			}
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
				pollId: this.poll.id+'',		// MUST convert to String, so that the prop validation in Poll_CastVote accepts it
				voteOrder: this.voteOrder		// if user already voted, then pass the full voteOrder JSON
			}})
		},

		/* jump to the edit proxy page */
		editProxy() {
			this.$router.push({name: "editProxy", params: {
				categoryId: this.poll.area.id,
				category:		this.poll.area,
				//we do not have the currently assigned proxy.	Proxy_edit.vue will load it
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

		verifyChecksum() {
			this.$root.api.verifyChecksum(this.pollId, this.checksum)
				.then(res => {
					this.checksumValidity = res.valid ? 'valid' : 'invalid'
				})
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
	.checksumAlert {
		margin-top: 1em;
	}
</style>


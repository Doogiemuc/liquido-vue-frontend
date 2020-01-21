<template>
	<div class="container" id="UserHomePage">
		<div class="row">
			<div class="col-sm-12">
				<h2>Welcome {{username}}!</h2>
			</div>
		</div>
		<div class="row">

			<!-- left column: public and general things -->
			<div class="col-sm-6">

				<div v-if="isNewbee" class="panel panel-default">
					<div class="panel-heading">
						<h4>Welcome to LIQUIDO!</h4>
					</div>
					<div class="panel-body">
						<p>Great see you. It looks like you are new here. Here are some ways to start:</p>
						<ul>
							<li>You can <a href="/#/ideas/add">add your own idea.</a></li>
							<li>You can <a href="/#/polls">cast your vote</a> in poll.</a></li>
						</ul>
						<p>Use the grey arrows at the top to navigate within LIQUIDO.</p>
					</div>
				</div>

				<law-list v-if="news.supportedByYou && news.supportedByYou.length > 0"  :laws="news.supportedByYou" lawListTitle="Supported by you"></law-list>
			</div>

			<!-- right column: voters personal stuff -->
			<div class="col-sm-6">

				<div v-if="news.delegationRequests && news.delegationRequests.length > 0" class="panel panel-default">
					<div class="panel-heading">
						 <h4>Delegation requests</h4>
					</div>
					<div class="panel-body">
						<div class="media" >
							<div class="media-left">
								<i class="far fa-share-square fa-2x"></i>
							</div>
							<div class="media-body">
								<small class="pull-right text-muted">now</small>
								<h4 class="media-heading">Delegation requests</h4>
								<p v-if="news.delegationRequests.length == 1">A voter would like to delegate his right to vote to you as his proxy.</p>
								<p v-if="news.delegationRequests.length >  1">{{news.delegationRequests.length}} voters would like to delegate their right to vote to you as their proxy.</p>
								<p>If you accept this request then your vote will also count for your delegees. Your delegees will be able to see how you voted, because your vote will also become theirs.</p>
								<button role="button" class="btn btn-primary" id="acceptDelegationRequestsButton" href="#" @click="acceptDelegationRequests">
									Accept all delegation requests
								</button>
							</div>
						</div>
					</div>
				</div>

				<div v-if="showNewsfeedPanel">
					<div class="panel panel-default">
						<div class="panel-heading">
							 <h4>Newsfeed</h4>
						</div>
						<div class="panel-body">

							<div v-for="poll in news.pollsInVotingWithOwnProposals" :key="poll.id" class="media">
								<div class="media-left">
									<i class="fas fa-fw fa-balance-scale-left fa-2x"></i>
								</div>
								<div class="media-body">
									<small class="pull-right text-muted">{{getFromNow(poll.votingStartAt)}}</small>
									<h4 class="media-heading">Voting started</h4>
									<p>
										The voting phase of poll <router-link :to="'/polls/'+poll.id">{{poll.title}}</router-link> with
										your proposal <router-link :to="'/proposals/'+getOwnProposal(poll).id">{{getOwnProposal(poll).title}}</router-link> in it has started.
									</p>
								</div>
							</div>

							<div v-for="prop in news.reachedQuorum" :key="prop.id" class="media">
								<div class="media">
									<div class="media-left">
										<i class="far fa-fw fa-file-alt fa-2x"></i>
									</div>
									<div class="media-body">
										<small class="pull-right text-muted">{{getFromNow(prop.reachedQuorumAt)}}</small>
										<h4 class="media-heading">Reached Quorum</h4>
										<p>
											Your idea <router-link :to="'/proposals/'+prop.id">{{prop.title}}</router-link> reached its quorum and can now be discussed as a proposal.
										</p>
									</div>
								</div>
							</div>

						</div>
					</div>
				</div>

				<div v-if="news.recentlyDiscussedProposals && news.recentlyDiscussedProposals.length > 0" class="panel panel-default">
					<div class="panel-heading">
						<h4>Your proposals with recently new comments</h4>
					</div>
					<ul class="list-group">
						<li v-for="proposal in news.recentlyDiscussedProposals" :key="proposal.id" class="list-group-item item-condensed">
							<router-link :to="{ path: '/proposals/'+proposal.id }"><i class="far fa-file-alt"></i> {{proposal.title}}</router-link>
						</li>
					</ul>
				</div>

				<div class="panel panel-default">
					<div class="panel-heading">
						<h4>Your ballots in voting</h4>
					</div>
					<div class="panel-body">
						<p>Here you can load all ballots that were recently casted by you (or a proxy for you)
						and that you can still update because the poll is still in voting.</p>
						<button role="button" class="btn btn-default" @click="loadOwnBallotsInVoting">Fetch ballots</button>
					</div>
					<ul class="list-group" v-if="ownBallots">
						<li v-for="ballot in ownBallots" :key="ballot.id" class="list-group-item item-condensed">
							Ballot <small>&lt;{{ballot.checksum}}&gt;</small> in this
							<router-link :to="pollLink(ballot)"><i class="fas fa-balance-scale"></i> Poll</router-link>
							<i v-if="ballot.level > 0" class="far fa-share-square"></i>
						</li>
					</ul>
				</div>

				<!-- TODO: Users own laws -> quick link to search -->

		 </div>
		</div>
	</div>
</template>

<script>
var loglevel = require('loglevel')
var log = loglevel.getLogger("UserHome")
import IdeaPanel from '../components/IdeaPanel.vue'
import LawPanel from '../components/LawPanel.vue'
import LawList from '../components/LawList.vue'
import PollPanel from '../components/PollPanel.vue'
import Timeline from '../components/Timeline.vue'
import moment from 'moment'

export default {
	components: {
		'idea-panel' : IdeaPanel,
		'law-panel' : LawPanel,
		'law-list' : LawList,
		'poll-panel': PollPanel,
		'timeline' : Timeline
	},

	data () {
		return {
			news: {},
			areas: [],
			ownBallots: []
		}
	},

	computed: {
		username: function() { return this.$root.currentUser ? this.$root.currentUser.profile.name : "" },
		isNewbee: function() { return true /*moment().diff(this.$root.currentUser.lastLogin, 'days') > 14*/  },
		showNewsfeedPanel: function() {
			return (this.news.pollsInVotingWithOwnProposals && this.news.pollsInVotingWithOwnProposals.length > 0) ||
				     (this.news.reachedQuorum && this.news.reachedQuorum.length > 0)
		}
	},

	created () {
		this.$root.api.getMyNewsfeed().then(news => this.news = news)
		this.$root.api.getAllCategories().then(areas => this.areas = areas)
	},

	methods: {
		getFromNow(dateVal) {
			return moment(dateVal).fromNow();
		},

		pollLink(ballot) {
			return "/polls/"+this.$root.api.getIdFromUri(ballot._links.poll.href)
		},

		getOwnProposal(poll) {
			if (poll && poll.proposals && poll.proposals.length > 0) {
				for (var prop of poll.proposals) {
					if (prop.createdBy.id === this.$root.currentUser.id)
						return prop
				}
			}
			return undefined
		},

		getAllAreas() {
			return this.$root.api.getAllCategories()
		},

		getVoterTokens(areas) {
			return Promise.all(
				areas.map(area => this.$root.api.getVoterToken(area.id, process.env.tokenSecret))
			)
		},

		getOwnBallotsInVoting(voterTokens) {
			return Promise.all(voterTokens.map(voterTokenRes => this.$root.api.getOwnBallotsInVoting(voterTokenRes.voterToken)))
				.then(ownBallotResponses => ownBallotResponses.map(res => res._embedded))
				.then(ballots => {
					var merged = [].concat.apply([], ballots);		// flatten array of arrays  https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
					return merged
				})
		},

		loadOwnBallotsInVoting() {
			this.ownBallots = []
			this.getAllAreas()
				.then(this.getVoterTokens)
				.then(this.getOwnBallotsInVoting)
				.then(res => {
					this.ownBallots = res
				})
		},

		/**
		 * Need to wrap api.getVoterToken, because we need to pass area to inner promise
		 * @return {Object} with area and voterToken(String)
		 */
		getVoterToken(area) {
			return this.$root.api.getVoterToken(area.id, process.env.tokenSecret, false).then(voterTokenJson => {
				return { area: area, voterToken: voterTokenJson.voterToken }
			})
		},

		acceptDelegationRequests() {
			var tasks = []
			var area
			for(area of this.areas) {
				tasks.push(
					this.getVoterToken(area.id).then(res => {
						console.log("getVoterToken res=", res)
						return this.$root.api.acceptDelegationRequests(res.area, res.voterToken).then(res => {
							console.log("Accepted delegation requests", res)  // res.delegationCount
						})
					})
				)
			}
			console.log("Promise all")
			return Promise.all(tasks)
			  .then(res => {
					this.news.delegationRequests = []
					iziToast.success({
						id: "AcceptDelegationRequestsSuccess",
						title: 'Accepted Delegation Requests',
						message: 'You accepted all delegation requests.<br/>You are now a proxy.'
					})
				})
				.catch(err => {
					log.error("Could not accept delegation requests", err)
					iziToast.error({
						id: "AcceptDelegationRequestsError",
						title: 'Error',
						message: 'There was an error when accepting your delegation requests.<br/>Please try again later.'
					})
					return Promise.reject(err)
				})
		},

	}
}


</script>

<style scoped>
	.poll-list h4 {
		margin-top: 5px;
		margin-bottom: 5px;
	}
	.poll-list hr {
		margin-top: 10px;
		margin-bottom: 10px;
	}
	.poll-list p {
		margin: 0;
	}
	.poll-list .pfooter {
		text-align: right;
		color: #999;
		font-size: 12px;
		line-height: 1.4;
	}

	/* Button in the lower right corner of poll-pannel */
	.pollPanel {
		position: relative;
	}
	.expandButton {
		position: absolute;
		bottom: 0;
		right: 0;
	}


	.panel-heading h4 {
		margin-top: 0;
		margin-bottom: 0;
	}
	.ideaIcon {
		font-size: 30px;
	}
	.userPictureLeft {
		float: left;
		margin-right: 8px;
	}
	.ideaTitle {
		margin-top: 0;
		margin-bottom: 8px;
	}
	.greyDataRight {
		padding-top: 18px;
		color: grey;
		font-size: 12px;
		background-color: rgb(245,245,245);
	}
	.greyDataRight ul.fa-ul {
		margin-left: 1.5em;
	}
	.greyDataRight .userPicture {
		margin-bottom: 8px;
	}
	.maxHeightPreviewWrapper {
		position: relative;
	}
	.maxHeightPreview {
		height:55px;
		overflow:hidden;
	}
	.maxHeightPreview:before {
		content:'';
		width:100%;
		height:100%;
		position:absolute;
		left:0;
		top:0;
		/* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+0,ffffff+90,ffffff+100&0+0,0+90,1+100 */
		background: -moz-linear-gradient(top, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 90%, rgba(255,255,255,1) 100%); /* FF3.6-15 */
		background: -webkit-linear-gradient(top, rgba(255,255,255,0) 0%,rgba(255,255,255,0) 90%,rgba(255,255,255,1) 100%); /* Chrome10-25,Safari5.1-6 */
		background: linear-gradient(to bottom, rgba(255,255,255,0) 0%,rgba(255,255,255,0) 90%,rgba(255,255,255,1) 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
		filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ffffff', endColorstr='#ffffff',GradientType=0 ); /* IE6-9 */
	}
	.item-condensed {
		padding-top: 3px;
		padding-bottom: 3px;
	}
	.item-condensed i {
		line-height: inherit;  /* necessary to vertically align fontawesome icons */
	}
	.item-condensed p {
		margin-bottom: 0;
	}


</style>

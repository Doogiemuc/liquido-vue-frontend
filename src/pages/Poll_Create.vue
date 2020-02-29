<!--
	Create a new Poll (from an existing proposal)
-->

<template>
	<div class="container" id="PollCreate">
		<h1><i class="fas fa-poll"></i>
			Create new poll
		</h1>

		<div v-if="pollsInElaboration.length > 0" class="alert alert-info" role="alert">
			<p>Before you start a new poll, you should consider joining an already existing poll.
				There <a href="#" @click="gotoPolls()">{{pollsInElaboration.length == 1 ? 'is one poll' : 'are '+pollsInElaboration.length+' polls'}} in this area</a> that you can join.
			</p>
			<ul>
				<li v-for="poll in pollsInElaboration" :key="poll.id">
					<a :href="'/polls'+poll.id"><i class="fas fa-poll"></i> {{poll.title}}</a>
				</li>
			</ul>
		</div>

		<div class="panel panel-default">
			<div class="panel-body ballot-body">

				<p>
					<input type="text" class="form-control" name="pollTitle" id="pollTitleInput" v-model="pollTitle" placeholder="Poll title" >
					<small>The poll's title can be edited by anyone who has a proposal in this poll. Please choose a short umbrella term that describes the general topic.</small>
				</p>

				<p><button type="button" class="btn btn-primary pull-right" id="createNewPollButton" v-bind:disabled="disableSaveButton" @click="createNewPoll()">Create new poll</button></p>
			</div>
		</div>

		<div class="row">
			<div class="col-sm-6">
				<law-panel v-if="proposal" :law="proposal"></law-panel>
			</div>
			<div class="col-sm-6">
				<p v-if="proposalsToInvite.length > 0">There are <a href="#" @click="gotoProposalsToInvite()">{{proposalsToInvite.length}} other proposals in this area</a> that are not yet part of a poll.
				If one of them might be an alternative proposal for this poll, then you can invite its creator to join this poll.</p>
			</div>
		</div>

	</div>
</template>

<script>
import LawPanel from '../components/LawPanel'

var loglevel = require('loglevel')
var log = loglevel.getLogger("Poll_Create")


export default {
	props: {
		'proposal': { type: Object, required: true }		// The initial proposal in the poll (full JSON)
	},

	data () {
		return {
			pollTitle: "",
			pollsInElaboration: [],
			proposalsToInvite: []
		}
	},

	components: {
		'law-panel': LawPanel
	},

	computed: {
		disableSaveButton: function() {
			return this.pollTitle.length < 5 || this.proposal === undefined
		}
	},

	created() {
		if (!this.proposal) {
			log.warn("Cannot create new poll without a proposal.")
			this.$router.push('/polls')
		}
		this.loadPollsInElaboration()
		this.loadProposalsToInvite()
	},

	methods: {
		loadPollsInElaboration() {
			this.$root.api.findPolls("ELABORATION", '/areas/'+this.proposal.area.id)
				.then(res => { this.pollsInElaboration = res } )
		},

		/** show all proposals that are already part of a poll in elaboration */
		gotoProposalsInElaboration() {
			this.$router.push({name: 'search', params: {
				initQuery: {
					statusList: ["ELABORATION"],
					areaId: this.proposal.area.id
				}
			}})
		},

		/** show all proposals that are already part of a poll in elaboration */
		gotoPolls() {
			this.$router.push("/polls")
		},

		/**
		 * Load proposals that could be invited into this new poll.
		 * ie. proposals that did not yet join another poll and of course are not created by current user.
		 */
		loadProposalsToInvite() {
			var query = {
				statusList: ['PROPOSAL'],    // status == proposal means not yet in a poll. Then it would be ELABORATION
				areaId: this.proposal.area.id
				//NOT created by currentUser => filterd below
			}
			this.$root.api.findByQuery(query).then(res => {
				this.proposalsToInvite = res._embedded.laws.filter(prop => prop.createdBy.id !== this.$root.currentUser.id )
			})
		},

		gotoProposalsToInvite() {
			this.$router.push({name: 'search', params: {
				initQuery: {
					statusList: ['PROPOSAL'],
					areaId: this.proposal.area.id
				}
			}})
		},

		createNewPoll() {
			log.info("Creating a new poll with proposal.id="+this.proposal.id)
			var poll = {
				title: this.pollTitle,
				proposals: [ this.$root.api.getURI(this.proposal) ]
			}
			this.$root.api.createNewPoll(poll).then(poll => {
				iziToast.success({
					title: 'Poll created',
					message: 'A new poll has been created.'
				})
				this.$router.push('/polls/'+poll.id)
			})
			.catch(err => {
				log.error("Cannot create new poll", err)
			})
		}
	}
}
</script>

<style scoped>
</style>

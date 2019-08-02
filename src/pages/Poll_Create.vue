<!--
	Create a new Poll (from an existing proposal)
-->

<template>
	<div class="container" id="PollCreate">
		<h1><i class="fas fa-poll"></i>
			Create new poll
		</h1>

		<div class="panel panel-default">
			<!--div class="panel-heading">
				<h4>Poll title (editable)</h4>
			</div -->
			<div class="panel-body ballot-body">
				<p if="pollsInElaboration.length > 0">Before you start a new poll, you should consider joining an already existing poll. 
					There {{pollsInElaboration.length == 1 ? 'is one poll' : 'are '+loadPollsInElaboration.length+' polls'}} in this area that you can join.</p>
				
				<p>
					<input type="text" class="form-control" name="pollTitle" id="pollTitleId" v-model="pollTitle" placeholder="Poll title" >
					<small>The poll's title can be edited by anyone who has a proposal in this poll. Please choose a short umbrella term that describes the general topic.</small>
				</p>
				
				<p><button type="button" class="btn btn-primary pull-right" v-bind:disabled="disableSaveButton" @click="createNewPoll()">Create new poll</button></p>
			</div>
		</div>

		<div class="row">
			<div class="col-sm-6">
				<law-panel v-if="proposal" :law="proposal"></law-panel>
			</div>
			<div class="col-sm-6">
				<p v-if="proposalsToInvite.length > 0">There are {{proposalsToInvite.length}} other proposals in this area. If one of them might be an alternative proposal for this poll, then you can invite 
					its creator to join this poll.</p>					
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
			this.$root.api.findPollsByStatusAndArea("ELABORATION", '/areas/'+this.proposal.area.id)
				.then(res => { this.pollsInElaboration = res } )
		},

		loadProposalsToInvite() {
			var query = {
				statusList: ['PROPOSAL'],
				areaId: this.proposal.area.id
			}
			this.$root.api.findByQuery(query)
				.then(res => { 
					console.log(res)
					this.proposalsToInvite = res._embedded.laws
				})
		},

		createNewPoll() {
			log.info("Creating a new poll with proposal.id="+this.proposal.id)
			var poll = {
				proposals: [ 
					this.$root.api.getURI(this.proposal)
				]
			}
			this.$root.api.createNewPoll(poll).then(poll => {
				iziToast.success({
					title: 'Poll created',
					message: 'A new poll has been created.'
				})
				this.$router.push('/polls/'+poll.id)
			})
			.catch(err => {
				log.warn("Cannot create new poll", err)
			})
		}
	}
}
</script>

<style scoped>
</style>


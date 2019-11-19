<template>
<div class="container" id="IdeasList">
	<router-link role="button" class="btn btn-primary pull-right addIdeaButton" to="/ideas/add" id="AddIdeaButton">Add new Idea</router-link>

	<h1><i class="fa far fa-lightbulb"></i> Ideas</h1>

	<p>An idea is a spontaneous suggestions for improvement. Everyone may add an idea at any time. But an idea needs at least {{$root.props['liquido.supporters.for.proposal']}} supporters, before it becomes a proposal.
	If you want to support an idea, then click its like button.</p>

	<button type="button" class="btn btn-xs btn-default pull-right" @click="showUsersOwnIdeas">Your ideas <i class="fa fa-angle-double-right"></i></button>
	<p>You can search for ideas and proposals on the <a href="#" @click.prevent="searchIdeasAndProposals">search page</a>.

	<div class="row">
	<div class="col-sm-6">
		<law-list :laws="recentIdeas" lawListTitle="Recently added ideas"></law-list>
	</div>
	<div class="col-sm-6">
		<law-list :laws="supportedIdeas" lawListTitle="Ideas supported by you"></law-list>
	</div>
</div>

</div>

</template>

<script>
import LawList from 'components/LawList'

export default {
	components: {
	'law-list': LawList
	},

	data () {
		return {
			recentIdeas: [],
			supportedIdeas: [],
		}
	},

	methods: {
		searchIdeasAndProposals() {
			var query = {
				statusList: ["IDEA", "PROPOSAL", "ELABORATION", "VOTING"],
			}
			this.$router.push( { name: 'search', params: { initQuery: query }})
		},
		
		/* Jump to search page and show all ideas that were created by the current user */
		showUsersOwnIdeas() {
			var query = {
				statusList: ["IDEA" ],
				createdByYou: true
			}
			this.$router.push( { name: 'search', params: { initQuery: query }})
		}
	},

	created () {
		this.$root.api.getRecentIdeas().then(recentIdeas => {
			this.recentIdeas = recentIdeas
		})
		this.$root.api.findSupportedBy(this.$root.currentUser, "IDEA").then(supportedIdeas => {
			this.supportedIdeas = supportedIdeas
		})
	},

}
</script>

<style>
.addIdeaButton {
	margin-top: 20px;
}
</style>

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
				<p>Before you create a new poll, you should consider joining an already existing poll in this area. There must be at least two proposals in a poll
				before the voting phase can start.</p>
				
				<p>
					<input type="text" class="form-control input-sm" name="pollTitle" :id="pollTitleId" v-model="pollTitle" placeholder="Poll title" >
					<small>The poll's title can be edited by anyone who has a proposal in this poll. Please choose a short umbrella term that describes the general topic.</small>
				</p>
				
				<p><button type="button" class="btn btn-primary pull-right" @click="createNewPoll()">Create new poll</button></p>
			</div>
		</div>

		<law-panel v-if="proposal" :law="proposal"></law-panel>
		
		<pre>
		{{proposal}}
		</pre>

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
		}
	},

	components: {
		'law-panel': LawPanel
	},

	computed: {
	},

	created() {
	},

	methods: {

	}
}
</script>

<style scoped>
</style>


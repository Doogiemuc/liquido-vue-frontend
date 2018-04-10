<template>
<button v-if="law.supportedByCurrentUser" type="button" class="btn btn-default btn-xs active">
	<span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{law.numSupporters}}
</button>
<button v-else type="button" class="btn btn-default btn-xs" v-on:click="likeToDiscuss()">
	<span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{law.numSupporters}}
</button>
</template>

<script>
/** Button for adding current user as supporter to idea */
export default {
	props: {
		row: { type: Object, required: true },
	},
	
	computed: {
		law: function() {
			return this.row
		}
	},
	
	methods: {
		likeToDiscuss() {
			this.$root.api.addSupporterToIdea(this.law, this.$root.currentUser).then(res => {
        //BUGFIX:  cannot simply update this.law, becasue Vue properties should not be updated. So we fire an event to parent instead:
        this.$emit("reloadLaw", this.law)  // notify parent to reload this law
      })
		}
	}	
}
</script>

<style>
	button.btn-default.active {
		background-color: #9C9;
	}
</style>
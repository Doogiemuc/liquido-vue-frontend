<template>
<button v-if="law.supportedByCurrentUser" type="button" class="btn btn-default btn-xs active">
	<i class="far fa-thumbs-up"></i> {{law.numSupporters}}
</button>
<button v-else type="button" class="btn btn-default btn-xs" v-on:click="likeToDiscuss()">
	<i class="far fa-thumbs-up"></i> {{law.numSupporters}}
</button>
</template>

<script>
/** Button for adding current user as supporter to idea */
export default {
	props: {
		row: { type: Object, required: true },
		supporterAdded: { type: Function, required: false }	//callback when supporter was added
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
        this.$emit("input", this.law)  // notify parent with new value
				if (typeof this.supporterAdded === "function") this.supporterAdded(this.law, this.$root.currentUser)
      })
      .catch(err => { console.log("Cannot add supporter to idea", err) })
		}
	},

}
</script>

<style>
	button.btn-default.active,
	button.btn-default.active:hover {
		background-color: #9C9;
		cursor: default;
	}
	
</style>
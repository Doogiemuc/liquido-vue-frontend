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
		foo: { type: String, required: false }
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
      })
      .catch(err => { console.log("Cannot add supporter to idea", err) })
		}
	},

	created () {
		console.log("Support Button is ", this.row, this.foo)
	}


}
</script>

<style>
	button.btn-default.active {
		background-color: #9C9;
	}
</style>
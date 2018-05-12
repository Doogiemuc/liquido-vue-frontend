<template>
	<button v-if="row.supportedByCurrentUser" type="button" class="btn btn-default btn-xs active">
		<i class="far fa-thumbs-up"></i> {{row.numSupporters}}
	</button>
	<button v-else type="button" class="btn btn-default btn-xs" v-on:click="likeToDiscuss()">
		<i class="far fa-thumbs-up"></i> {{row.numSupporters}}
	</button>
</template>

// Button for adding current user as supporter

<script>
export default {
	props: {
		row: { type: Object, required: true },
		supporterAdded: { type: Function, required: false }	//callback when supporter was added
	},
	
	methods: {
		likeToDiscuss() {
			this.$emit("like", this.row)  // notify parent. Keep in mind that this.row is the old state with numSupportes not yet incremented!
			if (typeof this.supporterAdded === "function") this.supporterAdded(this.row)
		}
	},

}
</script>

<style scoped>
	button.btn-default.active,
	button.btn-default.active:hover {
		background-color: #9C9;
		cursor: default;
	}
	
</style>
<template>
	<button v-if="readOnly" type="button" class="btn btn-default btn-xs disabled">
		<i class="far fa-thumbs-up"></i> {{row.numSupporters}}
	</button>
	<button v-else-if="row.supportedByCurrentUser" type="button" class="btn btn-default btn-xs active">
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
		row: { type: Object, required: true },		//TODO: SupportButton should not know row. It should only now numLikes and alreadyLiked <=> but check with table need at least a PK of row for the callback.  OR:  curry the callback function
		supporterAdded: { type: Function, required: false },	//callback when supporter was added
		readOnly: { type: Boolean, required: false, default: function() { return false } },   // if true, then support button is inactive
	},
	methods: {
		likeToDiscuss() {
			this.$emit("like", this.row)  // notify parent. Maybe parent want's to reload
			this.row.numSupportes++
			this.row.supportedByCurrentUser = true
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
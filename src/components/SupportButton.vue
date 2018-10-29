<template>
	<div v-if="law">
	  <button v-if="readOnly || createdByCurrentUser" type="button" class="btn btn-default btn-xs disabled">
			<i class="far fa-thumbs-up"></i> {{law.numSupporters}}
		</button>
		<button v-else-if="law.supportedByCurrentUser" type="button" class="btn btn-default btn-xs active">
			<i class="far fa-thumbs-up"></i> {{law.numSupporters}}
		</button>
		<button v-else type="button" class="btn btn-default btn-xs" v-on:click="likeToDiscuss()">
			<i class="far fa-thumbs-up"></i> {{law.numSupporters}}
		</button>
	</div>
</template>


<script>
/**
 * Button for adding current user as supporter for an idea or proposal.
 */
export default {
	props: {
		law: { type: Object, required: false },
		supporterAdded: { type: Function, required: false },	//callback when supporter was added
		readOnly: { type: Boolean, required: false, default: function() { return false } },   // if true, then support button is inactive
	},
	computed: {
		createdByCurrentUser: function() {
			return this.law.createdBy.id == this.$root.currentUser.id
		}
	},
	methods: {
		likeToDiscuss() {
			this.$emit("like", this.law)  // notify parent. Maybe parent want's to reload
			this.law.numSupportes++
			this.law.supportedByCurrentUser = true
			if (typeof this.supporterAdded === "function") this.supporterAdded(this.law)
		}
	},

	created() {
		//console.log("SupportButton", this.law)
	}

}
</script>

<style scoped>
	button.btn-default.active,
	button.btn-default.active:hover {
		background-color: #9C9;
		cursor: default;
	}
	button.btn-default.disabled {
		cursor: default;
	}
</style>
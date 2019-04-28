<template>
	<div v-if="law" class="container">
  	<h1>{{law.title}}</h1>

		<law-panel :law="law" :showTimeline="false" :readOnly="false"></law-panel>

	</div>
</div>
</template>

<script>
import moment from 'moment'
import LawPanel from '../components/LawPanel'



export default {
	props: {
		'lawId': { type: String, required: true }
	},

	data () {
    return {
      law: null,
		}
	},

	components: {
		'law-panel': LawPanel
	},

	computed: {
	},


  methods: {

  },

	created () {
		this.$root.api.getLaw(this.lawId, /*load projection*/true).then(law => { this.law = law	})
	},
}
</script>

<style scoped>

</style>


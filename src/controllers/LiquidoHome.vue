<template>
	<div class="container">
		<h1>Liquido</h1>
		<p class="lead">A modern aproach for interactive, representative and direct democracy.</p>
		<hr>
		<div class="row">
			<div class="col-sm-6">
				<h2>Dev Links</h2>
				<p>Some quick links for development:</p>
				
				<h2>Laws</h2>
				<ul>
					<li v-for="law in laws">{{ law.title }} ({{ law.id}})<br>
						<router-link :to="{ path: '/showLaw', query: { lawId: law.id }}">Show</router-link> |
						<router-link :to="{ path: '/editLaw', query: { lawId: law.id }}">Edit</router-link> |
						<router-link :to="{ path: '/castVote', query: { lawId: law.id }}">Cast Vote</router-link>
					</li>
					<li v-if="laws.length == 0">
						No laws yet ...
					</li>
				</ul>
			</div>

			<div class="col-sm-6">
				<h2>Your proxies</h2>
				<p>A proxy is someone you trust. You can delegate your vote to this person, so that he can vote for you in one area.</p>
				<p><router-link to="/proxies" role="button" class="btn btn-default">Show proxies &raquo;</router-link></p>

				<h2>Admin Links</h2>
				<ul>
					<li><router-link to="/categories">Manage Categories</router-link></li>
					<li>Some more admin stuff</li>
				</ul>     

			</div>
		</div>
	</div>
</template>

<script>
export default {
	data () {
		return {
			laws: []
		}
	}
}
</script>

<style>
</style>

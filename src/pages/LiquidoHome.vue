<template>
	<div class="container">
		<h1>Liquido</h1>
		<p class="lead">A modern aproach for interactive, representative and direct democracy.</p>
		<hr>
		<div class="row">
			<div class="col-sm-6">
				<h3>Democracy</h3>
				<p>Most states nowadays have a democratically elected government which is a good thing. There are differnent
				 forms of democracy. Indirect democracy where people elect a parliamt. And direct democracy where every voter
				 can directly cast his vote in an election without any intermediate.</p>
				<h3>Proxy Voting</h3>
				<p>A very modern form of democracy is <em>proxy voting</em> where a member may delegate his or her voting power to a
					representative. It is possible that many voters delegate their vote to the same proxy. For example one may delegate
					one's vote to an expert in a certain area, or to a political party as in most current systems. Then this proxy
					can vote with his own vote and all the votes that have been delegated to him. Delegation can be transitive,
					meaning that a proxy can in turn delegate all his votes to another parent proxy. This way a tree hierarchy
					of proxies evolves where the voting power culminates at the top.</p>
					<p>In Liquido a member may revoke the delegation of his voting power from a proxy at any time. Then this voter
					 can (and should!) cast a vote on his own. This way the tree of delegations always changes. It's kind of <em>liquid</em>.</p>
			</div>

			<div class="col-sm-6">
				<h3>Liquido</h3>
				<ul>
					<li>In Liquido it is always possible to cast a vote yourself. No matter if you have delegated your vote to a proxy.
					  Even if the proxy has already casted his vote, it is possible to overrride this decission as long as the voting phase of a poll
					  is still open.</li>
					<li>Ideas must first reach a certain number of supporters before they can become a proposal.</li>
					<li>Proposals can then be joined to polls.</li>
					<li>Voters cast their votes into polls as long as the voting phase is open</li>
					<li>The proposal with the most votes becomes a law.</li>
				</ul>

				<p>&nbsp;</p>
				<p v-if="$root.currentUser === undefined" class="text-center">
					<router-link to="/login"    role="button" class="btn btn-default loginButton">Login</router-link>
					<router-link to="/register" role="button" class="btn btn-default">Register</router-link>
				</p>

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

<style scoped>
.loginButton {
	margin-right: 3em;
}
</style>

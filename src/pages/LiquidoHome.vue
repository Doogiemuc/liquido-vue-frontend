<template>
	<div class="container" id="LiquidoHome">
		<h1>Liquido</h1>
		<p class="lead">A liquid aproach to direct democracy.</p>
		<hr>
		<div class="row">
			<div class="col-sm-6">
				<h3>Democracy</h3>
				<blockquote>(Greek: δημοκρατία dēmokratía, literally "rule by people") is a form of government in which the people have the authority to choose their governing legislature.
					Generally there are two types of democracy, direct or representative. In a direct democracy, the people directly deliberate and decide on legislature.
					In a representative democracy the people elect representatives to deliberate and decide on legislature, such as in parliamentary or presidential democracy. Combining those basic types is done in liquid democracy.
					<footer class="pull-right"><a href="https://en.wikipedia.org/wiki/Democracy">https://en.wikipedia.org/wiki/Democracy</a></footer>
				</blockquote>
			</div>
			<div class="col-sm-6">
				<h3>Liquido</h3>
				<p>is a web based implementation of Liquid Democracy with no central authority. The whole democratic process is decentralized:</p>
				<ul>
					<li>Anyone may suggest an <b>idea</b>.</li>
					<li>When an idea reaches its quorum, it becomes a <b>proposal</b>.</li>
					<li>When a <b>poll</b> is created, then further alternative proposals may join this poll.</li>
					<li>All proposals in the poll can now be further discussed and continuusly elaborated.</li>
					<li>After a few days the <b>voting phase</b> of the poll starts automatically.</li>
					<li>In Liquido you don't just vote for one of several propsals, instead you <b>sort proposals</b> into your personally preferred order.</li>
					<li>When the voting phase of a poll is finished, then the winning proposal is calculated with the well researched <a href="https://en.wikipedia.org/wiki/Ranked_pairs">Ranked Pairs</a> electoral system.</li>
				</ul>
			</div>

			<div class="col-sm-6">
				<h3>Liquid Democracy</h3>
				<blockquote>(also known as delegative democracy) is a form of democracy whereby an electorate has the option of vesting voting power in delegates rather than voting directly themselves. 
					Voters can either vote directly or delegate their vote to other participants; voters may also select different delegates for different issues.
					<footer class="pull-right"><a href="https://en.wikipedia.org/wiki/Liquid_democracy" class="quoteSource">https://en.wikipedia.org/wiki/Liquid_democracy</a></footer>
				</blockquote>
			</div>
			<div class="col-sm-6">	
				<h3>Tree of proxies</h3>
				<p>A proxy may in turn delegate all his collected rights to vote to another parent proxy. This way a tree of proxies evolves 
					where the voting power culminates at the top. You can always see who is your effective proxy at the top of this chain.</p>
				<p> In Liquido you as a voter may <b>always</b> cast a vote on his own, also when a proxy is assigned. You can even overrule an already 
					casted vote of your proxy in a poll (as long as the poll is still in its voting phase).
					A proxie's vote will never overrule a personally casted vote from a voter. And a voter may completely revoke his delegation to a proxy at any time.</p>
				<p>This way the tree of delegations is in a constant state of change - it's kind of <em>liquid</em>.</p>

				<p>&nbsp;</p>
				<p v-if="$root.currentUser === undefined" class="text-center">
					<router-link to="/login"    role="button" id="HomePageLoginButton" class="btn btn-default loginButton">Login</router-link>
					<router-link to="/register" role="button" id="RegisterButton" class="btn btn-default">Register</router-link>
				</p>

			</div>
		</div>
	</div>
</template>

<script>
export default {
	// No logic in this simple Vue component
}
</script>

<style scoped>
blockquote {
	font-size: 14px;
	padding: 5px 0 5px 10px;
	margin-bottom: 0;
}
.quoteSource {
	float: right;
}
.loginButton {
	margin-right: 3em;
}
</style>

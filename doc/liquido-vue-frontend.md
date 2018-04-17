# Frontend for Liquido written in Vue.js with WebPack
    
## Happy Case

Make this work first

*User A*
 1. Create new idea
 3. Simulate getting enough supporters => Idea becomes a proposal
 4. Start a new poll

*User B*
 5. Create a second idea
 6. Add supportes to it so that it becomes a proposal.
 7. Join poll of user A. User A gets message (on UserHome) that user B joined the poll.
 8. Wait for Minimum time of elaboration phase.

 9. Voting of poll starts.
 


# Domains

## Ideas

When an idea has enough supporters, it becomes a proposal.

## Proposals

What can be done with a proposal ("actions"):

If it not my own proposal
 - Like proposal
 - Suggest an improvement ("add comment")   => see github discussions layout
 - Like/upvote a comment
 
If this is my own proposal
 - Start a completely new poll
 - Merge my proposal into another poll (which must be in elaboration phase). 
   - search for poll in elaboration   or   "add my proposal to this poll"
   - Move my proposal to another poll. Of course only as long as both polls are still in elaboration.   => NOT MVP

MAYBE: Join proposals?  => Join supporters?  Open questions: Which description to keep?
	 
## Polls

*Use Case:* Start a new poll

After an idea became a proposal the creator may 
 - either start a new poll with his proposal as the initial proposal
 - or he may join an already existing poll.

Voting starts n days after the poll was created, when there are at least two alternative proposals.

# GUI
 
### UI Component: Quick info about a poll (components/PollPanel.vue)

Show quick and small overview of a poll. No timeline. Initially only show title of proposals. But can be expanded in heigt to show descriptions and additional infos.
 
### UI Page: Show a poll  (pollShow.vue)

Show the poll's timeline: created --(elaboration phase)--> voting starts --(voting phase)--> completed
Show all alternative proposals within a poll. Add comment to proposal.

### UI Page: (pollVote.vue)

Cast you vote, ie. sort proposals into your personally preferred order.


### UI Page flow

 - Recent messages show that idea reached its quorum.
 - When creator views his own proposal, he (and only him) sees an action to "Create a new poll" or "Join existing poll".
 - When user views a poll and has a proposal that is not yet part of another poll, then he sees an action to join this poll.



    


# Backlog / Roadmap

 - Bootstrap [Nav Pills as Arrows](https://benjii.me/2014/03/wizard-style-navigation-tabs-for-bootstrap/)   *DONE*
 
 - Try [vue2-datatable-component](https://onewaytech.github.io/vue2-datatable/examples/dist/#)  supports folding and grouping

 - How to handle events that should buuble up [My Forum post](https://forum.vuejs.org/t/a-call-for-bringing-back-broadcast-events/6067)

 - Flash messages: 
   - Show confirmation and error messages that disapear (like in JIRA at the top right)
   - Show introduction at the top of pages like UserHome when visiting a page for the first time.

## Thoughts about IDs

URIs are nice as IDs to reference models. But they are bad for passing them as URL parameters. Extraxt the numerical ID?

# References

 - [Bootstrap](http://getbootstrap.com/)
 - [VueJS Guide](http://vuejs.org/guide/)
 - [Awesome Vue](https://github.com/vuejs/awesome-vue)  Links to further Vue resources
 - [Vue Webpack Template Doc](http://vuejs-templates.github.io/webpack/index.html)
 - [VueJS Testing](http://www.slideshare.net/coulix/vuejs-testing)

    
## Acess Codes

### Mongo Database at mlab.com

[Node.js Mongo Driver Reference Documentation](http://mongodb.github.io/node-mongodb-native/2.1/api/)

http://mlab.com   "Doogie" - new pwd

connect to DB  (wiht lion pwd)
`mongo ds019664.mlab.com:19664/liquido-test -u testuser -p`

mLab.com  REST API Key   1crkrQWik4p98uPiOzZiFG0Fkya0iNiU
`GET https://api.mlab.com/api/1/databases?apiKey=1crkrQWik4p98uPiOzZiFG0Fkya0iNiU`

Export collection
`mongoexport -h ds019664.mlab.com:19664 -d liquido-test -c ideas -u dummy  -o ideas.json`





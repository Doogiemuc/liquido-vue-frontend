# Frontend for Liquido written in Vue.js with WebPack
    
# User Stories

## Happy Case

Make this work first

 # Login
 # Create new idea
 # Simulate getting enough supporters => Idea becomes a proposal
 # START a new poll
 # Simulate second idea, add supportes to it, becomes a proposal and then JOINS poll
 # User gets message (on UserHome) that he can now start the voting phase
 # Start voting phase

## Pages

### Proposals

Do I want to have the same page for ideas and proposals?

What can be done with a proposal ("actions"):
If it not my own proposal
 - Like proposal
 - Suggest an improvement ("add comment")   => see github discussions layout
 - Like/upvote another comment
If this is my own proposal
 - Start a completely new poll
 - Merge my proposal into another poll (which must be in elaboration phase). 
   - search for poll in elaboration   or   "add my proposal to this poll"
   - can i change my mind and move my proposal to another poll?  (of course only as long as both polls are still in elaboration).



### Polls

When does voting start?
 - At the earliest when there are at least two alternative proposals
 - Optional/Configurable: At the earliest [two weeks] after the poll was created. (to give alternative proposals some time to reach their quorum and be elaborated)
 - 
    


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





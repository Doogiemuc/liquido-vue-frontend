# Frontend for Liquido written in Vue.js with WebPack
    
# Backlog User Stories 

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

### Mongo Database as mlab.com

[Node.js Mongo Driver Reference Documentation](http://mongodb.github.io/node-mongodb-native/2.1/api/)

http://mlab.com   "Doogie" - new pwd

connect to DB  (wiht lion pwd)
`mongo ds019664.mlab.com:19664/liquido-test -u testuser -p`

mLab.com  REST API Key   1crkrQWik4p98uPiOzZiFG0Fkya0iNiU
`GET https://api.mlab.com/api/1/databases?apiKey=1crkrQWik4p98uPiOzZiFG0Fkya0iNiU`

Export collection
`mongoexport -h ds019664.mlab.com:19664 -d liquido-test -c ideas -u dummy  -o ideas.json`





/** 
 Rest client for our HATEAOS REST API
 
 https://github.com/marmelab/restful.js
 
 Restful.js thinks in Collections -> Members -> Entities -> Body -> Data
 
  var lawCollection = api.all("laws")
  var lawMember     = api.one("laws", 1)
  
  var lawCollection.getAll().then(response => { 
    const lawEntities = response.body() 
    lawEntities.foreach(lawEntity => {
      const law = lawEntity.data()
      law.title = "New Title";
    })
  })

  var lawMember.get().then(response => { response.body().data() })
 
 */

import 'whatwg-fetch'
import restful, { fetchBackend } from 'restful.js'

const api = restful('http://localhost:8090/liquido/v2', fetchBackend(fetch));     //TODO:  move base URL to confi
const ideasCollection = api.all('ideas')     						            // http://localhost/liquido/v2/ideas
const recentIdeas = api.custom('ideas/search/recentIdeas')	        // http://localhost/liquido/v2/ideas/recentIdeas
const usersCollection = api.all('users')                            // http://localhost/liquido/v2/users
const lawsCollection = api.all('laws')
const openForVotingProposals = api.custom('laws/search/findByStatus?status=VOTING')

//TODO: add global AuthToken:   api.header('AuthToken', 'test');

api.on('error', (error, config) => {
  console.log("ERROR in RestClient.js: ", error)
})

var stripBasePath = function(URI) {
  if (URI.indexOf(process.env.backendBaseURL) == 0) {
    return URI.substring(process.env.backendBaseURL.length+1, URI.length)
  } else {
    return URI
  }
}

module.exports = {
  // get the 10 monst recently updated ideas
  getRecentIdeas: function() {
    return recentIdeas.get().then(response => {
      var recentIdeas = response.body().data()._embedded.ideas   // *sic*  diggin' deep :-(
      console.log("RestClient.getRecentIdeas()", recentIdeas)
      return recentIdeas
    })
    .catch(err => {
      console.log("ERROR in getRecentIdeas: ", err)
    })
  },

  // get proposals that are currently open for voting
  getOpenForVotingProposals: function() {
    return openForVotingProposals.get().then(response => {
      var openForVotingProposals = response.body().data()._embedded.laws
      console.log("RestClient.getopenForVotingProposals(): ", openForVotingProposals)
      return openForVotingProposals
    })
    .catch(err => {
      console.log("ERROR in getOpenForVotingProposals: ", err)
    })
  },

  // add user as supporter for the passed idea
  // Supporter will only be added once. Spring data automatically prevents duplicates without any error. *NICE*
  addSupporter: function(idea, user) {
    console.log("RestClient: addSupporter(idea=", idea, "user=", user, ")")
    if (user === undefined || idea === undefined) {
      console.log("WARN: Cannot addSupporter(): Idea and user must be defined.")
      return
    }

    var supportersEndpoint = stripBasePath(idea._links.supporters.href)
    var supportersCollection = api.all(supportersEndpoint)
    var userURI = user._links.self.href
    console.log("POST userURI="+userURI+" to ", supportersCollection.url())
    var params = {}
    var headers = {'Content-Type' : 'text/uri-list'}
    return supportersCollection.post(userURI, params, headers)
    .catch(err => {
      console.log("ERROR: ", err)
    })
  },

  uri2Id: function(uri) {
    if (typeof uri !== "string") throw "RestClient.uri2Id  needs string!"
    var matches = uri.match(/http.*\/(\d+)/)   // also matches https!
    return matches[1]   // first match is whole string, second item in array is number at the end
  },

  usersCollection: usersCollection,
  ideasCollection: ideasCollection,

}


<template src="../views/ideas.html"></template>

<script>


export default {
  data () {
    return {
      // Data for DoogieTable.vue
      ideaResource: this.$resource(
        'https://api.mlab.com/api/1/databases/liquido-test/collections/ideas/{id}', 
        { 'apiKey' : '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' }
      ),
      ideaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: true  },
        { title: "Created By", path: "createdBy.$oid" },
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' }
      ],
      ideaKey: "_id.$oid",
      ideaTexts: {
        addButton: "Add Idea",
        searchFilter: "Search/Filter"
      },  
    }
  },

  events: {
    // called when a value was changed (DoogieTable already handled saving to DB)
    'saveNewValue': function(rowId, key, value) {
      console.log("saveNewValue event in parent:", rowId, "#"+key+"#", value);
    }, 
    'addButtonClicked': function() {
      console.log('addButtonClicked in Ideas.vue')
      //TODO: open create new Idea page (or popup?)
    },
    'DoogieTable:dataLoaded': function(ideas) {
      // load user for each Id in ideas
      var userService = this.$root.$services.userService
      ideas.forEach((idea) => {
        userService.getById(idea.createdBy.$oid).then(function(user) {
          console.log("got user=", user)
          //TODO: update rowData for this idea
          //idea.createdBy.name      = user.name
          //idea.createdBy.avatarURL = user.profile.avatarURL
        })  
      })
      
      
      
      
      
    }
  },

  ready () {
    
  }
  
}
</script>

<style>
</style>

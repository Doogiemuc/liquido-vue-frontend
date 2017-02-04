<template src="../views/ideas.html"></template>

<script>
import DoogieTable from '../components/DoogieTable'

export default {
  data () {
    return {
      // Data for DoogieTable.vue
      ideaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: true  },
        { title: "Created By", path: "createdBy" ,filter: 'userAvatar', rawHTML: true },
        { title: "Supporters", path: "numSupporters" },
        { title: "Area", path: "area.title" },
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' },
        //TODO:  number of supporters
      ],
      ideaKey: "_links.self.href",
      /*
      ideaTexts: {                //TODO: localize
        addButton: "Add Idea",
        searchFilter: "Search/Filter"
      },
      */
      ideasLoading: true,
      ideas: [],
    }
  },

  components: {
    DoogieTable
  },

  filters: {
    userAvatar(user) {
      return '<img src="'+user.profile.picture+'" />&nbsp;' + user.profile.name
    }
  },

  methods: {
    // the full ideaURI is the rowId in DoogieTable!
    saveNewValue(updatedIdea, ideaURI, key, value) {
      //console.log("saveNewValue event in Ideas.vue:", ideaURI, "#"+key+"#", value);
      var patchedIdea = {} 
      patchedIdea[key] = value    // only send the updated key, e.g. { title: "new title" } in a PATCH request
      this.$root.api.patchIdea(ideaURI, patchedIdea)
    },
    // called when a value was changed (DoogieTable already handled saving to DB)
    'addButtonClicked': function() {
      console.log('addButtonClicked in Ideas.vue')
      this.$router.push('/createNewIdea')
    },
  },

  mounted () {
    //load remote data and replace users
    this.$root.api.fetchAllIdeas().then(ideas => {
      this.ideas = ideas
      this.ideasLoading = false
    })
    .catch(function(err) {
      console.log("ERROR loading Ideas: ", err)
      //TODO: show error to user, e.g. in ideatable
    })
    this.$refs.ideatable.localizedTexts.addButton = "Add Idea"
  },

  
}
</script>

<style>

</style>

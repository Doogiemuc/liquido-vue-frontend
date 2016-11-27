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
        { title: "Created By", path: "createdBy" ,filter: 'userAvatar' },
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' }
      ],
      ideaKey: "_id.$oid",
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
      return /*'<img src="'+user.profile.avatarURL+'" />&nbsp;' + */  user.profile.name
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
  },

  created () {
    //load remote data and replace users
    this.$root.fetchAllIdeas().then(populatedIdeas => {
      this.ideas = populatedIdeas
      this.ideasLoading = false
    })
    .catch(function(err) {
      console.log("ERROR loading Ideas: ", err)
      //TODO: show error to user, e.g. in ideatable
    })
  },

  ready () {
    //console.log("Ideas.ready()")
  }


}
</script>

<style>
</style>

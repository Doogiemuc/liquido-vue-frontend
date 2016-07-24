<template src="../views/ideas.html"></template>

<script>

import Vue from 'vue'
import VueTables from 'vue-tables'
import moment from 'moment'

export default {
  events: {
    // called when a value was changed (DoogieTable already handled saving to DB)
    'saveNewValue': function(rowId, key, value) {
      console.log("saveNewValue event in parent:", rowId, "#"+key+"#", value);
    } 
  },

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

  ready () {
    
  }
  
}
</script>

<style>
</style>

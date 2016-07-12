<template src="../views/ideas.html"></template>

<script>

import Vue from 'vue'
import VueTables from 'vue-tables'
import moment from 'moment'

Vue.use(VueTables.client, {});

var localizeDate = function(dateVal) {
  return moment(dateVal).format('L'); 
}

// returns a localized string how far dataVal is in the past, e.g. "2 month ago"
var fromNow = function(dateVal) {
  return moment(dateVal).fromNow(); 
}

var editableCell = function(rowId, colName, value) {
  var cellId = rowId+'_'+colName;
  return '<span id="'+cellId+'">'+value+'</span>' +
    '<span class="glyphicon glyphicon-edit pull-right" style="cursor:pointer; visibility: hidden;"></span>';
    
}

export default {
  methods: {
    deleteMe: function(evt) {
      console.log("evt=", evt);
    },
  },

  data () {
    // data for https://github.com/matfish2/vue-tables
    return {
      loading: true,
      ideaColumns: ['title', 'description', 'createdBy', 'createdAt', 'updatedAt'],
      ideaData: [],
      ideaOptions: {
        //dateColumns: ['createdAt', 'updatedAt'],
        dateFormat: 'DD.MM.YYYY',
        headings: {
          title: 'Title',
          description: 'Description',
          createdBy: 'Created By',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
        compileTemplates: true,  // compile vue.js logic on templates.
        templates: {
          description: function(row) {
            // A lot of vue magic is happening here:
            // - These values are passed as literal strings and not as dynamic JS values with leading ":" see https://vuejs.org/guide/components.html#Literal-vs-Dynamic
            // - 
            return '<editable-cell row-id="'+row._id.$oid+'" key="description" value="'+row.description+'"></editable-cell>'
          },
          createdBy: function(row) {
            return row.createdBy.$oid
          },
          createdAt: function(row) {
            return localizeDate(row.createdAt.$date)
          },
          updatedAt: function(row) {
            return fromNow(row.updatedAt.$date)
          },
          del: function(row) {
            return "<a href='javascript:void(0);' @click='$parent.deleteMe(\""+row._id.$oid+"\")'><i class='glyphicon glyphicon-remove'></i></a>"
          }
        },
        skin: 'table-bordered table-condensed table-hover',
        //TODO: onRowClick: function(row) { editIdea(row._id.$oid }
      }
    }
  },

  
  ready () {
    this.loading = true
    var params = {}  //for example { q: "{ title: { $regex: 'idea', $options: 'i' }}" }  for a search query
    
    this.resource = this.$resource(
      'https://api.mlab.com/api/1/databases/liquido-test/collections/ideas', 
      { 'apiKey' : '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' }
    );
    
    this.resource.get(params).then((response) => {
      console.log(response.json())
      this.ideaData = response.json();
      this.loading = false
      this.$watch('page', function() {
        console.log("page has changed")
      })
    }, (err) => {
      //TODO: show error message to user  (reload button?)
      console.error(err)
    })
  }
  
}
</script>

<style>
.VueTables__table td:hover span.glyphicon-edit {
  visibility: visible !important;
}
</style>

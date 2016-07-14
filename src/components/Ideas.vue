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
    loadData: function() {
      this.loading = true
      var params = {}  //for example { q: "{ title: { $regex: 'idea', $options: 'i' }}" }  for a search query
      this.ideasRes.get(params).then((response) => {
        console.log(response.json())
        this.ideaData = response.json();
        this.loading = false
      }, (err) => {
        //TODO: show error message to user  (reload button?)
        console.error(err)
      })
    },
    deleteRow: function(evt) {
      console.log("deleteRow=", evt);
    }
  },

  events: {
    'saveNewValue': function(rowId, key, value) {
      console.log("saveNewValue event in parent:", rowId, "#"+key+"#", value);

      var data = { "$set" : {} }
      data["$set"][key] = value
      this.ideasRes.update({id: rowId}, data)
      .then((response) => { console.log(response) })

      /*  or in plain JQuery
      var apiKey = '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU'
      $.ajax( { 
        url: 'https://api.mlab.com/api/1/databases/liquido-test/collections/ideas/'+rowId+'?apiKey='+apiKey,
        data: JSON.stringify(data),
        type: "PUT",
        contentType: "application/json" 
      } )
      .fail(function( jqXHR, textStatus, errorThrown ) {
        console.error("Could not update value: ", textStatus, errorThrown)
      })
      .done(function( data, textStatus, jqXHR ) {
        console.log("successfully updated value:", data, textStatus)
      });
      */
    } 
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
          title: function(row) {
            // A lot of vue magic is happening here:
            // - Cells in this column are editable-cells, a Vue component
            // - Propety values are passed to this child component as literal strings and not as dynamic JS values with leading ":" see https://vuejs.org/guide/components.html#Literal-vs-Dynamic
            // - The editable cell will fire a 'saveNewValue' event when the value was changed.
            return '<editable-cell row-id="'+row._id.$oid+'" key="title" value="'+row.title+'"></editable-cell>'
          },
          description: function(row) {
            return '<editable-cell row-id="'+row._id.$oid+'" key="description" value="'+row.description+'"></editable-cell>'
          },
          createdBy: function(row) {
            //TODO: fetch username from DB (via User Service that returns a model)
            return row.createdBy.$oid
          },
          createdAt: function(row) {
            return localizeDate(row.createdAt.$date)
          },
          updatedAt: function(row) {
            return fromNow(row.updatedAt.$date)
          },
          del: function(row) {
            return "<a href='javascript:void(0);' @click='$parent.deleteRow(\""+row._id.$oid+"\")'><i class='glyphicon glyphicon-remove'></i></a>"
          }
        },
        skin: 'table-bordered table-condensed table-hover',
      }
    }
  },

  // load data when table component is ready
  ready () {
    // create vue-resource for Ideas
    this.ideasRes = this.$resource(
      'https://api.mlab.com/api/1/databases/liquido-test/collections/ideas/{id}', 
      { 'apiKey' : '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' }
    );
    this.loadData()
    //TODO
    /*
    this.$watch('page', function() {
      console.log("page has changed")
    })
    */
  }
  
}
</script>

<style>
.VueTables__table td:hover span.glyphicon-edit {
  visibility: visible !important;
}
</style>

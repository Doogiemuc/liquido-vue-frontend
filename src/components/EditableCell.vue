
<template>
  <div>
    <span v-bind:id="cellId">{{value}}</span>
    <span class="glyphicon glyphicon-edit pull-right invisible" style="cursor:pointer" @click="startEdit"></span>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  methods: {
    // show x-editable popup when user clicks on the edit icon
    startEdit: function(evt) {
      evt.stopPropagation();
      $("#"+this.cellId).editable('show');
    },

    // this is called when the user clicks on the save icon in the x-editable popup
    // Here in the editable-cell we will update our local value and update the path in the row object.
    // Since this is a reference into our parents rowData, this will automatically be up to date.
    // At last we emit an event that will bubble up to our parent table component.
    // We will not do any database updates here. This is the responsibility of the parent component.
    saveNewValue: function(params) {
      this.value = params.value
      Vue.parsers.path.setPath(this.row, this.path, this.value)  // set value in row object (this will also update parent rowdata!)
      this.$emit('saveNewValue', this.rowId, this.path, this.value)
    }
  },

  props: {
    row: Object,        // row from table data
    rowId: String,      // primary key for this document (=row in table)
    path: String,       // path to attribue in row Object, e.g. "user.profile.email"
    value: String,
  },

  computed: {
    cellId: function() {                    // unique ID for this cell
      return this.rowId + '_' + this.path;
    }
  },

  mounted () {
    //console.log("cell is ready:", this.row, this.rowId, this.path, '"'+this.value+'"');
    $("#"+this.cellId).editable( {
      send: 'never',
      toggle: 'manual',
      type: 'text',
      name: this.path,
      url: this.saveNewValue, // Call our own function, instead of sending an AJAX request.
      pk: this.rowId,
      title: 'Edit '+this.path,
      error: function(errors) {
        console.log("Cannot save value in x-editable:", errors);
        return "Cannot save "+this.path;  //TODO: localize (on the client!)
      }
    } );


  }
}
</script>

<style>
td:hover span.glyphicon-edit {
  visibility: visible;
}
</style>
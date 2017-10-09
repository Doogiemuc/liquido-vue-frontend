
<template>
  <div>
    <span v-bind:id="cellId">{{currentValue}}</span>
    <span class="glyphicon glyphicon-edit pull-right invisible" style="cursor:pointer" @click="startEdit"></span>
  </div>
</template>

<script>
import Vue from 'vue'

/*
  An editable cell. Its content can be edited in a little popup. (x-editable)

  Usage:

   <editable-cell
    :row="row"
    :row-id="getPath(row, primaryKeyForRow)"
    :path="col.path"
    :value="getPath(row, col.path)" >
   </editable-cell>
*/


// Helper function that sets a path (given as string) inside an object to a value
function setPath(obj, prop, value) {
    if (typeof prop === "string")
        prop = prop.split(".");

    if (prop.length > 1) {
        var e = prop.shift();
        setPath(obj[e] = Object.prototype.toString.call(obj[e]) === "[object Object]" ? obj[e] : {},
                prop,
                value);
    } else
        obj[prop[0]] = value;
}


export default {
  props: {
    row: Object,        // row from table data
    rowId: String,      // primary key for this document (=row in table)
    path: String,       // path to attribue in row Object, e.g. "user.profile.email"
    value: String,      // INITIAL value of the editable cell  (props should not be mutated in vue!)
  },

  data () {
    return {
      currentValue: this.value
    }
  },

  computed: {
    cellId: function() {                    // unique ID for this cell (hashed value of rowId+path)
      var str = this.rowId + this.path;
      var hash = 0, i, chr, len;
      if (str.length === 0) return hash;
      for (i = 0, len = str.length; i < len; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }
  },

  methods: {
    // show x-editable popup when user clicks on the edit icon
    startEdit: function(evt) {
      evt.stopPropagation();
      $("#"+this.cellId).editable('show');
    },

    // this is called when the user clicks on the save icon in the x-editable popup
    // Here in the editable-cell we will update our local currentValue and update the path in the row object.
    // Since this is a reference into our parents rowData, this will automatically be up to date.
    // At last we emit an event that will bubble up to our parent table component.
    // We will not do any database updates here. This is the responsibility of the parent component.
    saveNewValue: function(params) {
      this.currentValue = params.value
      setPath(this.row, this.path, this.currentValue)  // set currentValue in row object (this will also update parent rowdata!)
      this.$emit('saveNewValue', this.row, this.rowId, this.path, this.currentValue)    
    }
  },

  mounted () {
    $("#"+this.cellId).editable({
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
    })
    //console.log("cell is ready:", this.row, this.rowId, this.path, '"'+this.value+'"');
  }
}
</script>

<style>
td:hover span.glyphicon-edit {
  visibility: visible;
}
</style>
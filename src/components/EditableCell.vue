
<template>
  <div>
    <span v-bind:id="cellId">{{value}}</span>
    <span class="glyphicon glyphicon-edit pull-right invisible" style="cursor:pointer" @click="startEdit"></span>
  </div>
</template>

<script>
import Vue from 'vue'

/*
  An editable cell. Its content can be edited in a little popup. (x-editable)

  Usage:

   <editable-cell
    pk="some.id"
    path:"deep.path.to.value"
    :value="Initial Value that can be edited" >
   </editable-cell>
*/


export default {
  props: {
    pk: String,         // Value of primary key / ID of current entity
    column: Object,     // column that is beeing edited. "col.path" is JSON path to value in entity!
    value: String,      // INITIAL value of the editable cell  (props should not be mutated in vue!)
  },

  /*
  data: function() {
    return {
      currentValue: this.initialValue
    }
  },
  */

  computed: {
    cellId: function() {                    // unique ID for this cell (hash of initialValue)
      var str = this.value
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

  watch: {
    value: function(newVal) {
      console.log("Value of "+this.cellId+" changed to "+newVal)
    }
  },

  methods: {
    // show x-editable popup when user clicks on the edit icon
    startEdit: function(evt) {
      evt.stopPropagation();
      /*
      console.log("Creating x-editable for value "+this.value + " in cellId "+this.cellId)

      if ($("#"+this.cellId).hasClass('editable')) {
        var oldVal = $("#"+this.cellId).editable('getValue', true)
        console.log("==== cell is already editable. oldVal=", oldVal)
        //$("#"+this.cellId).editable('destroy')
      }
      */

      $("#"+this.cellId).editable({
        //send: 'never',
        toggle: 'manual',
        type: 'text',
        title: 'Edit cell',
        value: this.value,
        success: (response, newValue) => {
          //console.log("x-editable success", response, newValue)
          this.saveNewValue(this.pk, this.column, newValue)
        },
        //name: this.path,
        //url: this.saveNewValue, // Call our own function, instead of sending an AJAX request.
        //pk: this.rowId,
        error: function(errors) {
          console.log("Cannot save value in x-editable:", errors);
          return "Cannot save edited cell";  //TODO: localize (on the client!)
        }
      })

      /*
      $('#'+this.cellId).on('hidden', (e, reason) => {
        console.log("hidden "+reason)
        if (reason === 'onblur' || reason === 'cancel') {
          //$("#"+this.cellId).editable('destroy')
        }
      })
      var editableVal = $('#'+this.cellId).editable('getValue', true);
      console.log("Editable value = ", editableVal, this.cellId)
      */


      $("#"+this.cellId).editable('show');
    },

    // this is called when the user clicks on the save icon in the x-editable popup
    // Here in the editable-cell we will update our local currentValue and update the path in the row object.
    // Since this is a reference into our parents rowData, this will automatically be up to date.
    // At last we emit an event that will bubble up to our parent table component.
    // We will not do any database updates here. This is the responsibility of the parent component.
    saveNewValue: function(pk, column, newValue) {
      console.log("saveNewValue in EditableCell", pk, column, newValue)
      this.$emit('saveNewValue', pk, column, newValue)    
    }
  },

  mounted () {
    //console.log("cell ", this.cellId, " is ready:", this.value);
  }
}
</script>

<style scoped>
td:hover span.glyphicon-edit {
  visibility: visible;
}
</style>
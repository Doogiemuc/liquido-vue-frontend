<template>
  <span id="{{cellId}}">{{value}}</span>
  <span class="glyphicon glyphicon-edit pull-right" style="cursor:pointer; visibility: hidden;" @click="startEdit"></span>
</template>

<script>
export default {
  methods: {
    startEdit: function(evt) {  
      console.log("showing editable", this)
      evt.stopPropagation();
      $("#"+this.cellId).editable('show');
    },
    // set local vlaue and dispatch an event that propagates upward along the parent chain
    saveNewValue: function(params) {
      this.value = params.value
      this.$dispatch('saveNewValue', this.rowId, this.key, this.value)
    }
  },

  props: {
    rowId: String,
    key: String,
    value: String
  },

  computed: {
    cellId: function() {
      return this.rowId + '_' + this.key;
    }
  },

  ready () {
    //console.log("cell is ready:", this.cellId, this.rowId, this.key, this.value);

    $("#"+this.cellId).editable( {          
      send: 'never',
      toggle: 'manual',
      type: 'text',
      name: this.key,
      url: this.saveNewValue, 
      pk: this.rowId,
      title: 'Edit '+this.key,
      error: function(errors) {
        console.log(errors);
        return "Cannot save "+this.key;  //TODO: localize (on the client!)
      }
    } );
    
    
  }
}
</script>
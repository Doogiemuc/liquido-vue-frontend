<template>
  {{value}}
  <span class="glyphicon glyphicon-edit pull-right" style="cursor:pointer; visibility: hidden;" @click="startEdit"></span>
</template>

<script>
export default {
  methods: {
    startEdit: function(evt) {
      console.log("startEdit:", this.rowId, this.key, this.value);
    },
  },

  props: {
    rowId: String,
    key: String,
    value: String
  },

  ready () {
    console.log("cell is ready:", this.rowId, this.key, this.value);
    //TODO: init x-editable
  }
}
</script>
<template src="../views/createNewIdea.html"></template>

<script>
var ideaService = require('../services/IdeaService.js')
var TinyMceComponent = require('../components/TinyMceComponent.vue')

export default {
  data () {
    return {
      idea: { type: Object, required: true, default: function() {
        return {
          title: "Title of your idea",
          description: "Describe what your idea will improve."
        }
      }}
    }
  },

  components: {
    'tinymce' : TinyMceComponent
  },

  methods: {
    saveIdea() {
      console.log("Saving idea", this.$refs.ideaDescriptionEditor.getContent());
      //TODO: ideaService.insert()
    }
  },

  ready () {
    //console.log("CreateNewIdea.vue: ready")
  },

  beforeDestroy: function() {
    //console.log("CreateNewIdea.vue: beforeDestory")
  }

}
</script>


<style>

</style>

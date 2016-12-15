<template src="../views/createNewIdea.html"></template>

<script>
var ideaService = require('../services/IdeaService.js')
var TinyMceComponent = require('../components/TinyMceComponent.vue')

export default {
  data () {
    return {
      idea: {
        title: "",
        description: ""
      }
    }
  },

  components: {
    'tinymce' : TinyMceComponent
  },

  methods: {
    saveIdea() {
      console.log("Saving idea: this.idea=", this.idea, "description=", this.$refs.ideaDescriptionEditor.getContent());
      //TODO: ideaService.insert()
    }
  },

  events: {
    'update-content' : function(msg) {
      console.log("======== CreateNewIdea: TTT event: ", msg)
      this.idea.description = msg
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

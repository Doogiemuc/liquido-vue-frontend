<template src="../views/createNewIdea.html"></template>

<script>
var ideaService = require('../services/IdeaService.js')
//var tinymce = require('../../static/js/tinymce/tinymce.min.js')

export default {
  data () {
    return {
      idea: {}
    }
  },

  methods: {
    saveIdea() {
      console.log("Saving idea");
      //TODO: ideaService.insert()
    }
  },


  route: {
    activate: function() {
      console.log("================ CreateNewIdea.vue: route.activate")
    }
  },

  compiled () {
    console.log("CreateNewIdea.vue: compiled")
  },

  activate (done) {
    console.log("CreateNewIdea.vue: activate")
    done()
  },

  ready () {
    console.log("CreateNewIdea.vue: ready")



    // http://stackoverflow.com/questions/17688549/jquery-load-tinymce-4-on-demand
    // http://stackoverflow.com/questions/34059166/vuejs-tinymce-tinymce-is-only-displayed-once
    // https://jsfiddle.net/edwindeveloper90/edjc82z0/
    // http://codegists.com/snippet/vue/tinymce-directivevue_lossendae_vue


    //tinymce.baseURL = '//cdn.tinymce.com/4'
    //tinymce.suffix  = '.min'

    /*
    if (tinymce.get('ideaDescription')) {
      console.log("show editor again")
      tinymce.get('ideaDescription').show()
    }*/
    /*
    tinymce.init({
      selector: '#ideaDescription',
      height: 400,
      menubar: false,
      plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table contextmenu paste code'
      ],
      toolbar: 'undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
      content_css: '//www.tinymce.com/css/codepen.min.css'

    }).then(editors => {
      console.log("TinyMCE init complete!", editors)
    })
    */

    // JSFiddle with TinymCE and Vue-Router   http://jsfiddle.net/NF2jz/5246/
    //tinyMCE.init({mode: "none"})
    //tinyMCE.execCommand('mceAddEditor', true, 'ideaDescription');
  },

  beforeDestroy: function() {
    console.log("==================== CreateNewIdea.vue: beforeDestory")
    //tinyMCE.execCommand('mceRemoveEditor', true, 'tinymce');
  }

}
</script>


<style>

</style>

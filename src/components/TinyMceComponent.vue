
<template>
  <textarea :id="textareaId" :placeholder="placeholder"></textarea>
</template>

<script>
/*************
  Vue component for a tinyMCE WYSIWYG editor. https://www.tinymce.com
 
  The tinyMCE editor will automatically sync its content with the underlying textarea and the passed 'value' prop.
  See https://vuejs.org/v2/guide/components.html#Form-Input-Components-using-Custom-Events

  Usage:
    <tinymce 
      name="ideaDescription" 
      textarea-id="ideaDescriptionEditor"
      placeholder="placeholderDescription"
      v-model="idea.description"
      ref="ideaDescriptionEditor"
      v-on:input="descriptionTouched">
    </tinymce>

  
********/

//import tinymce from 'tinymce/tinymce';
//import 'tinymce/plugins/placeholder';

var ownChange = false

export default {

  props: {
    textareaId:  { type: String, required: true },                        // id of the textarea == id of tinymce.Editor (without leading '#'!)
    value:       { type: String, required: false, default: function() { return "" }  }, // Content of tinymce editor.
    placeholder: { type: String, required: false, default: function() { return "" }  }, 
    tinyMceConfig: { type: Object, required: false, default: function() {   // TinyMCE default configuration, can be overwritten from parent component
      return {
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table contextmenu paste placeholder'
        ],
        toolbar: 'undo redo | insert | styleselect | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link image charmap',
        statusbar: false
      }
    }}
  },

  watch: {
    // Update the content of the editor, when 'value' was changed from the parent Vue component.
    // => This will emit an input event back to parent.
    // But do not replace the content when 'value' was changed by user input within TinyMCE.
    // => Need to prevent endless circle :-)
    'value': function(newValue) {
      //console.log("TinyMceCompnoent. value of textaera has changed to "+newValue)
      if (ownChange) {
        //console.log("This was my own change, alraedy updated")
        ownChange = false
      } else {
        //console.log("TinyMceCompnoent.setContent  due to change of value")
        this.setContent(newValue)
      }
    }
  },

  methods: {
    /* returns the current content of the tinymce editor */
    getContent() {
      return tinymce.get(this.textareaId).getContent()
    },

    /* completely overwrite and set a new content into the tinymce editor */
    setContent(newContent) {
      tinymce.get(this.textareaId).setContent(newContent)
    },

    /** 
     * Automatically called when the content of the editor has change in any way 
     * Content may have changed either by keypress, unde/redo or via copy&paste.
     * Will $emit an 'input' event that can automatically be handled by v-model. See https://vuejs.org/v2/guide/components.html#Form-Input-Components-using-Custom-Events
     */
    contentUpdated(evt) {
      //console.log("TinyMCE contentUpdated to "+this.getContent()+" $emit 'input' event")
      ownChange = true
      this.$emit('input', this.getContent());
    }
  },

  mounted () {
    //console.log("TinyMceComponent.mounted() id="+this.textareaId)
    
    // load tinymce placeholder plugin from from local static file
    tinymce.PluginManager.load('placeholder', '/static/js/tinymce/plugins/tinymce-placeholder.plugin.js');
    
    this.tinyMceConfig.selector = '#' + this.textareaId
    tinymce.init(this.tinyMceConfig)
    .then(editors => {
      //console.log("TinyMCE initialized. placeholder="+this.placeholder, " value="+this.value, tinymce.editors) 

      // No need to handle any updates between textarea and tinymce's content. tinymce already keeps the text areas content in sync with its content.
      tinymce.get(this.textareaId)
      .on('keyup',  this.contentUpdated)
      .on('change', this.contentUpdated)
      .on('undo',   this.contentUpdated)
      .on('redo',   this.contentUpdated)
    })
  },

  beforeDestroy () {
    //console.log("TinyMceComponent.beforeDestory(): Removing editor")
    //tinymce.get(this.textareaId).remove()   // This is important! Otherwise the editor wouldn't get reinitialized when comming back
    //tinymce.remove('#'+this.textareaId)  does not work
    tinymce.EditorManager.execCommand('mceRemoveEditor',true, this.textareaId);
  }


}


    //Some refs I found while implementing this
    // http://stackoverflow.com/questions/17688549/jquery-load-tinymce-4-on-demand
    // http://stackoverflow.com/questions/34059166/vuejs-tinymce-tinymce-is-only-displayed-once
    // https://jsfiddle.net/edwindeveloper90/edjc82z0/
    // http://codegists.com/snippet/vue/tinymce-directivevue_lossendae_vue
    // JSFiddle with TinymCE and Vue-Router   http://jsfiddle.net/NF2jz/5246/
    // https://github.com/lpreterite/vue-tinymce/blob/master/src/vue-tinymce.js     Full componente  (asian)
    // https://github.com/fergaldoyle/vue-form/blob/master/example/custom-component.html   Form validation with TinyMCE

    //tinymce.baseURL = '//cdn.tinymce.com/4'
    //tinymce.suffix  = '.min'

    //tinyMCE.init({mode: "none"})
    //tinyMCE.execCommand('mceAddEditor', true, 'ideaDescription');

</script>

<style>
</style>
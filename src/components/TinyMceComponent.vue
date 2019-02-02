
<template>
  <textarea :id="textareaId" :placeholder="placeholder">{{value}}</textarea>
</template>

<script>
/*************
  Vue component for a tinyMCE WYSIWYG editor. https://www.tinymce.com

  The tinyMCE editor will automatically sync its content with the underlying textarea and the passed 'value' prop.
  See https://vuejs.org/v2/guide/components.html#Using-v-model-on-Components

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


// When value changes the watcher needs to update the content of tinyMCE
// When the user inputs something in tinyMCE then this needs to be reflected to the parent component
// How to handle both at the same time?
var ownChange = false

export default {

  props: {
    textareaId:  { type: String, required: true },                        // id of the textarea == id of tinymce.Editor (without leading '#'!)
    value:       { type: String, required: false, default: function() { return "" }  }, // Initial content of tinymce editor.
    placeholder: { type: String, required: false, default: function() { return "" }  },
    tinyMceConfig: { type: Object, required: false, default: function() {   // TinyMCE default configuration, can be overwritten from parent component
      return {
        menubar: false,
        plugins: [
          //'advlist autolink lists link image charmap print preview anchor',
          //'searchreplace visualblocks code fullscreen',
          //'insertdatetime media table contextmenu paste placeholder'
          'advlist autolink lists link image charmap table placeholder autoresize',
        ],
        toolbar: 'undo redo | styleselect | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | table | link image charmap',
        statusbar: false,
        autoresize_max_height: 600,
        autoresize_bottom_margin: 20,
      }
    }}
  },

  data () {
    return {
      tinyMceReady: false   // TinyMCE needs some time do get initialized. Before that we must not setContent()
    }
  },

  watch: {
    /**
     This is actually tricky!
     When the 'value' property of this Vue component is changed by the parent Vue component (e.g. v-model)
     then we also need to update the TinyMCE editor's content.
     But this will emit an 'input' event back to the parent component. => Need to prevent endless circle :-)
     And We do NOT want to replace the  content when 'value' was changed by user input within TinyMCE, because
     a call to setContent forces  the cursor to the beginning of the TinyMCE input field.
    */
    'value': function(newValue) {
      //console.log("TinyMceComponent. value.watcher: value property has changed to "+newValue)
      if (ownChange) {
        //console.log("This was my own change, alraedy updated")
        ownChange = false
      } else {
        //console.log("TinyMceCompnoent.setContent due to change of value property")
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
      console.debug("TinyMceComponent.setContent("+newContent+")")
      if (!this.tinyMceReady) {
        console.warn("WARN: TinyMceComponent: cannot setContent, because TinyMCE is not yet ready. "+newContent)
        return      //OR: if (!tinymce.get(this.textareaId).initialized)
      }
      tinymce.get(this.textareaId).setContent(newContent)
    },

    /**
     * Automatically called when the content of the editor has changed in _any_ way.  (Me be called some more often.)
     * Content may have changed either by keypress, unde/redo or via copy&paste.
     * Will $emit an 'input' event that can automatically be handled by v-model. See https://vuejs.org/v2/guide/components.html#Form-Input-Components-using-Custom-Events
     */
    contentUpdated(evt) {
      ownChange = true
      this.$emit('input', this.getContent());
    }
  },

  created() {
    //console.log("TinyMceComponent.created() id="+this.textareaId+", value='"+this.value+"'")
    // load tinymce placeholder plugin from from local static file
    tinymce.PluginManager.load('placeholder', '/static/js/tinymce/plugins/tinymce-placeholder.plugin.js')
    ownChange = false
  },

  mounted() {
    //console.log("TinyMceComponent.mounted() id="+this.textareaId+", value="+this.value)
    this.ownChange = false
    this.tinyMceConfig.selector = '#' + this.textareaId
    tinymce.init(this.tinyMceConfig)
    .then(editors => {
      //console.log("TinyMCE initialized value="+this.value, "content="+this.getContent(), tinymce.editors)
      this.tinyMceReady = true
      this.setContent(this.value)  // make sure that the last version of this.value is aligned with content
      // No need to handle any updates between textarea and tinymce's content. tinymce already keeps the text areas content in sync with its content.
      // TinyMCE's "change" evnet does by far(!) not trigger on all changes. on the other hand, keyup is a bit too much, it also triggers on shift or ctrl. But just to be sure to catch every update
      tinymce.get(this.textareaId)
      .on('change', this.contentUpdated)
      .on('keyup',  this.contentUpdated)
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
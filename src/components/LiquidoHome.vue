<template lang="jade">
extends ../views/layout

block content
  h1 Liquodo
  p.lead A modern aproach to interactive representative direct democracy.
  hr
  .row
    .col-sm-6
      h2 Dev Links
      p Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.
      if laws
        ul
          for law in laws
            li= law.title
              br
              a(href='/showLaw?lawId='+law.id) Show |
              a(href='/editLaw?lawId='+law.id) Edit |
              a(href='/showVote?lawId='+law.id) Vote 
      h2 Heading
      p Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.
      p
        a.btn.btn-default(href='#', role='button') View details »
    .col-sm-6
      h2 Heading
      p Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.
      p
        a.btn.btn-default(href='#', role='button') View details »
      h2 Heading
      p Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui.
      p
        a.btn.btn-default(href='#', role='button') View details »
</template>

<script>
export default {
  data () {
    return {
      laws: []
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h2 {
  color: #42b983;
}
</style>

<template src="../views/ideas.html"></template>

<script>

export default {

  data () {
    return {
      ideaColumns: [
        { name: 'ID', path: '_id.$oid' },
        { name: 'Title', path: 'title' },
        { name: 'Description', path: 'description' }
      ],
      ideasRest: this.$resource(
        'https://api.mlab.com/api/1/databases/liquido-test/collections/ideas', 
        { 'apiKey' : '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' }
      )
    }
  }
  
}
</script>

<style>
</style>

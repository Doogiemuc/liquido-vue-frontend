<template src="../views/home.html"></template>

<script>
export default {
  data () {
    return {
      ideaRest: this.$resource(
        'https://api.mlab.com/api/1/databases/liquido-test/collections/ideas/{id}', 
        { 'apiKey' : '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' }
      ),
      ideaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: true  },
        { title: "Created By", path: "createdBy.$oid" },
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' }
      ],
      ideaKey: "_id.$oid"
    }
  }
}
</script>

<style>
</style>

<template>
  <div class="container">
    Logout
  </div>
</template>

<script>

export default {
  mounted() {
    this.$root.auth.logout()
    iziToast.success({
      title: 'Logout',
      message: 'You have been logged out.',
      //position: 'bottomRight',
    })
    this.$router.push('/')
  }
}
</script>

<style>

</style>

<template>
  <div class="container">
    Logout
  </div>
</template>

<script>

import apiClient from '../services/LiquidoApiClient'

export default {
  mounted() {
    console.log("LOGOUT "+this.$root.currentUser.email)
    apiClient.logout()
    this.$root.currentUser = undefined
    this.$root.currentUserURI = undefined
    //TODO: Show flash message: "You have been successfully logged out."
    this.$router.push("/")
  }

}
</script>

<style>

</style>

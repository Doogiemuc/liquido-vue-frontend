<template>
	<div class="container" id="LoginPage">

		<div class="panel panel-default login-panel">
			<div class="panel-heading">
				<h3 class="panel-title">Login via email</h3>
			</div>
			<div class="panel-body text-center">
				<form accept-charset="UTF-8" role="form" class="loginLinkForm">
					<fieldset>
						<div class="form-group">
							<input class="form-control" id="emailInput" placeholder="your email" name="email" type="text" v-model="email">
						</div>
						<p>An email with a login link will be sent to your email account.</p>
						<button type="submit" id="loginLinkButton" @click.prevent="requestLoginEmail()" class="btn btn-primary" :disabled="!isEmailValid">Send login link</button>
					</fieldset>
				</form>

				<div class="alert alert-success" v-if="emailSuccess">
					<p>Login link has been sent. You may now close this window. Click on the link in the email to login.</p>
				</div>
				<div class="alert alert-danger" v-if="emailErrorMsg">
					<button type="button" class="close" aria-label="Close" @click="emailErrorMsg = ''"><span aria-hidden="true">&times;</span></button>
						<span v-html="emailErrorMsg"></span>
				</div>
			</div>
		</div>
		
		<div class="panel panel-default">
			<div class="panel-heading">
				<h3 class="panel-title">Please install the Authy App</h3>
			</div>
			<div class="panel-body">
				<div clss="row">
					<div class="col-sm-2" style="text-align: center;">
						<a href="https://authy.com/install">
							<img src="/static/img/Authy_App_246.png" class="app-logo">
						</a>
					</div>
					<div class="col-sm-10">
						<p>Login in via email is insecure. In LIQUIDO you can login with your mobile phone.</p>
						<p>Please <a href="https://authy.com/install">install the Authy app.</a> You must use the same mobile number as above when you register in the authy app!</p>
						<p>Authy can then generate time based one time tokens (T-OTP). These are like passwords but a T-OTP is only valid for a short time. Every 20 seconds the Authy App will automatically generate a new 6-digit token.
							This secure token will allow you to login.</p>
						<p class="app-store-imgs">
							<a href="https://authy.com/install"><img src="/static/img/Download_on_the_App_Store_Badge_US.svg" width="135" height="46" style="margin-right: 2rem;"></a>
							<a href="https://authy.com/install"><img src="/static/img/GetItOnGooglePlay.png"></a>
						</p>
					</div>
				</div>
			</div>
		</div>

		<router-link to="/register" role="button" class="btn btn-default pull-right">Register as new user &raquo;</router-link>
		<router-link to="/login" role="button" class="btn btn-primary login-authy-button">&laquo; Login with Authy App</router-link>
		
	</div>
</template>

/**
 * HTML page where the user can login
 */
<script>

import apiClient from '../services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('LoginPage.vue');

// Very simple RegEx for a valid email adress.
const validEMailRe = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export default {
	props: {
		'initEmail': { type: String, required: false, default: "" },
	'initMobilePhone': { type: String, required: false, default: "" },
	'token': { type: String, required: false, default: undefined },   // email login token
	},

	data () {
		return {
			emailSuccess: false,
			emailErrorMsg: '',
			tokenRequested: false,
			tokenErrorMsg: '',
			email: this.initEmail,
			mobilephone: this.initMobilePhone,
			rememberMe: false,
			digits: []            // 6 digit token entered by user
		}
	},

	computed: {
		isDevEnv() { return process.env.NODE_ENV === 'development' },
		authyToken() { return this.digits.join("") },
		isEmailValid() {
			return validEMailRe.test(this.email)
		},
		disableRequestTokenButton() {
			return this.mobilephone.length < 5 // || this.tokenRequested
		},
	},

	mounted() {
		console.log("EmailLoginToken", this.token)
		if (this.email && this.token) {
			this.loginWithEmailToken(this.email, this.token)
		}
	},

	methods: {
		/** only accept digits */
		keypressDigit(digitNo, evt) {
			if (evt.key.match(/[0123456789]/)) {
				this.$set(this.digits, digitNo, evt.key)  // must use Vue's reactive $set, because this.digits is an array
				if ($(evt.target).nextAll("input").length > 0) {
					$(evt.target).nextAll("input")[0].focus()  // focus next input
				}
				if (digitNo == 5) {     // when the sixth digit is entered, then immidiately validate the entered sms token.
					this.loginWithAuthyToken()
				}
			}
		},

		/** request Authy login token */
		requestAuthyToken() {
			this.tokenRequested = true
			this.tokenErrorMsg = ''
			this.digits = []
			this.$root.auth.requestAuthyToken(this.mobilephone).then(res => {
				this.tokenRequested = true
				this.$nextTick(function () {
					$('#digit0').focus()
				})
			}).catch(error => {
				if (error.err.data.liquidoErrorCode === 4 /*CANNOT_LOGIN_MOBILE_NOT_FOUND*/) {
					this.tokenErrorMsg = 'Mobile number unknown.<br/>You must <a href="/#/register">register</a> first.'
				} else {
					this.tokenErrorMsg = "Could not request token."
				}
				this.tokenRequested = false
			})
		},

		loginWithAuthyToken() {
			var authyToken = this.digits.join("")
			this.$root.auth.loginWithToken(this.mobilephone, authyToken)
				.then(user => {
					this.tokenErrorMsg = ""
					iziToast.success({
						id: "LoginSuccess",
						title: 'Login',
						message: 'You are now logged in as '+user.email,
						position: 'bottomRight',
					})
					this.$router.push('/userHome')
				}).catch(err => {
					this.tokenErrorMsg = "This token is invalid."
					this.tokenRequested = false
					log.error("Error in loginWithAuthyToken", err)
				})
	},

	/** send a ling via email */
		requestLoginEmail() {
			this.$root.auth.requestLoginEmail(this.email).then(res => {
				this.emailSuccess = true
			}).catch(error => {
		this.emailSuccess = false
		if (error.data && error.data.liquidoErrorName === "CANNOT_LOGIN_EMAIL_NOT_FOUND") {
			this.emailErrorMsg = "I don't know this email. You must register first."
		} else {
			this.emailErrorMsg = "There was an error while sending the email.<br/>Please try again later."
		}
			})
		},

	loginWithEmailToken() {
		log.debug("Login from email. token="+this.token)
			this.$root.auth.loginWithEmailToken(this.email, this.token)
				.then(user => {
					this.emailErrorMsg = ""
					iziToast.success({
			id: "LoginSuccess",
						title: 'Login',
						message: 'You are now logged in as '+user.email,
						position: 'bottomRight',
					})
					this.$router.push('/userHome')
				}).catch(err => {
					this.emailSuccess = false
					this.emailErrorMsg = "Token from email was not valid."
					log.error("Error in loginWithEmailToken", err)
				})
		},

	},


}
</script>

<style scoped>
.topRow {
	margin-top: 50px;
}
.lastRow {
	margin-top: 50px;
}
/* Make Bootstrap cells in row same hight https://www.codeply.com/go/bp/Cn6fA6LuTq */
.row.equal {
	display: flex;
	flex-wrap: wrap;
}
.login-panel {
	position: relative;
	margin-top: 8rem;
	margin-bottom: 8rem;
}
.login-authy-button {
	margin: 0 auto 3rem auto;
}
@media (min-width: 768px) {
	.login-panel  {
		width: 450px;
		margin-left: auto;
		margin-right: auto;	
	}
}
.phoneForm {
	margin-bottom: 1em;
}
.loginLinkForm {
	margin-bottom: 1em;
}
.digit-group {
	white-space: nowrap;
}
.digit {
	width: 2.5ch;
	height: 24pt;
	font-size: 24pt;
	text-align: center;
	display: inline-block; /* prevent wrapping also on narrow mobile view */
}
#tokenAlert {
	margin-top: 2rem;
}
.app-logo {
	width: 80px;
	height: 80px;
	border-radius: 22.5%;
	margin-right: 1rem;
}
</style>

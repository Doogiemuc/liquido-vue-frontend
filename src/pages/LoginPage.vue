<template>
	<div class="container" id="LoginPage">
		<div class="row topRow">
			<div class="col-md-2 hidden-xs hidden-sm">
				&nbsp;
			</div>

			<div class="col-md-8">
				<div class="panel panel-default">
					<div class="panel-heading">
						<h3 class="panel-title">Login with Authy App</h3>
					</div>
					<div class="panel-body text-center">
						<form accept-charset="UTF-8" role="form" class="phoneForm">
							<fieldset>
								<div class="form-group">
									<input class="form-control" id="phoneInput" placeholder="mobile phone number" name="mobilephone" type="text" v-model="mobilephone">
								</div>
								<button type="submit" id="requestAuthyTokenButton" @click.prevent="requestAuthyToken()" class="btn btn-primary" :disabled="disableRequestTokenButton">Request token</button>
							</fieldset>
						</form>
						<form class="form-inline">
							<fieldset :disabled="!tokenRequested">
								<div class="form-group">
									<p>Request a token and then enter the 6-digit number that is shown in the authy app<br/>(or that you have received via SMS):</p>
									<div class="digit-group" id="authyTokenInputs">
										<input type="text" class="form-control digit" id="digit0" tabindex="1" v-model="digits[0]" v-on:keypress.prevent="keypressDigit(0, $event)">
										<input type="text" class="form-control digit" id="digit1" tabindex="2" v-model="digits[1]" v-on:keypress.prevent="keypressDigit(1, $event)">
										<input type="text" class="form-control digit" id="digit2" tabindex="3" v-model="digits[2]" v-on:keypress.prevent="keypressDigit(2, $event)">
										<input type="text" class="form-control digit" id="digit3" tabindex="3" v-model="digits[3]" v-on:keypress.prevent="keypressDigit(3, $event)">
										<input type="text" class="form-control digit" id="digit4" tabindex="3" v-model="digits[4]" v-on:keypress.prevent="keypressDigit(4, $event)">
										<input type="text" class="form-control digit" id="digit5" tabindex="3" v-model="digits[5]" v-on:keypress.prevent="keypressDigit(5, $event)">
									</div>
								</div>
							</fieldset>
						</form>
						<p></p>
						<div class="alert alert-danger" v-if="tokenErrorMsg">
							<button type="button" class="close" aria-label="Close" @click="tokenErrorMsg = ''"><span aria-hidden="true">&times;</span></button>
							<span v-html="tokenErrorMsg"></span>
						</div>
					</div>
				</div>
			</div>

			<div class="col-md-2 hidden-xs hidden-sm">
				<img src="/static/img/Authy Screenshot with Phone.jpg" height="230"/>
			</div>

		</div>

		<div class="row rowMargin">
			<div class="panel panel-default">
				<div class="panel-heading">
					<h3 class="panel-title">Install the Authy App</h3>
				</div>
				<div class="panel-body">
					<div clss="row">
						<div class="col-sm-2" style="text-align: center;">
							<a href="https://authy.com/install">
								<img src="/static/img/Authy_App_246.png" class="app-logo">
							</a>
						</div>
						<div class="col-sm-10">
							<p>You do not need to remember a password for Liquido. You will login with your mobile phone.</p>
							<p>Please <a href="https://authy.com/install">install the Authy app.</a> You must use the same mobile number in Authy and LIQUIDO!</p>
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
		</div>

		<div class="row rowMargin">
			<div class="col-md-6">
				<router-link :to="{name: 'login-email'}">Login via E-Mail</router-link>
			</div>
			<div class="col-md-6 text-right">
				<router-link to="/register" role="button" class="btn btn-default">Register as new user &raquo;</router-link>
			</div>			
		</div>
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
			return this.mobilephone.length < 5
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
				if (digitNo == 5) {     // when the sixth digit is entered, then immidiately validate the entered token.
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
.rowMargin {
	margin-top: 50px;
}
/* Make Bootstrap cells in row same hight https://www.codeply.com/go/bp/Cn6fA6LuTq */
.row.equal {
	display: flex;
	flex-wrap: wrap;
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

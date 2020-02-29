<template>
	<div class="container" id="RegisterPage">

		<p>&nbsp;</p>

		<div class="row">
			<div class="panel panel-default">
				<div class="panel-heading">
					<h3 class="panel-title">Regsiter as a new user</h3>
				</div>
				<div class="panel-body">
					<form accept-charset="UTF-8" role="form" class="form-horizontal" id="registerForm">
						<div class="form-group form-group-error">
							<label for="inputEmail3" class="col-sm-2 control-label">Email<sup class="required">*</sup></label>
							<div class="col-sm-10">
								<input class="form-control" id="emailInput" name="email" type="text" v-model.trim="email" @blur="$v.email.$touch()">
								<p class="form-error-msg" v-bind:class="{'invisible' : !$v.email.$error}">Email is invalid.</p>
							</div>
						</div>
						<div class="form-group form-group-error">
							<label for="fullnameInput" class="col-sm-2 control-label">Name<sup class="required">*</sup></label>
							<div class="col-sm-10">
								<input class="form-control" id="fullnameInput" name="fullname" type="text" v-model.trim="fullname" @blur="$v.fullname.$touch()">
								<p class="form-error-msg" v-bind:class="{'invisible' : !$v.fullname.$error}">Please enter your full name.</p>
							</div>
						</div>
						<div class="form-group form-group-error">
							<label for="mobilephoneInput" class="col-sm-2 control-label">Mobile phone<sup class="required">*</sup></label>
							<div class="col-sm-10">
								<input class="form-control" id="mobilephoneInput" name="mobilephone" type="text" v-model.trim="mobilephone" @blur="$v.mobilephone.$touch()">
								 <p class="form-error-msg" v-bind:class="{'invisible' : !$v.mobilephone.$error}">Invalid mobile phone number. Enter with country code e.g. +11 234 12345678</p>
							</div>
						</div>
						<div class="form-group">
							<label for="avatar" class="col-sm-2 control-label">Avatar<sup class="required">*</sup></label>
							<div class="col-sm-10">
								<img v-for="i in 16" :key="i" class="chooseAvatar"
									:src="getAvatarPath(i)"
									:class="{ opaqueImg: !isSelectedAvatar(i), selectedAvatar: isSelectedAvatar(i) }"
									@click="chooseAvatar(i)" />
							</div>
						</div>
						<div class="form-group">
							<label for="websiteInput" class="col-sm-2 control-label">Website</label>
							<div class="col-sm-10">
								<input class="form-control" id="websiteInput" name="website" type="text" v-model.trim="website" @blur="$v.website.$touch()">
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div class="row">
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

		<div class="row text-right">
			<p>
				<button v-if="!registerSuccess" type="submit" id="RegisterButton" @click.prevent="register()" class="btn btn-lg btn-primary" :disabled="disableRegisterButton ">Register</button>
			</p>
		</div>

		<div v-if="registerSuccess" id="registerSuccess" class="row alert alert-success">
			<p>You have been registerd successfully. You can now login.</p>
		</div>

		<div class="row text-right" v-if="registerSuccess">
			<router-link :to="{ name: 'login', params: { initEmail: email, initMobilePhone: mobilephone }}" role="button" class="btn btn-lg btn-primary">Login &raquo;</router-link>
		</div>

		<div class="row">
			<alert-panel ref="alertPanel" title="Error" class="alert-danger errorAlert"></alert-panel>
		</div>
	</div>
</template>

/**
 * HTML page for registering as a new user
 */
<script>

import AlertPanel from '../components/AlertPanel.vue'
import { validationMixin } from 'vuelidate'                         // https://monterail.github.io/vuelidate/
import { required, minLength, email } from 'vuelidate/lib/validators'

import loglevel from 'loglevel'
var log = loglevel.getLogger('LoginPage.vue');

/* Validating phone numbers is my favorite example for something
 * that is so unbelievably more complex than you could ever imagine!! :-)
 * Have a look at "Google Phone Lib"
 *
 * This RegExp is from https://stackoverflow.com/questions/2113908/what-regular-expression-will-match-valid-international-phone-numbers
 *
 */
var mobilephoneRegEx = new RegExp(/^(\+|00)(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1) ?\d[\d\- ]{0,14}\d$/)
const validMobilephone = function(mobilephone) {
	return mobilephoneRegEx.test(mobilephone)
}
var validEMailRegEx = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export default {
	data () {
		return {
			email: '',
			fullname: '',
			mobilephone: '',
			website: '',
			pictureURL: '',
			registerSuccess: false
		}
	},

	mixins: [validationMixin],
	validations: {
		email: {
			required, email
		},
		fullname: {
			required, minLength: minLength(3)
		},
		mobilephone: {
			required, validMobilephone
		},
		website: {  }
	},

	watch: {
		// only allow numbers + - and space for mobilephone
		mobilephone: function(newVal) {
			var invalidChars = /[^\+\-\d ]/
			this.$set(this, 'mobilephone', newVal.replace(invalidChars, ''))
		}
	},

	components: {
		'alert-panel' : AlertPanel
	},

	computed: {
		isEmailValid() {
			return validEMailRegEx.test(this.email)
		},
		disableRegisterButton() {
			return this.$v.$anyError || this.$v.$anyDirty === false || this.registerSuccess
		}
	},

	mounted() {
		var rand = Math.floor(Math.random() * 16) + 1;   //randomly select an avatar
		this.chooseAvatar(rand)
		this.registerSuccess = false
		this.$refs.alertPanel.clearAlert()
	},

	methods: {
		register() {
			var newUser = {
				email: this.email,
				profile: {
					name: this.fullname,
					website: this.website,
					picture: this.pictureURL,
					mobilephone: this.mobilephone,
				}
			}
			this.$root.auth.register(newUser).then(res => {
				this.registerSuccess = true
				this.$refs.alertPanel.clearAlert()
				//TODO: forward to login now
			}).catch(err => {
				log.error("Cannot register", err)
				if (err.data && err.data.liquidoErrorName === "USER_EXISTS") {
					var errorMessage = 'This user already exists. Please go to <a href="/#/login">login</a>.'
				} else {
					var errorMessage = "Could not register. Please try again later."
				}
				var errorDetails = JSON.stringify(err)
				this.$refs.alertPanel.showAlert(errorMessage, errorDetails)
			})
		},

		getAvatarPath(i) {
			return '/static/img/avatars/Avatar'+i+'.png'
		},

		isSelectedAvatar(i) {
			return this.pictureURL === this.getAvatarPath(i)
		},

		chooseAvatar(i) {
			this.pictureURL = this.getAvatarPath(i)
		}

	},


}
</script>

<style scoped>
	.chooseAvatar {
		border: 1px solid #FFF;
	}
	.selectedAvatar {
		border: 1px solid #204d74;
	}
	.required {
		color:red;
	}
	.form-group-error {
		animation-name: shakeError;
		animation-fill-mode: forward;
		animation-duration: .6s;
		animation-timing-function: ease-in-out;
	}
	.form-error-msg {
		font-size: 90%;
		color: #a94442;
		margin-left: 10px;
		margin-bottom: 0;
	}
	.errorAlert {
		margin-bottom: 0;
	}
	.app-store-imgs {
		margin-top: 2rem;
	}
	.app-logo {
		width: 80px;
		height: 80px;
		border-radius: 22.5%;
	}
</style>

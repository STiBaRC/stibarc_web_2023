class RegisterModalComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");
		</style>
		<dialog>
			<div class="flexcontainer flexcolumn">
				<h2>Register</h2>
				<span id="errorcontainer" class="flexcontainer flexcolumn hidden">
					<span id="error" class="red"></span>
					<span>&nbsp;</span>
				</span>
				<input type="text" id="username" placeholder="Username" autocomplete="username">
				<span>&nbsp;</span>
				<input type="password" id="password" placeholder="Password" autocomplete="new-password">
				<span>&nbsp;</span>
				<input type="password" id="password2" placeholder="Password again" autocomplete="new-password">
				<h3>Optional</h3>
				<input type="text" id="name" placeholder="Name" autocomplete="given-name">
				<div>Show name: <input type="checkbox" id="showname"></div>
				<span>&nbsp;</span>
				<input list="commonPronouns" id="pronouns" type="text" placeholder="Pronouns" autocomplete="off" autocapitalize="none" maxlength="40">
				<datalist id="commonPronouns">
					<option value="she/her"></option>
					<option value="he/him"></option>
					<option value="they/them"></option>
					<option value="it/it"></option>
				</datalist>
				<div>Show pronouns: <input type="checkbox" id="showpronouns"></div>
				<span>&nbsp;</span>
				<input type="email" id="email" placeholder="Email" autocomplete="email">
				<div>Show email: <input type="checkbox" id="showemail"></div>
				<span>&nbsp;</span>
				<input type="date" id="bday" placeholder="Birthday" autocomplete="bday">
				<div>Show birthday: <input type="checkbox" id="showbday"></div>
				<span>&nbsp;</span>
				<textarea id="bio" placeholder="Bio"></textarea>
				<div>Show bio: <input type="checkbox" id="showbio"></div>
				<span>&nbsp;</span>
				<span class="flexcontainer">
					<button id="registerbutton" class="button small primary">Register</button>
					<button id="registercancel" class="button">Cancel</button>
				</span>
				<span class="flexcontainer marginbottom">
					<button id="loginlink" class="button">Login</button>
				</span>
			</div>
		</dialog>
	`;
	#clicked = false;

	constructor() {
		super();
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		this.shadow.querySelector("dialog").addEventListener("cancel", (e) => {
			e.preventDefault();
		});

		this.shadow.querySelector("#registerbutton").addEventListener("click", () => {
			this.#register();
		});

		this.shadow.querySelector("#registercancel").addEventListener("click", () => {
			this.hide();
		});

		this.shadow.querySelector("#loginlink").addEventListener("click", () => {
			this.hide();
			document.querySelector("stibarc-login-modal").show();
		});

		this.shadow.querySelector("#username").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#password").focus();
			}
		}

		this.shadow.querySelector("#password").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#password2").focus();
			}
		}

		this.shadow.querySelector("#password2").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#name").focus();
			}
		}

		this.shadow.querySelector("#name").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#pronouns").focus();
			}
		}

		this.shadow.querySelector("#pronouns").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#email").focus();
			}
		}

		this.shadow.querySelector("#email").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#bday").focus();
			}
		}

		this.shadow.querySelector("#bday").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#bio").focus();
			}
		}
	}

	async #register() {
		if (this.#clicked) return;
		this.shadow.querySelector("#errorcontainer").classList.add("hidden");
		this.shadow.querySelector("#error").textContent = "";
		const username = this.shadow.querySelector("#username").value.trim();
		const password = this.shadow.querySelector("#password").value;
		const password2 = this.shadow.querySelector("#password2").value;
		const name = this.shadow.querySelector("#name").value || undefined;
		const displayName = this.shadow.querySelector("#showname").checked || undefined;
		const pronouns = this.shadow.querySelector("#pronouns").value || undefined;
		const displayPronouns = this.shadow.querySelector("#showpronouns").checked || undefined;
		const email = this.shadow.querySelector("#email").value || undefined;
		const displayEmail = this.shadow.querySelector("#showemail").checked || undefined;
		const birthday = (this.shadow.querySelector("#bday").value != "") ? new Date(this.shadow.querySelector("#bday").value) : undefined;
		const displayBirthday = this.shadow.querySelector("#showbday").checked || undefined;
		const bio = this.shadow.querySelector("#bio").value || undefined;
		const displayBio = this.shadow.querySelector("#showbio").checked || undefined;
		if (username == "") {
			this.shadow.querySelector("#error").textContent = "Username required";
			this.shadow.querySelector("#errorcontainer").classList.remove("hidden");
			this.shadow.querySelector("#username").focus();
			return;
		}
		if (password == "") {
			this.shadow.querySelector("#error").textContent = "Password required";
			this.shadow.querySelector("#errorcontainer").classList.remove("hidden");
			this.shadow.querySelector("#password").focus();
			return;
		}
		if (password != password2) {
			this.shadow.querySelector("#error").textContent = "Passwords must match";
			this.shadow.querySelector("#errorcontainer").classList.remove("hidden");
			this.shadow.querySelector("#password2").focus();
			return;
		}
		this.#clicked = true;
		this.shadow.querySelector("#registerbutton").textContent = "";
		this.shadow.querySelector("#registerbutton").classList.add("loading");
		try {
			await api.registerUser({
				username,
				password,
				name,
				email,
				birthday,
				bio,
				pronouns,
				displayName,
				displayEmail,
				displayBirthday,
				displayBio,
				displayPronouns
			});
			setLoggedinState(true);
			this.hide();
		} catch (e) {
			this.shadow.querySelector("#error").textContent = e.message;
			this.shadow.querySelector("#errorcontainer").classList.remove("hidden");
		}
		this.shadow.querySelector("#registerbutton").textContent = "Register";
		this.shadow.querySelector("#registerbutton").classList.remove("loading");
		this.#clicked = false;
	}

	show() {
		this.shadow.querySelector("dialog").showModal();
		this.shadow.querySelector("#username").focus();
	}

	hide() {
		document.querySelector("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		this.shadow.querySelector("dialog").close();
		this.shadow.querySelector("#errorcontainer").classList.add("hidden");
		this.shadow.querySelector("#error").textContent = "";
		this.shadow.querySelector("#username").value = "";
		this.shadow.querySelector("#password").value = "";
		this.shadow.querySelector("#password2").value = "";
		this.shadow.querySelector("#name").value = "";
		this.shadow.querySelector("#showname").checked = false;
		this.shadow.querySelector("#pronouns").value = "";
		this.shadow.querySelector("#showpronouns").checked = false;
		this.shadow.querySelector("#email").value = "";
		this.shadow.querySelector("#showemail").checked = false;
		this.shadow.querySelector("#bday").value = "";
		this.shadow.querySelector("#showbday").checked = false;
		this.shadow.querySelector("#bio").value = "";
		this.shadow.querySelector("#showbio").checked = false;
	}
}

window.customElements.define("stibarc-register-modal", RegisterModalComponent);
class LoginModalComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");
		</style>
		<dialog>
			<div class="flexcontainer flexcolumn">
				<h2>Login</h2>
				<span id="errorcontainer" class="flexcontainer flexcolumn hidden">
					<span id="error" class="red"></span>
					<span>&nbsp;</span>
				</span>
				<input type="text" id="username" placeholder="Username" autocomplete="username">
				<span>&nbsp;</span>
				<input type="password" id="password" placeholder="Password" autocomplete="current-password">
				<span>&nbsp;</span>
				<span id="tfa" class="hidden flexcontainer flexcolumn">
					<input type="number" id="tfainput" placeholder="2FA Code">
					<span>&nbsp;</span>
				</span>
				<span class="flexcontainer">
					<button id="loginbutton" class="button small primary">Login</button>
					<button id="logincancel" class="button">Cancel</button>
				</span>
				<span class="flexcontainer marginbottom">
					<button id="registerlink" class="button">Register</button>
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

		this.shadow.querySelector("#loginbutton").addEventListener("click", () => {
			this.#login();
		});

		this.shadow.querySelector("#logincancel").addEventListener("click", () => {
			this.hide();
		});

		this.shadow.querySelector("#registerlink").addEventListener("click", () => {
			this.hide();
			document.querySelector("stibarc-register-modal").show();
		});

		this.shadow.querySelector("#username").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.shadow.querySelector("#password").focus();
			}
		};

		this.shadow.querySelector("#password").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.#login();
			}
		};

		this.shadow.querySelector("#tfainput").onkeyup = (e) => {
			if (e.key == "Enter") {
				this.#login();
			}
		};
	}

	async #login() {
		if (this.#clicked) return;
		this.shadow.querySelector("#errorcontainer").classList.add("hidden");
		this.shadow.querySelector("#error").textContent = "";
		const username = this.shadow.querySelector("#username").value;
		const password = this.shadow.querySelector("#password").value;
		const totpCode = this.shadow.querySelector("#tfainput").value;
		if (username.trim() == "" || password.trim() == "") return;
		this.#clicked = true;
		this.shadow.querySelector("#loginbutton").textContent = "";
		this.shadow.querySelector("#loginbutton").classList.add("loading");
		try {
			await api.login(username, password, totpCode);
			setLoggedinState(true);
			this.hide();
		} catch (e) {
			switch (e.message) {
				case "2FA code required":
					this.shadow.querySelector("#tfa").classList.remove("hidden");
					this.shadow.querySelector("#tfainput").focus();
				default:
					this.shadow.querySelector("#error").textContent = e.message;
					break;
			}
			this.shadow.querySelector("#errorcontainer").classList.remove("hidden");
		}
		this.#clicked = false;
		this.shadow.querySelector("#loginbutton").textContent = "Login";
		this.shadow.querySelector("#loginbutton").classList.remove("loading");
	}

	show() {
		window.scrollTo(0, 0);
		document.querySelector("#overlay").classList.remove("hidden");
		document.body.classList.add("overflowhidden");
		this.shadow.querySelector("dialog").showModal();
		this.shadow.querySelector("#username").focus();
	}

	hide() {
		document.querySelector("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		this.shadow.querySelector("dialog").close();
		this.shadow.querySelector("#username").value = "";
		this.shadow.querySelector("#password").value = "";
		this.shadow.querySelector("#tfainput").value = "";
		this.shadow.querySelector("#error").textContent = "";
		this.shadow.querySelector("#errorcontainer").classList.add("hidden");
		this.shadow.querySelector("#tfa").classList.add("hidden");
	}
}

customElements.define("stibarc-login-modal", LoginModalComponent);

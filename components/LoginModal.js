class LoginModalComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("./css/global.css");

			dialog {
				box-sizing: border-box;
				border-radius: 15px;
				background-color: var(--color2);
				color: var(--text);
				padding: 12px;
				user-select: text;
				box-shadow: 0 1px 8px 0 rgba(22, 22, 22, 0.2), 0 1px 4px 0 rgba(22, 22, 22, 0.2);
				max-height: 90vh;
				width: 100%;
				max-width: 50vw;
				overflow-y: auto;
				flex-wrap: nowrap;
			}

			@media only screen and (max-width: 750px) {
				dialog {
					width: calc(100vw - 40px);
					max-width: calc(100vw - 40px);
				}
			}

			dialog input, dialog textarea {
				margin-bottom: 0.25rem;
			}
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
					<button id="loginbutton" class="flexcontainer button small primary">Login</button>
					<button id="logincancel" class="flexcontainer button">Cancel</button>
				</span>
				<span class="flexcontainer marginbottom">
					<button id="registerlink" class="flexcontainer button">Register</button>
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
		const response = await fetch("https://betaapi.stibarc.com/v4/login.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username,
				password,
				totpCode,
			}),
		});
		const responseJSON = await response.json();
		switch (responseJSON.status) {
			default:
			case "error":
				switch (responseJSON.errorCode) {
					case "iuop":
						this.shadow.querySelector("#error").textContent =
							"Invalid username or password";
						break;
					case "totpr":
						this.shadow.querySelector("#error").textContent = "2FA code required";
						this.shadow.querySelector("#tfa").classList.remove("hidden");
						this.shadow.querySelector("#tfainput").focus();
						break;
					case "itotp":
						this.shadow.querySelector("#error").textContent = "Invalid 2FA code";
						break;
				}
				this.shadow.querySelector("#errorcontainer").classList.remove("hidden");
				break;
			case "ok":
				localStorage.username = username;
				localStorage.pfp = responseJSON.pfp;
				localStorage.sess = responseJSON.session;
				setLoggedinState(true);
				this.hide();
				break;
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

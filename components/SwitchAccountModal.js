class SwitchAccountModalComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");

			.width75 {
				width: 75%;
			}

			@media only screen and (max-width: 750px) {
				.width75 {
					width: 100%;
				}
			}
		</style>
		<template id="accounttemplate">
			<div class="flexcontainer flexrow width100">
				<div class="flexcontainer flexrow leftalign width100">
					<img id="pfp" class="pfp" src="" alt="Profile picture" />
					<span id="username"></span>
				</div>
				<div id="actionbuttons" class="flexcontainer flexrow rightalign width100">
					<button id="switch" class="button switchbtn">Switch</button>
					<button id="logout" class="button deletebtn red">Log out</button>
				</div>
			</div>
		</template>
		<dialog>
			<div class="flexcontainer flexcolumn">
				<h2>Switch Account</h2>
				<div class="flexcontainer flexcolumn width75" id="accountlist">
				</div>
			</div>
			<div class="flexcontainer confirmationbtns marginbottom">
				<button id="addaccount" class="button">Add Account</button>
				<button id="switchcancel" class="button">Cancel</button>
			</div>
		</dialog>
	`;

	#accountList;
	#template;

	constructor() {
		super();
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		this.#accountList = this.shadow.querySelector("#accountlist");
		this.#template = this.shadow.querySelector("#accounttemplate");

		this.shadow.querySelector("#addaccount").addEventListener("click", () => {
			this.hide();
			document.querySelector("stibarc-login-modal").show();
		});

		this.shadow.querySelector("dialog").addEventListener("cancel", (e) => {
			e.preventDefault();
		});

		this.shadow.querySelector("#switchcancel").addEventListener("click", () => {
			this.hide();
		});
	}

	#reloadAccounts() {
		const fragment = document.createDocumentFragment();
		let logins = localStorage.logins ? JSON.parse(localStorage.logins) : [];
		for (const login of logins) {
			const clone = this.#template.content.cloneNode(true);
			clone.querySelector("#pfp").src = login.pfp || `${api.cdn}/pfp/default.png`;
			clone.querySelector("#username").textContent = login.username;
			const switchButton = clone.querySelector("#switch");
			switchButton.addEventListener("click", async () => {
				switchButton.disabled = true;
				switchButton.classList.add("loading");
				await api.switchUser(login.username);
				this.hide();
			});
			clone.querySelector("#logout").addEventListener("click", async () => {
				const isCurrentSession = login.session === api.session;
				await api.logout(login.session, isCurrentSession);
				logins = localStorage.logins ? JSON.parse(localStorage.logins) : [];
				// Change to the first remaining session if the current session is being logged out
				if (isCurrentSession && logins.length > 0) {
					await api.switchUser(logins[0].username);
					this.hide();
					return;
				}
				if (logins.length === 0) {
					this.hide();
				} else {
					this.#reloadAccounts();
				}
			});
			if (login.session === localStorage.sess) {
				// Don't show the switch button for the current session
				clone.querySelector("#switch").remove();
			}
			fragment.appendChild(clone);
		}
		this.#accountList.innerHTML = "";
		this.#accountList.appendChild(fragment);
	}

	show() {
		this.#reloadAccounts();
		this.shadow.querySelector("dialog").showModal();
	}

	hide() {
		this.shadow.querySelector("dialog").close();
	}
}

customElements.define("stibarc-switchaccount-modal", SwitchAccountModalComponent);

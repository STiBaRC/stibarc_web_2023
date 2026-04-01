class AccountLinkingBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");

			:host {
				min-width: 100%;
				max-width: 300px;
			}

			.accountLinkingBlock {
				background-color: var(--color3);
				padding: 12px;
				border-radius: 8px;
				margin-bottom: 10px;
				box-sizing: border-box;
			}

			.accountLinkingBlock p {
				margin: 8px 0;
			}
		</style>
		<div class="accountLinkingBlock">
			<p>
				Service: <span id="serviceName"></span>
			</p>
			<p>
				Account: <span id="accountName"></span>
			</p>
			<div class="flexcontainer flexrow width100">
				<div class="flexcontainer flexrow leftalign">
					<button class="button light small" id="showHideButton" title="Show on profile">Show</button>
				</div>
				<div class="flexcontainer flexrow rightalign">
					<button class="button light danger small" id="unlink" title="Unlink account">Unlink</button>
				</div>
			</div>
		</div>
	`;
	#linkedAccount;

	constructor(linkedAccount) {
		super();
		this.#linkedAccount = linkedAccount;
		this.setAttribute("id", `linkedAccountMobile-${linkedAccount.id}`);
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		const serviceName = this.shadow.getElementById("serviceName");
		const accountName = this.shadow.getElementById("accountName");
		const showHideButton = this.shadow.getElementById("showHideButton");
		const unlinkButton = this.shadow.getElementById("unlink");
		
		let serviceNameText = api.authCreds[this.#linkedAccount.servicename]?.name;
		if (this.#linkedAccount.protocol === "oauth2_mastodon") {
			serviceNameText = this.#linkedAccount.servicename; // For Mastodon, the servicename is the instance URL, so show that instead of looking up a name
		}

		serviceName.textContent = serviceNameText;
		accountName.textContent = this.#linkedAccount.externalusername;
		showHideButton.textContent = this.#linkedAccount.displayonprofile ? "Hide" : "Show";
		showHideButton.title = this.#linkedAccount.displayonprofile ? "Hide on profile" : "Show on profile";

		showHideButton.addEventListener("click", async () => {
			showHideButton.disabled = true;
			showHideButton.classList.add("loading");
			const response = await fetch(`${api.host}/v4/accountlinking/setdisplayonprofile.sjs`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: api.session,
					accountLinkingId: this.#linkedAccount.id,
					displayOnProfile: !this.#linkedAccount.displayonprofile
				})
			});
			if (!response.ok) {
				const error = await response.json();
				alert(`Error updating linked account: ${error.message}`);
				showHideButton.disabled = false;
				showHideButton.classList.remove("loading");
				return;
			}
			this.#linkedAccount.displayonprofile = !this.#linkedAccount.displayonprofile;
			showHideButton.textContent = this.#linkedAccount.displayonprofile ? "Hide" : "Show";
			showHideButton.title = this.#linkedAccount.displayonprofile ? "Hide on profile" : "Show on profile";
			showHideButton.disabled = false;
			showHideButton.classList.remove("loading");
		});

		unlinkButton.addEventListener("click", async () => {
			if (!confirm(`Are you sure you want to unlink your ${serviceNameText} account?`)) {
				return;
			}
			unlinkButton.disabled = true;
			unlinkButton.classList.add("loading");
			const response = await fetch(`${api.host}/v4/accountlinking/unlinkaccount.sjs`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: api.session,
					accountLinkingId: this.#linkedAccount.id
				})
			});
			if (!response.ok) {
				const error = await response.json();
				alert(`Error unlinking account: ${error.message}`);
				unlinkButton.disabled = false;
				unlinkButton.classList.remove("loading");
				return;
			}
			document.getElementById(`linkedAccount-${this.#linkedAccount.id}`)?.remove(); // Remove the desktop version of the block if it exists
			this.remove();
		});
	}
}

customElements.define("stibarc-account-linking-block", AccountLinkingBlockComponent);
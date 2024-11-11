class ChatMessageComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");

			.pfp {
				width: 25px;
				height: 25px;
				border-radius: 50%;
			}
		</style>
		<span id="userinfo" class="flexcontainer leftalign width100">
			<a id="userLink" class="flexcontainer">
				<img id="pfp" class="pfp"></img>
				<span id="username"></span>
			</a>
			<stibarc-icon id="verified" type="verifiedBadge" name="verified" class="verifiedBadge hidden" title="Verified"></stibarc-icon>
			<span id="pronouns" class="pronouns"></span>
		</span>
		<span id="message"></span>
	`;
	user;
	message;
	showUser;

	constructor(user, message, showUser = true) {
		super();
		this.user = user;
		this.message = message;
		this.showUser = showUser;
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		if (this.showUser) {
			this.shadow.querySelector("#userLink").setAttribute("href", `/user.html?username=${this.user.username}`);
			this.shadow.querySelector("#pfp").setAttribute("src", this.user.pfp);
			this.shadow.querySelector("#username").textContent = this.user.username;
			if (this.user.verified) this.shadow.querySelector("#verified").classList.remove("hidden");
			this.shadow.querySelector("#pronouns").setAttribute("title", `Pronouns (${this.user.pronouns})`);
			if (this.user.pronouns) this.shadow.querySelector("#pronouns").textContent = `(${this.user.pronouns})`;
		} else {
			this.shadow.querySelector("#userinfo").remove();
		}
		this.shadow.querySelector("#message").textContent = this.message;
	}
}

customElements.define("stibarc-tv-chat-message", ChatMessageComponent);
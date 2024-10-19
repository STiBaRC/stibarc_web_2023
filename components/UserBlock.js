class UserBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<script src="./Icon.js"></script>
		<style>
			@import url("./css/global.css");
		</style>
		<span class="post flexcontainer leftalign width100">
			<a id="userLink" class="flexcontainer">
				<img id="pfp" class="pfp"></img>
				<span id="username"></span>
			</a>
			<stibarc-icon id="verified" type="verifiedBadge" name="verified" class="verifiedBadge hidden" title="Verified"></stibarc-icon>
			<span id="pronouns" class="pronouns"></span>
		</span>
	`;
	user;

	constructor(user) {
		super();
		this.user = user;
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		this.shadow.querySelector("#userLink").setAttribute("href", `./user.html?username=${this.user.username}`);
		this.shadow.querySelector("#pfp").setAttribute("src", this.user.pfp);
		this.shadow.querySelector("#username").textContent = this.user.username;
		if (this.user.verified) this.shadow.querySelector("#verified").classList.remove("hidden");
		this.shadow.querySelector("#pronouns").setAttribute("title", `Pronouns (${this.user.pronouns})`);
		if (this.user.pronouns) this.shadow.querySelector("#pronouns").textContent = `(${this.user.pronouns})`;
	}
}

customElements.define("stibarc-user", UserBlockComponent);
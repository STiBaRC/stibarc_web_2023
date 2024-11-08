class SessionBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<script src="./Icon.js"></script>
		<style>
			@import url("./css/global.css");

			.sessionBlock {
				background-color: var(--color3);
				padding: 12px;
				border-radius: 8px;
				margin-bottom: 10px;
			}

			.topFlex {
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			#loginDate {

			}

			#delete {
				margin-left: 8px;
				transition: color 0.15s ease-in-out;
			}

			#delete:hover, #delete:focus {
				color: var(--red);
			}

			#permissions {
				padding-top: 12px;
			}
			
			#application {
				padding-top: 12px;
				justify-content: flex-start;
				align-items: center;
				align-content: flex-start;
			}

			.badge {
				background-color: var(--color10);
				border-radius: 25px;
				padding: 2px 8px;
				margin-right: 4px;
			}

		</style>
		<div class="sessionBlock" id="session">
			<div class="topFlex"><span id="loginDate"></span><button class="button smallBtn light" id="delete" title="Revoke Session">X</button></div>
			<div id="userAgent"></div>
			<div id="loginIP"></div>
			<div id="permissions"></div>
			<div id="application" class="flexcontainer width100"></div>
		</div>
	`;
	session;

	constructor(session) {
		super();
		this.session = session;
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;
		this.shadow.querySelector("#session").title = this.session.id;
		const dateString = new Date(this.session.loginDate).toLocaleString();
		this.shadow.querySelector("#loginDate").textContent = `Login Date: ${dateString}`;
		this.shadow.querySelector("#userAgent").textContent = `User Agent: ${this.session.userAgent}`;
		this.shadow.querySelector("#loginIP").textContent = `IP: ${this.session.loginIP}`;
		this.shadow.querySelector("#application").textContent = `Application: ${this.session.application.name}`;
		if (this.session.application.verified) {
			const icon = new IconComponent();
			icon.setAttribute("name", "verified");
			icon.setAttribute("type", "verifiedBadge");
			icon.setAttribute("title", "Verified Application");
			icon.classList.add("verifiedBadge");
			this.shadow.querySelector("#application").appendChild(icon);
		}
		const permissionTags = document.createDocumentFragment();
		for (const permission of this.session.permissions) {
			const permissionTag = document.createElement("span");
			permissionTag.classList.add("badge");
			permissionTag.textContent = permission;
			permissionTags.appendChild(permissionTag);
		}
		this.shadow.querySelector("#delete").addEventListener("click", async () => {
			const response = await fetch("https://betaapi.stibarc.com/v4/logout.sjs", {
				method: "post",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					session: this.session.id
				}),
			});
			const r = await response.json();
			if (r.status == "ok") {
				this.remove();
			}
		});
		this.shadow.querySelector("#permissions").textContent = "Permissions: ";
		this.shadow.querySelector("#permissions").appendChild(permissionTags);
	}
}

customElements.define("stibarc-session-block", SessionBlockComponent);
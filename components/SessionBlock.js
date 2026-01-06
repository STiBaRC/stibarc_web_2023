class SessionBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<script src="/Icon.js"></script>
		<style>
			@import url("/css/global.css");

			.sessionBlock {
				background-color: var(--color3);
				padding: 12px;
				border-radius: 8px;
				margin-bottom: 10px;
			}

			.sessionBlock p {
				margin: 8px 0;
			}
			
			.bottomFlex {
				display: flex;
				align-items: center;
				flex-wrap: no-wrap;
			}

			#currentSess {
				font-weight: bold;
			}

			#delete {
				margin-right: 8px;
				color: var(--red);
				transition: background-color 0.15s ease-in-out;
			}

			#delete:hover, #delete:focus {
				background-color: var(--color4);
			}

			#loginIP {
				word-wrap: break-word;
				font-family: monospace;
				font-weight: 600;
			}

			#permissions {
				padding-top: 8px;
				box-sizing: border-box;
				display: flex;
    			flex-wrap: wrap;
			}
			
			#application {
				display: inline-flex;
				align-items: center;
			}

			.verifiedBadge {
				display: inline-flex;
				align-items: center;
			}

			.badge {
				background-color: var(--color10);
				border-radius: 25px;
				padding: 2px 8px;
				margin-right: 4px;
				margin-bottom: 4px;
			}

		</style>
		<div class="sessionBlock" id="session">
			<p id="currentSess" class="hidden">Your current session</p>
			<p>
				<span>Login IP: </span>
				<span id="loginIP"></span>
			</p>
			<p id="loginDate"></p>
			<p>
				<span>User Agent: </span>
				<span id="userAgent"></span>
			</p>
			<p>
				<span>Permissions: </span>
				<span id="permissions"></span>
			</p>
			<div class="bottomFlex">
				<div class="flexgrow">
					<span>Applications: </span>
					<span id="application"></span>
				</div>
				<button class="button light small" id="delete" title="Revoke Session">Revoke</button>
			</div>		
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
		if (this.session.id === api.session) {
			this.shadow.querySelector("#delete").remove();
		}
		this.shadow.querySelector("#session").title = this.session.id;
		const dateString = new Date(this.session.loginDate).toLocaleString();
		this.shadow.querySelector("#loginDate").textContent = `Login Date: ${dateString}`;
		this.shadow.querySelector("#userAgent").textContent = `${this.session.userAgent}`;
		this.shadow.querySelector("#loginIP").textContent = `${this.session.loginIP}`;
		this.shadow.querySelector("#application").textContent = `${this.session.application.name}`;
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
		this.shadow.querySelector("#currentSess").classList.remove("hidden");
		if (this.session.id !== api.session) {
			this.shadow.querySelector("#currentSess").classList.add("hidden");
			this.shadow.querySelector("#delete").addEventListener("click", async () => {
				this.shadow.querySelector("#delete").textContent = "";
				this.shadow.querySelector("#delete").classList.add("loading");
				await api.logoutSession(this.session.id);
				this.remove();
			});
		}
		this.shadow.querySelector("#permissions").appendChild(permissionTags);
	}
}

customElements.define("stibarc-session-block", SessionBlockComponent);
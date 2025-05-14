class DeveloperAppComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");

			:host {
				display: block;
				width: 280px;
				height: 280px;
			}

			.block {
				width: 100%;
			}

			.app-icon {
				width: 110px;
				height: 110px;
				border-radius: 10px;
				margin-bottom: 5px;
				background-color: var(--color1);
			}

			#app {
				width: 280px;
				height: 200px;
			}
		</style>
		<a class="block flexcontainer flexcolumn pointer" id="app">
			<img id="icon">
			<span class="flexcontainer">
				<span id="name"></span>
				<stibarc-icon id="verified" type="verifiedBadge" name="verified" class="verifiedBadge hidden" title="Verified"></stibarc-icon>
			</span>
		</a>
	`;

	constructor() {
		super();
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		const name = this.getAttribute("name") || "Unknown";
		const id = this.getAttribute("id") || "Unknown";
		const description = this.getAttribute("description") || "No description available.";
		const icon = this.getAttribute("icon") || "/images/default-icon.png";
		const verified = this.getAttribute("verified") === "true" ? true : false;
		const firstparty = this.getAttribute("firstparty") === "true" ? true : false;

		const iconElement = this.shadow.getElementById("icon");
		iconElement.src = icon;
		iconElement.alt = `${name} icon`;
		iconElement.classList.add("app-icon");

		const nameElement = this.shadow.getElementById("name");
		nameElement.textContent = name;

		const verifiedElement = this.shadow.getElementById("verified");
		if (verified) {
			verifiedElement.classList.remove("hidden");
		}
		if (firstparty) {
			verifiedElement.classList.remove("hidden");
			verifiedElement.setAttribute("title", "First Party App");
		}

		this.shadow.getElementById("app").setAttribute("href", `/developer/app.html?id=${id}`);
	}
}

customElements.define("stibarc-developer-app", DeveloperAppComponent);
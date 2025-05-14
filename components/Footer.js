class FooterComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");
			footer {
				background-color: var(--color6);
				margin-top: 2.5rem;
				padding: 16px 0;
			}
		</style>
		<footer class="flexcontainer">
			<span>
				&copy; <span id="year"></span> <a href="https://team.stibarc.com" target="_blank">STiBaRC Team</a>
			</span>
		</footer>
	`;

	constructor() {
		super();
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;
		this.shadow.querySelector("#year").textContent = new Date().getFullYear();
	}
}

customElements.define("stibarc-footer", FooterComponent);
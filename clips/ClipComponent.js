class ClipComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");

			:host {
				display: block;
				aspect-ratio: 9 / 16;
				height: 100%;
				max-width: 100vw;
			}

			#clip {
				width: 100%;
				height: 100%;
				object-fit: cover;
				background-color: var(--color2);
			}
		</style>
		<div id="clip">
		</div>
	`;

	constructor() {
		super();
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		this.shadow.querySelector("#clip").innerText = this.getAttribute("content");
	}
}

customElements.define("stibarc-clip", ClipComponent);
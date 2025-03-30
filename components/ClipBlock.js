class ClipBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			:host {
				cursor: pointer;
				height: 200px;
				width: calc(200px * 9 / 16);
			}

			img {
				aspect-ratio: 9 / 16;
				height: 200px;
				width: calc(200px * 9 / 16);
				border-radius: 20px;
			}

			#link {
				position: relative;
				display: block;
				height: 200px;
				width: calc(200px * 9 / 16);
			}

			#playicon {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
			}
		</style>
		<a id="link">
			<img id="img"></img>
			<stibarc-icon name="play" size="iconLarge" id="playicon"></stibarc-icon>
		</a>
	`;
	clip;

	constructor(clip) {
		super();
		this.clip = clip;
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		this.shadow.querySelector("#img").src = `${this.clip.content}.thumb.webp`;
		this.shadow.querySelector("#img").alt = this.clip.description;
		this.shadow.querySelector("#img").title = this.clip.description;
		this.shadow.querySelector("#link").href = `/clips/?id=${this.clip.id}`;

		this.addEventListener("click", () => {
			window.location.href = `/clips/?id=${this.clip.id}`;
		});
	}
}

customElements.define("stibarc-clip", ClipBlockComponent);
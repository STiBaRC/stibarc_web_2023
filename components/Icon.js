class IconComponent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: "closed" });

		const iconName = this.getAttribute("name");
		const iconSize = this.getAttribute("size") || 16;

		const iconImg = new Image(iconSize, iconSize);
		iconImg.src = `./img/icon/${iconName}.svg`;

		iconImg.classList.add("icon");
		if (this.getAttribute("inverted")) this.classList.add("inverted");
		if (this.getAttribute("inverted-light")) this.classList.add("inverted-light");

		shadow.appendChild(iconImg);
	}
}

window.customElements.define("stibarc-icon", IconComponent);
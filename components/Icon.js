class IconComponent extends HTMLElement {

	constructor() {
		super();
	}

	#shadowDomHTML = `
	<style>
		.icon {
			width: 16px;
			height: 16px;
			fill: transparent;
			stroke: var(--text);
			stroke-width: 10px;
			stroke-linecap: round;
			stroke-linejoin: round;
		}

		.filled {
			fill: var(--text);
			stroke: transparent;
		}
		
		.iconLarge {
			width: 25px;
			height: 25px;
		}
		
		.iconBig {
			width: 28px;
			height: 28px;
		}

		.iconVeryBig {
			width: 32px;
			height: 32px;
		}

		.verifiedBadge {
			margin: 0 2px 0 3px;
			fill: var(--color1);
			stroke: none;
		}
	</style>`;
 
	connectedCallback() {

		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;
		const iconName = this.getAttribute("name");

		const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgIcon.classList.add("icon", this.getAttribute("size"), this.getAttribute("type"));
		if (this.getAttribute("color"))
			svgIcon.style.stroke = this.getAttribute("color");
		if (this.getAttribute("stroke")) 
			svgIcon.style.strokeWidth = this.getAttribute("stroke");
		if (this.getAttribute("filled"))
			svgIcon.classList.add("filled");
		const useBlock = document.createElementNS("http://www.w3.org/2000/svg", "use");
		useBlock.setAttribute("href", `/img/icon/icons.svg#${iconName}`);
		svgIcon.append(useBlock);

		this.shadow.appendChild(svgIcon);
	}
}

window.customElements.define("stibarc-icon", IconComponent);
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
		stroke-width: 8px;
		stroke-linecap: round;
		stroke-linejoin: round;
	}	
	
	.iconLarge {
		width: 24px;
		height: 24px;
	}
	
	.iconBig {
		width: 28px;
		height: 28px;
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
		const useBlock = document.createElementNS("http://www.w3.org/2000/svg", "use");
		useBlock.setAttribute("href", `/img/icon/icons.svg#${iconName}`);
		svgIcon.append(useBlock);

		this.shadow.appendChild(svgIcon);
	}
}

window.customElements.define("stibarc-icon", IconComponent);
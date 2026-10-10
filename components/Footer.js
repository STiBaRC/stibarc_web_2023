class FooterComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");
			footer {
				background-color: var(--color6);
				margin-top: 2.5rem;
			}
			
			footer ul {
				// padding-left: 8px;
			}

			.logo {
				margin-right: 5px;
				margin-top: 2px;
				margin-bottom: 2px;
			}

			.footerTop {
				display: flex;
				padding: 16px;
			}

			.footerBottom {
				background-color: rgba(0, 0, 0, 0.2);
				padding: 14px 16px;
				display: flex;
				justify-content: space-between;
				align-items: center;
				flex-wrap: wrap;
			}
		</style>
		<footer>
			<div class="footerTop">
				<ul>
					<li><a href="/clips">STiBaRC Clips</a></li>
					<li><a href="/tv">STiBaRC TV</a></li>
					<li><a href="/developer">Developer Portal</a></li>
				</ul>
				<ul>
					<li><a href="https://stibarc.dev">Company</a></li>
					<li><a href="https://records.stibarc.com">STiBaRC Records</a></li>
					<li><a href="https://team.stibarc.com/contact">Contact</a></li>
				</ul>
			</div>
			<div class="footerBottom">
				<img class="logo" src="/img/wordmark.svg" height="25px">
				<div class="flexcontainer">
					<!-- <img class="logo" src="/img/stibarc_head.svg" height="24px"> -->
					&copy;&nbsp;<span id="year"></span>&nbsp;
					<a href="https://team.stibarc.com" target="_blank">STiBaRC Team</a>&nbsp;&nbsp;
				</div>
				<div>
					<a href="/privacy.html" target="_blank">Privacy</a> | <a href="/tos.html" target="_blank">Terms</a>
				</div>
			</div>
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
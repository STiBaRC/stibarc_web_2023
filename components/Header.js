class HeaderComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");
			header {
				position: sticky;
				top: 0px;
				background-color: var(--color1);
				margin: 0px;
				padding: 0px;
				z-index: 100;
				transition: box-shadow 0.25s ease-in-out;
			}

			header .searchbar input {
				outline: 3px solid transparent;
			}

			.searchbar input:focus {
				outline-color: var(--color1);
			}

			header .searchbar input:focus {
				border: none;
				outline: 3px solid rgba(255, 255, 255, .18);
			}

			.searchbar input {
				font-family: inherit;
				font-size: 14px;
				box-sizing: border-box;
				width: 75%;
				min-width: 200px;
				border-radius: 20px;
				color: var(--text);
				background-color: var(--color2);
				padding: 0.55rem 0.75rem 0.55rem 37px;
				background-image: url(/img/icon/search.svg);
				background-size: 24px 24px;
				background-repeat: no-repeat;
				background-position-y: center;
				background-position-x: 9px;
				outline: 2px solid var(--color5);
			}

			#mainHeader {
				height: 60px;
				width: 100%;
				overflow-x: auto;
				flex-wrap: nowrap;
			}

			#mainHeader .flexcontainer {
				flex-wrap: nowrap;
			}

			#logo {
				margin-left: calc(100vw * 0.01);
			}

			#logo img {
				height: 40px;
				text-indent: -10000px;
			}

			#searchBtn {
				width: 25px;
				cursor: pointer;
				padding: 5px;
				margin-right: 6px;
				border-radius: 50%;
				transition: background-color .25s ease-in-out;
			}

			#searchBtn>img {
				width: 25px;
			}

			#searchBtn:hover {
				background-color: var(--color5);
			}
			
			#hiddenHeader {
				position: fixed;
				left: 50%;
				top: 60px;
				transform: translateX(-50%);
				pointer-events: none;
				z-index: 100;
				width: calc(100% - 16px);
			}

			.headerShadow {
				box-shadow: 0 1px 8px 0 rgba(22, 22, 22, 0.2), 0 1px 4px 0 rgba(22, 22, 22, 0.2);
			}

			.headerDropdown {
				float: right;
				box-sizing: border-box;
				box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
				border-radius: 6px;
				min-width: 9.5rem;
				z-index: 10000;
				pointer-events: visible;
				text-decoration: none;
			}

			.headerpfp {
				background-color: var(--color2);
				width: 45px;
				height: 45px;
				border-radius: 50%;
				margin-right: calc(100vw * 0.01);
				cursor: pointer;
				outline: 3px solid transparent;
				text-indent: -10000px;
			}

			.headerpfp.active {
				outline-color: rgba(255, 255, 255, .18);
			}

			.headerDropdown {
				background-color: var(--color2);
				padding: 4px;
			}

			.headerDropdown .menuElement {
				-webkit-appearance: none;
				appearance: none;
				text-decoration: none;
				text-align: inherit;
				border: none;
				font-family: inherit;
				font-size: 1rem;
				line-height: normal;
				width: 100%;
				box-sizing: border-box;
				display: flex;
				margin: 0;
				justify-content: left;
				background-color: var(--color2);
				color: inherit;
				padding: 9px 18px;
				transition: background-color 0.22s ease-out;
				cursor: pointer;
				border-radius: 6px;
			}

			.headerDropdown .menuElement:hover {
				background-color: var(--color3);
			}

			.headerDropdown .separator {
				border: 1px solid var(--color3);
				margin: 3px 0;
			}

			@media only screen and (max-width: 750px) {
				.headerDropdown {
					width: 100%;
				}

				#hiddenHeader {
					width: calc(100% - 16px);
					margin: 0 auto;
				}

				.headerDropdown .menuElement {
					justify-content: right;
				}
			}

			@media only screen and (max-width: 300px) {
				#logo img {
					height: 30px;
				}
			}

			@media only screen and (max-width: 245px) {
				#logo img {
					height: 25px;
				}
			}
		</style>
		<header id="headerElement">
			<span id="mainHeader" class="flexcontainer">
				<span class="leftalign">
					<a href="/" class="flexcontainer" id="logo"><img id="logoimg" src="/img/logo.png"></a>
				</span>
				<span class="searchbar flexcontainer hideOnMobile">
					<input type="search" id="searchbox" placeholder="Search" autocomplete="false">
				</span>
				<span class="flexcontainer rightalign">
					<span id="searchBtn" class="showOnMobileFlex"><img src="/img/icon/search.svg" alt="Search"></span>
					<img src="https://betacdn.stibarc.com/pfp/default.png" id="mypfp" class="headerpfp">
				</span>
			</span>
			<span id="hiddenHeader" class="hidden">
				<div class="loggedout headerDropdown">
					<button class="menuElement" id="menulogin">Login</button>
					<button class="menuElement" id="menuregister">Register</button>
				</div>
				<div class="loggedin headerDropdown hidden">
					<a class="menuElement" id="menueditprofile" href="/editprofile.html">Edit profile</a>
					<a class="menuElement" id="menusettings" href="/settings.html">Settings</a>
					<div class="separator"></div>
					<a class="menuElement" id="menuprofile"></a>
					<button class="menuElement red" id="menulogout">Logout</button>
				</div>
			</span>
			<span id="searchResults" class="flexcontainer flexcolumn hidden">
			</span>
		</header>
	`;

	constructor() {
		super();
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;
		const headerElement = this.shadow.querySelector("#headerElement");
		const hiddenHeader = this.shadow.querySelector("#hiddenHeader");
		const mypfp = this.shadow.querySelector("#mypfp");
		const searchbox = this.shadow.querySelector("#searchbox");
		const menuprofile = this.shadow.querySelector("#menuprofile");
		const logoImg = this.shadow.querySelector("#logoimg");
		const logo = this.getAttribute("logo");

		if (logo == "tv") {
			logoImg.src = "/tv/tv_wordmark2.png";
		}

		this.shadow.addEventListener("click", function (event) {
			/* header pfp dropdown */
			if (!event.target) return;
			if (
				hiddenHeader.classList.contains("hidden") &&
				mypfp.contains(event.target)
			) {
				mypfp.classList.add("active");
				hiddenHeader.classList.remove("hidden");
			} else {
				mypfp.classList.remove("active");
				hiddenHeader.classList.add("hidden");
			}
			if (!mypfp.contains(event.target)) {
				mypfp.classList.remove("active");
				hiddenHeader.classList.add("hidden");
			}
		});

		document.addEventListener("click", function (event) {
			if (!event.target) return;
			if (!(event.target instanceof HeaderComponent)) {
				mypfp.classList.remove("active");
				hiddenHeader.classList.add("hidden");
			}
		});

		this.shadow.querySelector("#searchBtn").addEventListener("click", () => {
			location.href = "/search.html";
		});

		this.shadow.querySelector("#searchbox").addEventListener("keypress", (e) => {
			const query = encodeURIComponent(searchbox.value);
			if (e.key == "Enter" && query.trim() != "") {
				location.href = `/search.html?q=${query}`;
			}
		});

		this.shadow.querySelector("#menulogin").addEventListener("click", () => {
			document.querySelector("stibarc-login-modal").show();
		});

		this.shadow.querySelector("#menuregister").addEventListener("click", () => {
			document.querySelector("stibarc-register-modal").show();
		});

		this.shadow.querySelector("#menulogout").addEventListener("click", async () => {
			await api.logout();
			setLoggedinState(false);
		});

		listatehooks.push((state) => {
			Array.from(this.shadow.querySelectorAll(".loggedin")).forEach((element) => {
				if (state) {
					element.classList.remove("hidden");
				} else {
					element.classList.add("hidden");
				}
			});
			Array.from(this.shadow.querySelectorAll(".loggedout")).forEach(
				(element) => {
					if (state) {
						element.classList.add("hidden");
					} else {
						element.classList.remove("hidden");
					}
				}
			);
			if (state) {
				mypfp.setAttribute(
					"src",
					api.pfp || "https://betacdn.stibarc.com/pfp/default.png"
				);
				menuprofile.textContent = api.username;
				menuprofile.setAttribute("href", `/user.html?username=${api.username}`);
			} else {
				mypfp.setAttribute(
					"src",
					"https://betacdn.stibarc.com/pfp/default.png"
				);
				menuprofile.setAttribute("href", "");
			}
		});

		window.addEventListener("scroll", function () {
			if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
				headerElement.classList.add("headerShadow");
			} else {
				headerElement.classList.remove("headerShadow");
			}
		});
	}

	setSearchBox(value) {
		this.shadow.querySelector("#searchbox").value = value;
	}
}

customElements.define("stibarc-header", HeaderComponent);
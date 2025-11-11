/*
	STiBaRC Global js
*/

/*
	variables
*/

let api = new API();
const listatehooks = [];
const clickhooks = [];
const maxTitleLength = 250;
let loadingSessInfo = false;

/*
	Functions
*/

function $(qs) {
	if (qs.startsWith("#")) return document.querySelector(qs);
	return document.querySelectorAll(qs);
}

/*
	Theme
*/

const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");

function refreshTheme() {
	if (!localStorage.getItem("theme")) {
		if (darkThemeMq.matches) {
			localStorage.setItem("theme", "darkTheme");
		} else {
			localStorage.setItem("theme", "lightTheme");
		}
	}
	let themeName = localStorage.getItem("theme") || "lightTheme";
	document.documentElement.classList = "";
	document.documentElement.className = themeName;
}

darkThemeMq.addEventListener("change", (e) => {
	// reset theme, set to browser theme
	localStorage.removeItem("theme");
	updateThemeSelector();
	refreshTheme();
});

function updateThemeSelector() {
	if ($("#changeThemeSelector")) {
		$("#changeThemeSelector").value = localStorage.getItem("theme") || "lightTheme";
	}
}

function setLoggedinState(state) {
	Array.from(document.getElementsByClassName("loggedin")).forEach((element) => {
		if (state) {
			element.classList.remove("hidden");
		} else {
			element.classList.add("hidden");
		}
	});
	Array.from(document.getElementsByClassName("loggedout")).forEach(
		(element) => {
			if (state) {
				element.classList.add("hidden");
			} else {
				element.classList.remove("hidden");
			}
		}
	);
	for (const func of listatehooks) {
		func(state);
	}
}

async function reloadSessInfo() {
	if (loadingSessInfo) return;
	loadingSessInfo = true;
	try {
		await api.reloadSessInfo();
		loadingSessInfo = false;
		sessionStorage.loadedBefore = true;
		setLoggedinState(true);
	} catch(e) {
		loadingSessInfo = false;
		sessionStorage.loadedBefore = true;
		setLoggedinState(false);
	}
}

let globalInitialized = false;
function waitForGlobalInit() {
	return new Promise((resolve) => {
		if (globalInitialized) {
			resolve();
			return;
		}
		const channel = new BroadcastChannel("globalInit");
		channel.onmessage = (e) => {
			if (e.data === "initialized") {
				resolve();
				channel.close();
			}
		};
	});
}

refreshTheme();

if (
	api.loggedIn &&
	(sessionStorage.loadedBefore === undefined ||
		api.username === undefined ||
		api.pfp === undefined)
) {
	if ($("#mypfp")) {
		$("#mypfp").setAttribute(
			"src",
			api.pfp || "https://betacdn.stibarc.com/pfp/default.png"
		);
		$("#menuprofile").textContent = api.username;
		$("#menuprofile").href = `/user.html?username=${api.username}`;
	}
}

window.addEventListener("load", async function () {
	await api.init();
	if (
		api.loggedIn &&
		(sessionStorage.loadedBefore === undefined ||
			api.username === undefined ||
			api.pfp === undefined)
	) {
		reloadSessInfo();
	}
	document.addEventListener("click", function (event) {
		for (const func of clickhooks) {
			func(event);
		}
	});
	globalInitialized = true;
	const channel = new BroadcastChannel("globalInit");
	channel.postMessage("initialized");
});
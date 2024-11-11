/*
	STiBaRC Global js
*/

/*
	variables
*/

let environment;
switch (window.location.hostname) {
	case "stibarc.com":
		environment = "prod";
		break;
	case "staging.stibarc.com":
		environment = "staging";
		break;
	default:
	case "dev.stibarc.com":
		environment = "dev";
		break;
}
let api = new API(environment);
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

darkThemeMq.addListener((e) => {
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
		await api.init();
		loadingSessInfo = false;
		sessionStorage.loadedBefore = true;
		setLoggedinState(true);
	} catch(e) {
		loadingSessInfo = false;
		sessionStorage.loadedBefore = true;
		setLoggedinState(false);
	}
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

window.addEventListener("load", function () {
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
});
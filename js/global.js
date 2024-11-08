/*
	STiBaRC Global js
*/

/*
	variables
*/

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

async function vote({ id, target, vote, commentId }) {
	const request = await fetch("https://betaapi.stibarc.com/v4/vote.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			session: localStorage.sess,
			id,
			commentId,
			target,
			vote,
		}),
	});
	return await request.json();
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
	const request = await fetch(
		"https://betaapi.stibarc.com/v4/getprivatedata.sjs",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				session: localStorage.sess,
			}),
		}
	);
	const responseJSON = await request.json();
	loadingSessInfo = false;
	sessionStorage.loadedBefore = true;
	if (responseJSON.status === "ok") {
		localStorage.username = responseJSON.user.username;
		localStorage.pfp = responseJSON.user.pfp;
		localStorage.banner = responseJSON.user.banner;
		setLoggedinState(true);
	}
	if (responseJSON.status === "error" && responseJSON.statusCode === "is") {
		delete localStorage.sess;
		delete localStorage.username;
		delete localStorage.pfp;
		delete localStorage.banner;
		setLoggedinState(false);
	}
}

refreshTheme();

if (
	localStorage.sess !== undefined &&
	(sessionStorage.loadedBefore === undefined ||
		localStorage.username === undefined ||
		localStorage.pfp === undefined)
) {
	if ($("#mypfp")) {
		$("#mypfp").setAttribute(
			"src",
			localStorage.pfp || "https://betacdn.stibarc.com/pfp/default.png"
		);
		$("#menuprofile").textContent = localStorage.username;
		$("#menuprofile").href = `./user.html?username=${localStorage.username}`;
	}
}

window.addEventListener("load", function () {
	if (
		localStorage.sess !== undefined &&
		(sessionStorage.loadedBefore === undefined ||
			localStorage.username === undefined ||
			localStorage.pfp === undefined)
	) {
		reloadSessInfo();
	}
	document.addEventListener("click", function (event) {
		for (const func of clickhooks) {
			func(event);
		}
	});
});
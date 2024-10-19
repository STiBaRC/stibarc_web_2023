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

function commentBlock(post, comment, isPostPage) {
	const commentSpan = document.createElement("span");
	const userSpan = document.createElement("span");
	const userLink = document.createElement("a");
	const userPfp = document.createElement("img");
	const verifiedBadge = document.createElement("stibarc-icon");
	const userPronouns = document.createElement("span");
	const dateSpan = document.createElement("span");
	const metaTags = document.createDocumentFragment();
	const editedSpan = document.createElement("span");
	const hr1 = document.createElement("hr");
	const contentSpan = document.createElement("span");
	const hr2 = document.createElement("hr");
	const metaSpan = document.createElement("span");
	const upvoteIcon = document.createElement("stibarc-icon");
	const downvoteIcon = document.createElement("stibarc-icon");
	const upvoteBtn = document.createElement("button");
	const downvoteBtn = document.createElement("button");
	const flexGrow = document.createElement("span");
	const editBtn = document.createElement("button");
	const editIcon = document.createElement("stibarc-icon");

	commentSpan.classList.add("comment", "flexcontainer", "flexcolumn");
	userSpan.classList.add("flexcontainer", "leftalign", "width100");
	userLink.setAttribute(
		"href",
		`./user.html?username=${comment.poster.username}`
	);
	userLink.classList.add("flexcontainer");
	userPfp.classList.add("pfp");
	userPfp.setAttribute("src", comment.poster.pfp);
	verifiedBadge.setAttribute("name", "verified");
	verifiedBadge.setAttribute("type", "verifiedBadge");
	verifiedBadge.setAttribute("title", "Verified");
	userPronouns.setAttribute("title", `Pronouns (${post.poster.pronouns})`);
	userPronouns.setAttribute("class", "pronouns");
	dateSpan.classList.add("postdate", "leftalign", "width100");
	editedSpan.classList.add("smallBadge", "dark");
	hr1.classList.add("width100");
	contentSpan.classList.add(
		"postcontent",
		"flexcolumn",
		"leftalign",
		"width100"
	);
	hr2.classList.add("width100");
	metaSpan.classList.add("aligncenter", "leftalign", "width100", "flexwrap");
	upvoteIcon.setAttribute("name", "up_arrow");
	upvoteIcon.classList.add("textOnRight");
	downvoteIcon.setAttribute("name", "down_arrow");
	downvoteIcon.classList.add("textOnRight");
	upvoteBtn.classList.add("flexcontainer", "button", "primary", "voteBtn");
	upvoteBtn.setAttribute("title", "Upvote");
	downvoteBtn.classList.add("flexcontainer", "button", "primary", "voteBtn");
	downvoteBtn.setAttribute("title", "Downvote");
	flexGrow.classList.add("flexgrow");
	editBtn.classList.add("flexcontainer", "editBtn", "hidden");
	editBtn.setAttribute("title", "Edit comment");
	editBtn.setAttribute("data-username", comment.poster.username);
	editIcon.setAttribute("name", "edit");
	editIcon.setAttribute("size", "24");
	editIcon.setAttribute("inverted-light", true);

	if (comment.poster.pronouns)
		userPronouns.innerText = `(${comment.poster.pronouns})`;
	editedSpan.innerText = "Edited";
	dateSpan.innerText = new Date(comment.date).toLocaleString();
	if (comment.edited) {
		editedSpan.setAttribute(
			"title",
			`Edited ${new Date(comment.lastEdited).toLocaleString()}`
		);
		metaTags.append(editedSpan);
	}
	contentSpan.innerText = comment.content;

	upvoteBtn.append(upvoteIcon, ` ${comment.upvotes}`);
	downvoteBtn.append(downvoteIcon, ` ${comment.downvotes}`);
	if (!isPostPage) {
		metaSpan.append(
			upvoteIcon,
			` ${comment.upvotes}`,
			downvoteIcon,
			` ${comment.downvotes}`
		);
	}

	if (
		comment.attachments &&
		comment.attachments.length > 0 &&
		comment.attachments[0] !== null
	) {
		for (let i = 0; i < comment.attachments.length; i++) {
			let attachment = attachmentblock(comment.attachments[i]);
			attachment.classList.add("postattachment");
			attachment.addEventListener("click", () => {
				window.open(comment.attachments[i], "_blank");
			});
			contentSpan.append(attachment);
		}
	}

	userLink.append(userPfp, comment.poster.username);
	userSpan.append(userLink);
	if (comment.poster.verified) userSpan.append(verifiedBadge);
	userSpan.append(userPronouns);
	if (isPostPage) {
		metaSpan.append(upvoteBtn, downvoteBtn, flexGrow);
		editBtn.innerText = "";
		editBtn.append(editIcon);
		if (comment.poster.username == localStorage.username)
			editBtn.classList.remove("hidden");
		metaSpan.append(editBtn);
	}
	commentSpan.append(
		userSpan,
		dateSpan,
		metaTags,
		hr1,
		contentSpan,
		hr2,
		metaSpan
	);

	upvoteBtn.addEventListener("click", async () => {
		if (localStorage.sess) {
			const voteResult = await vote({
				id: post.id,
				commentId: comment.id,
				target: "comment",
				vote: "upvote",
			});
			upvoteBtn.innerText = downvoteBtn.innerText = "";
			upvoteBtn.append(upvoteIcon, ` ${voteResult.upvotes}`);
			downvoteBtn.append(downvoteIcon, ` ${voteResult.downvotes}`);
		} else {
			$("stibarc-login-modal")[0].show();
		}
	});

	downvoteBtn.addEventListener("click", async () => {
		if (localStorage.sess) {
			const voteResult = await vote({
				id: post.id,
				commentId: comment.id,
				target: "comment",
				vote: "downvote",
			});
			upvoteBtn.innerText = downvoteBtn.innerText = "";
			upvoteBtn.append(upvoteIcon, ` ${voteResult.upvotes}`);
			downvoteBtn.append(downvoteIcon, ` ${voteResult.downvotes}`);
		} else {
			$("stibarc-login-modal")[0].show();
		}
	});

	editBtn.addEventListener("click", () => {
		location.href = `./edit.html?id=${post.id}&cid=${comment.id}`;
	});

	return commentSpan;
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
		$("#menuprofile").innerText = localStorage.username;
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
		$("#menuprofile").href = `./user.html?username=${localStorage.username}`;
	}
	document.addEventListener("click", function (event) {
		for (const func of clickhooks) {
			func(event);
		}
	});
});
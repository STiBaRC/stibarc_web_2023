/*
	STiBaRC Global js
*/

/*
	variables
*/

const listatehooks = [];
const clickhooks = [];
const images = ["png", "jpg", "gif", "webp", "svg"];
const videos = ["mov", "mp4", "webm"];
const audios = ["spx", "m3a", "m4a", "wma", "wav", "mp3"];
const maxTitleLength = 250;
let clicked = false;
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
			localStorage.setItem("theme", "dark");
		} else {
			localStorage.setItem("theme", "light");
		}
	}
	let themeName = localStorage.getItem("theme") || "light";
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
		$("#changeThemeSelector").value = localStorage.getItem("theme") || "light";
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

function attachmentblock(attachments) {
	let attachment;
	const parts = attachments.split(".");
	const ext = parts[parts.length - 1];
	const source = document.createElement("source");
	if (images.indexOf(ext) != -1) {
		attachment = document.createElement("img");
		attachment.setAttribute("src", attachments);
		attachment.setAttribute("loading", "lazy");
	} else if (videos.indexOf(ext) != -1) {
		attachment = document.createElement("video");
		attachment.setAttribute("controls", true);
		source.setAttribute("src", attachments);
		attachment.appendChild(source);
	} else if (audios.indexOf(ext) != -1) {
		attachment = document.createElement("audio");
		attachment.setAttribute("controls", true);
		source.setAttribute("src", attachments);
		attachment.appendChild(source);
	} else {
		attachment = document.createElement("img");
		attachment.setAttribute("src", "./img/jimbomournsyourmisfortune.png");
		attachment.setAttribute("title", "Error: attachment can not be displayed.");
	}
	return attachment;
}

function postblock(post) {
	const postLink = `./post.html?id=${post.id}`;
	const postSpan = document.createElement("span");
	const title = document.createElement("a");
	const userSpan = document.createElement("span");
	const userLink = document.createElement("a");
	const userPfp = document.createElement("img");
	const userPronouns = document.createElement("span");
	const verifiedBadge = document.createElement("stibarc-icon");
	const dateSpan = document.createElement("span");
	const hr1 = document.createElement("hr");
	const contentSpan = document.createElement("span");
	const contentTextSpan = document.createElement("span");
	const hr2 = document.createElement("hr");
	const metaSpan = document.createElement("span");
	const upvoteIcon = document.createElement("stibarc-icon");
	const downvoteIcon = document.createElement("stibarc-icon");
	const commentIcon = document.createElement("stibarc-icon");
	const attachmentContainer = document.createElement("div");
	const moreAttachments = document.createElement("div");

	postSpan.classList.add("post", "flexcontainer", "flexcolumn");
	title.classList.add("posttitle", "leftalign", "width100");
	title.setAttribute("href", `./post.html?id=${post.id}`);
	userSpan.classList.add("flexcontainer", "leftalign", "width100");
	userLink.setAttribute("href", `/user.html?username=${post.poster.username}`);
	userLink.classList.add("flexcontainer");
	userPfp.classList.add("pfp");
	userPfp.setAttribute("src", post.poster.pfp);
	verifiedBadge.setAttribute("name", "verified");
	verifiedBadge.setAttribute("title", "Verified");
	verifiedBadge.classList.add("verifiedBadge");
	userPronouns.setAttribute("title", `Pronouns (${post.poster.pronouns})`);
	userPronouns.setAttribute("class", "pronouns");
	dateSpan.classList.add("postdate", "leftalign", "width100");
	hr1.classList.add("width100");
	contentSpan.classList.add(
		"postcontent",
		"flexcolumn",
		"leftalign",
		"width100"
	);
	hr2.classList.add("width100");
	metaSpan.classList.add("leftalign", "width100", "metaSpan");
	upvoteIcon.setAttribute("name", "up_arrow");
	downvoteIcon.setAttribute("name", "down_arrow");
	commentIcon.setAttribute("name", "comment");
	attachmentContainer.classList.add("attachmentContainer");
	moreAttachments.classList.add("moreAttachments");

	let titleText = post.title;
	if (post.title.length > maxTitleLength) {
		titleText = post.title.substring(0, maxTitleLength);
		titleText += "...";
	}
	title.innerText = titleText;
	if (post.poster.pronouns)
		userPronouns.innerText = `(${post.poster.pronouns})`;
	let postDate = new Date(post.date);
	dateSpan.innerText = postDate.toLocaleString([], {
		dateStyle: "short",
		timeStyle: "short",
	});
	dateSpan.setAttribute("title", postDate.toLocaleString());
	let postContentText = post.content;
	contentTextSpan.innerText = postContentText;
	contentSpan.append(contentTextSpan);

	metaSpan.append(
		upvoteIcon,
		post.upvotes,
		downvoteIcon,
		post.downvotes,
		commentIcon,
		post.comments
	);

	if (
		post.attachments &&
		post.attachments.length > 0 &&
		post.attachments[0] !== null
	) {
		const attachment = attachmentblock(post.attachments[0]);
		attachment.classList.add("attachmentimage");
		attachmentContainer.append(attachment);
		if (post.attachments.length > 1) {
			moreAttachments.innerText = `+${post.attachments.length - 1}`;
			attachmentContainer.append(moreAttachments);
		}
		contentSpan.append(attachmentContainer);
	}

	userLink.append(userPfp, post.poster.username);
	userSpan.append(userLink);
	if (post.poster.verified) userSpan.append(verifiedBadge);
	userSpan.append(userPronouns);
	postSpan.append(title, userSpan, dateSpan, hr1, contentSpan, hr2, metaSpan);

	postSpan.onclick = function (e) {
		location.href = postLink;
	};

	return postSpan;
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
	verifiedBadge.classList.add("verifiedBadge");
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
			window.scrollTo(0, 0);
			$("#loginformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
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
			window.scrollTo(0, 0);
			$("#loginformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		}
	});

	editBtn.addEventListener("click", () => {
		location.href = `./edit.html?id=${post.id}&cid=${comment.id}`;
	});

	return commentSpan;
}

function userBlock(user) {
	const userSpan = document.createElement("span");
	const userLink = document.createElement("a");
	const userPfp = document.createElement("img");
	const verifiedBadge = document.createElement("stibarc-icon");
	const userPronouns = document.createElement("span");

	userSpan.classList.add("post", "flexcontainer", "leftalign", "width100");
	userLink.setAttribute("href", `./user.html?username=${user.username}`);
	userLink.classList.add("flexcontainer");
	userPfp.classList.add("pfp");
	userPfp.setAttribute("src", user.pfp);
	verifiedBadge.setAttribute("name", "verified");
	verifiedBadge.setAttribute("class", "verifiedBadge");
	verifiedBadge.setAttribute("title", "Verified");
	userPronouns.setAttribute("title", `Pronouns (${user.pronouns})`);
	userPronouns.setAttribute("class", "pronouns");

	if (user.pronouns) userPronouns.innerText = `(${user.pronouns})`;

	userLink.append(userPfp, user.username);
	userSpan.append(userLink);
	if (user.verified) userSpan.append(verifiedBadge);
	userSpan.append(userPronouns);

	userSpan.addEventListener("click", () => {
		location.href = `./user.html?username=${user.username}`;
	});

	return userSpan;
}

function setLoggedinState(state) {
	$("#mypfp").setAttribute(
		"src",
		localStorage.pfp || "https://betacdn.stibarc.com/pfp/default.png"
	);
	$("#menuprofile").innerText = localStorage.username;
	$("#menuprofile").addEventListener("click", () => {
		location.href = `./user.html?username=${localStorage.username}`;
	});
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

async function logout() {
	await fetch("https://betaapi.stibarc.com/v4/logout.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			session: localStorage.sess,
		}),
	});
	delete localStorage.sess;
	delete localStorage.username;
	delete localStorage.pfp;
	delete localStorage.banner;
	$("#mypfp").setAttribute(
		"src",
		"https://betacdn.stibarc.com/pfp/default.png"
	);
	setLoggedinState(false);
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
	$("#mypfp").setAttribute(
		"src",
		localStorage.pfp || "https://betacdn.stibarc.com/pfp/default.png"
	);
	$("#menuprofile").innerText = localStorage.username;
}

window.addEventListener("load", function () {
	if (
		localStorage.sess !== undefined &&
		(sessionStorage.loadedBefore === undefined ||
			localStorage.username === undefined ||
			localStorage.pfp === undefined)
	) {
		reloadSessInfo();
		$("#menuprofile").addEventListener("click", () => {
			location.href = `./user.html?username=${localStorage.username}`;
		});
	}
	document.addEventListener("click", function (event) {
		/* header pfp dropdown */
		if (
			$("#hiddenHeader").classList.contains("hidden") ||
			$("#hiddenHeader").contains(event.target)
		) {
			$("#mypfp").classList.add("active");
			$("#hiddenHeader").classList.remove("hidden");
		} else {
			$("#mypfp").classList.remove("active");
			$("#hiddenHeader").classList.add("hidden");
		}
		if (!$("#mypfp").contains(event.target)) {
			$("#mypfp").classList.remove("active");
			$("#hiddenHeader").classList.add("hidden");
		}
		for (const func of clickhooks) {
			func(event);
		}
	});

	$("#menueditprofile").onclick = function (e) {
		location.href = "./editprofile.html";
	};
	$("#searchBtn").addEventListener("click", () => {
		location.href = "./search.html";
	});
	$("#searchbox").addEventListener("keypress", (e) => {
		const query = encodeURIComponent($("#searchbox").value);
		if (e.key == "Enter" && query.trim() != "") {
			location.href = `./search.html?q=${query}`;
		}
	});
});

window.addEventListener("scroll", function () {
	if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
		document.querySelector("#headerElement").classList.add("headerShadow");
	} else {
		document.querySelector("#headerElement").classList.remove("headerShadow");
	}
});

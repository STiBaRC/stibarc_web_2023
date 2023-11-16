const listatehooks = [];
const clickhooks = [];
const images = ["png", "jpg", "gif", "webp", "svg"];
const videos = ["mov", "mp4", "webm"];
const audios = ["spx", "m3a", "m4a", "wma", "wav", "mp3"];
const maxTitleLength = 250;
let clicked = false;
let loadingSessInfo = false;

function $(qs) {
	if (qs.startsWith("#")) return document.querySelector(qs);
	return document.querySelectorAll(qs);
}

async function vote({ id, target, vote, commentId }) {
	const request = await fetch("https://betaapi.stibarc.com/v4/vote.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: localStorage.sess,
			id,
			commentId,
			target,
			vote
		})
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
	const verifiedSpan = document.createElement("span");
	const dateSpan = document.createElement("span");
	const hr1 = document.createElement("hr");
	const contentSpan = document.createElement("span");
	const contentTextSpan = document.createElement("span");
	const hr2 = document.createElement("hr");
	const metaSpan = document.createElement("span");

	postSpan.classList.add("post", "flexcontainer", "flexcolumn");
	title.classList.add("posttitle", "leftalign", "width100");
	title.setAttribute("href", `./post.html?id=${post.id}`);
	userSpan.classList.add("flexcontainer", "leftalign", "width100");
	userLink.setAttribute("href", `/user.html?username=${post.poster.username}`);
	userLink.classList.add("flexcontainer");
	userPfp.classList.add("pfp");
	userPfp.setAttribute("src", post.poster.pfp);
	verifiedSpan.setAttribute("title", "Verified");
	userPronouns.setAttribute("title", `Pronouns (${post.poster.pronouns})`);
	userPronouns.setAttribute("class", "pronouns");
	dateSpan.classList.add("postdate", "leftalign", "width100");
	hr1.classList.add("width100");
	contentSpan.classList.add("postcontent", "flexcolumn", "leftalign", "width100");
	hr2.classList.add("width100");
	metaSpan.classList.add("leftalign", "width100");

	let titleText = post.title;
	if (post.title.length > maxTitleLength) {
		titleText = post.title.substring(0, maxTitleLength);
		titleText += "...";
	}
	title.innerText = titleText;
	verifiedSpan.innerText = "\u2705";
	if (post.poster.pronouns) userPronouns.innerText = `(${post.poster.pronouns})`;
	let postDate = new Date(post.date);
	dateSpan.innerText = postDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
	dateSpan.setAttribute("title", postDate.toLocaleString());
	let postContentText = post.content;
	contentTextSpan.innerText = postContentText;
	contentSpan.append(contentTextSpan);

	metaSpan.innerText = `\u2191 ${post.upvotes} \u2193 ${post.downvotes} \ud83d\udcac ${post.comments}`;

	if (post.attachments && post.attachments.length > 0 && post.attachments[0] !== null) {
		const attachment = attachmentblock(post.attachments[0]);
		attachment.classList.add("attachmentimage");
		contentSpan.append(attachment);
	}

	userLink.append(userPfp, post.poster.username);
	userSpan.append(userLink);
	if (post.poster.verified) userSpan.append(verifiedSpan);
	userSpan.append(userPronouns);
	postSpan.append(title, userSpan, dateSpan, hr1, contentSpan, hr2, metaSpan);

	postSpan.onclick = function (e) {
		location.href = postLink;
	}

	return postSpan;
}

function commentBlock(post, comment, isPostPage) {
	const commentSpan = document.createElement("span");
	const userSpan = document.createElement("span");
	const userLink = document.createElement("a");
	const userPfp = document.createElement("img");
	const verifiedSpan = document.createElement("span");
	const userPronouns = document.createElement("span");
	const dateSpan = document.createElement("span");
	const metaTags = document.createDocumentFragment();
	const editedSpan = document.createElement("span");
	const hr1 = document.createElement("hr");
	const contentSpan = document.createElement("span");
	const hr2 = document.createElement("hr");
	const metaSpan = document.createElement("span");
	const upvoteBtn = document.createElement("span");
	const downvoteBtn = document.createElement("span");
	const flexGrow = document.createElement("span");
	const editBtn = document.createElement("span");

	commentSpan.classList.add("comment", "flexcontainer", "flexcolumn");
	userSpan.classList.add("flexcontainer", "leftalign", "width100");
	userLink.setAttribute("href", `./user.html?username=${comment.poster.username}`);
	userLink.classList.add("flexcontainer");
	userPfp.classList.add("pfp");
	userPfp.setAttribute("src", comment.poster.pfp);
	verifiedSpan.setAttribute("title", "Verified");
	userPronouns.setAttribute("title", `Pronouns (${post.poster.pronouns})`);
	userPronouns.setAttribute("class", "pronouns");
	dateSpan.classList.add("postdate", "leftalign", "width100");
	editedSpan.classList.add("smallBadge", "dark");
	hr1.classList.add("width100");
	contentSpan.classList.add("postcontent", "flexcolumn", "leftalign", "width100");
	hr2.classList.add("width100");
	metaSpan.classList.add("leftalign", "width100");
	upvoteBtn.classList.add("flexcontainer", "button", "primary");
	upvoteBtn.setAttribute("title", "Upvote");
	downvoteBtn.classList.add("flexcontainer", "button", "primary");
	downvoteBtn.setAttribute("title", "Downvote");
	flexGrow.classList.add("flexgrow");
	editBtn.classList.add("flexcontainer", "editBtn", "hidden");
	editBtn.setAttribute("title", "Edit comment");
	editBtn.setAttribute("data-username", comment.poster.username);

	verifiedSpan.innerText = "\u2705";
	if (comment.poster.pronouns) userPronouns.innerText = `(${comment.poster.pronouns})`;
	editedSpan.innerText = "Edited";
	dateSpan.innerText = new Date(comment.date).toLocaleString();
	if (comment.edited) {
		editedSpan.setAttribute("title", `Edited ${new Date(comment.lastEdited).toLocaleString()}`);
		metaTags.append(editedSpan);
	}
	contentSpan.innerText = comment.content;
	upvoteBtn.innerText = `\u2191 ${comment.upvotes}`;
	downvoteBtn.innerText = `\u2193 ${comment.downvotes}`;
	editBtn.innerText = "";
	if (!isPostPage) {
		metaSpan.innerText = `\u2191 ${comment.upvotes} \u2193 ${comment.downvotes}`;
	}

	if (comment.attachments && comment.attachments.length > 0 && comment.attachments[0] !== null) {
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
	if (comment.poster.verified) userSpan.append(verifiedSpan);
	userSpan.append(userPronouns);
	if (isPostPage) {
		metaSpan.append(upvoteBtn, downvoteBtn, flexGrow);
		if (comment.poster.username == localStorage.username) editBtn.classList.remove("hidden");
		metaSpan.append(editBtn);
	}
	commentSpan.append(userSpan, dateSpan, metaTags, hr1, contentSpan, hr2, metaSpan);

	upvoteBtn.addEventListener("click", async () => {
		if (localStorage.sess) {
			const voteResult = await vote({ id: post.id, commentId: comment.id, target: "comment", vote: "upvote" });
			upvoteBtn.innerText = `\u2191 ${voteResult.upvotes}`;
			downvoteBtn.innerText = `\u2193 ${voteResult.downvotes}`;
		} else {
			window.scrollTo(0, 0);
			$("#loginformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		}
	});

	downvoteBtn.addEventListener("click", async () => {
		if (localStorage.sess) {
			const voteResult = await vote({ id: post.id, commentId: comment.id, target: "comment", vote: "downvote" });
			upvoteBtn.innerText = `\u2191 ${voteResult.upvotes}`;
			downvoteBtn.innerText = `\u2193 ${voteResult.downvotes}`;
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
	const verifiedSpan = document.createElement("span");
	const userPronouns = document.createElement("span");

	userSpan.classList.add("post", "flexcontainer", "leftalign", "width100");
	userLink.setAttribute("href", `./user.html?username=${user.username}`);
	userLink.classList.add("flexcontainer");
	userPfp.classList.add("pfp");
	userPfp.setAttribute("src", user.pfp);
	verifiedSpan.setAttribute("title", "Verified");
	userPronouns.setAttribute("title", `Pronouns (${post.poster.pronouns})`);
	userPronouns.setAttribute("class", "pronouns");

	verifiedSpan.innerText = "\u2705";
	if (user.pronouns) userPronouns.innerText = `(${user.pronouns})`;

	userLink.append(userPfp, user.username);
	userSpan.append(userLink);
	if (user.verified) userSpan.append(verifiedSpan);
	userSpan.append(userPronouns);

	userSpan.addEventListener("click", () => {
		location.href = `./user.html?username=${user.username}`;
	});

	return userSpan;
}

function setLoggedinState(state) {
	$("#mypfp").setAttribute("src", localStorage.pfp || "https://betacdn.stibarc.com/pfp/default.png");
	$("#menuprofile").innerText = localStorage.username;
	$("#menuprofile").addEventListener("click", () => {
		location.href = `./user.html?username=${localStorage.username}`;
	});
	Array.from(document.getElementsByClassName("loggedin")).forEach(element => {
		if (state) {
			element.classList.remove("hidden");
		} else {
			element.classList.add("hidden");
		}
	});
	Array.from(document.getElementsByClassName("loggedout")).forEach(element => {
		if (state) {
			element.classList.add("hidden");
		} else {
			element.classList.remove("hidden");
		}
	});
	for (const func of listatehooks) {
		func(state);
	}
}

async function login() {
	if (clicked) return;
	const username = $("#Login-usernameinput").value;
	const password = $("#Login-passwordinput").value;
	const totpCode = $("#Login-tfainput").value;
	if (username.trim() == "" || password.trim() == "") return;
	clicked = true;
	const response = await fetch("https://betaapi.stibarc.com/v4/login.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			username,
			password,
			totpCode
		})
	});
	const responseJSON = await response.json();
	switch (responseJSON.status) {
		default:
		case "error":
			switch (responseJSON.errorCode) {
				case "iuop":
					$("#loginerror").innerText = "Invalid username or password";
					break;
				case "totpr":
					$("#loginerror").innerText = "2FA code required";
					$("#Login-tfa").classList.remove("hidden");
					break;
				case "itotp":
					$("#loginerror").innerText = "Invalid 2FA code";
					break;
			}
			$("#loginerrorcontainer").classList.remove("hidden");
			break;
		case "ok":
			localStorage.username = username;
			localStorage.pfp = responseJSON.pfp;
			localStorage.sess = responseJSON.session;
			setLoggedinState(true);
			$("#logincancel").onclick();
			break;
	}
	clicked = false;
}

async function logout() {
	await fetch("https://betaapi.stibarc.com/v4/logout.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: localStorage.sess
		})
	});
	delete localStorage.sess;
	delete localStorage.username;
	delete localStorage.pfp;
	delete localStorage.banner;
	$("#mypfp").setAttribute("src", "https://betacdn.stibarc.com/pfp/default.png");
	setLoggedinState(false);
}

async function register() {
	if (clicked) return;
	const username = $("#Reg-usernameinput").value.trim();
	const password = $("#Reg-passwordinput").value;
	const password2 = $("#Reg-passwordinput2").value;
	const name = $("#Reg-nameinput").value || undefined;
	const displayName = $("#Reg-showname").checked || undefined;
	const pronouns = $("#Reg-pronounsinput").value || undefined;
	const displayPronouns = $("#Reg-showpronouns").checked || undefined;
	const email = $("#Reg-emailinput").value || undefined;
	const displayEmail = $("#Reg-showemail").checked || undefined;
	const birthday = ($("#Reg-bdayinput").value != "") ? new Date($("#Reg-bdayinput").value) : undefined;
	const displayBirthday = $("#Reg-showbday").checked || undefined;
	const bio = $("#Reg-bioinput").value || undefined;
	const displayBio = $("#Reg-showbio").checked || undefined;
	if (username == "") {
		$("#registererror").innerText = "Username required";
		$("#registererrorcontainer").classList.remove("hidden");
		return;
	}
	if (password == "") {
		$("#registererror").innerText = "Password required";
		$("#registererrorcontainer").classList.remove("hidden");
		return;
	}
	if (password != password2) {
		$("#registererror").innerText = "Passwords must match";
		$("#registererrorcontainer").classList.remove("hidden");
		return;
	}
	clicked = true;
	const response = await fetch("https://betaapi.stibarc.com/v4/registeruser.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			username,
			password,
			name,
			displayName,
			pronouns,
			displayPronouns,
			email,
			displayEmail,
			birthday,
			displayBirthday,
			bio,
			displayBio
		})
	});
	const responseJSON = await response.json();
	switch (responseJSON.status) {
		case "ok":
			localStorage.username = username;
			localStorage.pfp = "https://betacdn.stibarc.com/pfp/default.png";
			localStorage.sess = responseJSON.session;
			setLoggedinState(true);
			$("#registercancel").onclick();
			break;
		case "error":
			switch (responseJSON.errorCode) {
				case "ue":
					$("#registererror").innerText = "User already registered";
					$("#registererrorcontainer").classList.remove("hidden");
					break;
			}
			break;
	}
	clicked = false;
}

function showLoginModel() {
	window.scrollTo(0, 0);
	$("#Login-tfa").classList.add("hidden");
	$("#loginformcontainer").classList.remove("hidden");
	$("#overlay").classList.remove("hidden");
	document.body.classList.add("overflowhidden");
}

function showRegisterModel() {
	window.scrollTo(0, 0);
	$("#registerformcontainer").classList.remove("hidden");
	$("#overlay").classList.remove("hidden");
	document.body.classList.add("overflowhidden");
}

async function reloadSessInfo() {
	if (loadingSessInfo) return;
	loadingSessInfo = true;
	const request = await fetch("https://betaapi.stibarc.com/v4/getprivatedata.sjs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: localStorage.sess
		})
	});
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

window.addEventListener("load", function () {
	if (localStorage.sess !== undefined && sessionStorage.loadedBefore === undefined || (localStorage.sess && localStorage.username === undefined || localStorage.pfp === undefined)) {
		reloadSessInfo();
		$("#mypfp").setAttribute("src", localStorage.pfp || "https://betacdn.stibarc.com/pfp/default.png");
		$("#menuprofile").innerText = localStorage.username;
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
	$("#menulogin").onclick = function (e) {
		showLoginModel();
	}
	$("#loginlink").onclick = function (e) {
		$("#registercancel").onclick();
		$("#menulogin").onclick();
	}
	$("#logincancel").onclick = function (e) {
		$("#loginerrorcontainer").classList.add("hidden");
		$("#loginformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#Login-usernameinput").value = "";
		$("#Login-passwordinput").value = "";
	}
	$("#loginbutton").onclick = login;
	$("#menulogout").onclick = logout;
	$("#menuregister").onclick = function (e) {
		showRegisterModel();
	}
	$("#registerlink").onclick = function (e) {
		$("#logincancel").onclick();
		$("#menuregister").onclick();
	}
	$("#registercancel").onclick = function (e) {
		$("#registererrorcontainer").classList.add("hidden");
		$("#registerformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#Reg-usernameinput").value = "";
		$("#Reg-passwordinput").value = "";
		$("#Reg-passwordinput2").value = "";
		$("#Reg-nameinput").value = "";
		$("#Reg-showname").checked = false;
		$("#Reg-pronounsinput").value = "";
		$("#Reg-showpronouns").checked = false;
		$("#Reg-emailinput").value = "";
		$("#Reg-showemail").checked = false;
		$("#Reg-bdayinput").value = "";
		$("#Reg-showbday").checked = false;
		$("#Reg-bioinput").value = "";
		$("#Reg-showbio").checked = false;
	}
	$("#registerbutton").onclick = register;
	$("#menueditprofile").onclick = function (e) {
		location.href = "./editprofile.html";
	}
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
let attachments = [];
let attachmentFiles = [];
let attachmentBlobURLs = [];

let lastSeenGlobalPost = null;
let lastSeenFollowedPost = null;
let hideLoadMoreGlobal = true;
let hideLoadMoreFollowed = true;
let clicked = false;

async function getPosts(state) {
	$("#postsLoader").classList.remove("hidden");
	$("#followedPostsLoader").classList.remove("hidden");
	const postsFrag = document.createDocumentFragment();
	const fpostsFrag = document.createDocumentFragment();
	const posts = await api.getPosts({ useLastSeenGlobal: false, useLastSeenFollowed: false });
	lastSeenGlobalPost = posts.globalPosts[posts.globalPosts.length - 1].id;
	if (posts.followedPosts && posts.followedPosts.length > 0) {
		lastSeenFollowedPost = posts.followedPosts[posts.followedPosts.length - 1].id;
	}
	$("#postsLoader").classList.add("hidden");
	$("#followedPostsLoader").classList.add("hidden");
	$("#loadMoreBtn").classList.remove("hidden");
	hideLoadMoreGlobal = false;
	hideLoadMoreFollowed = false;
	for (let i in posts.globalPosts) {
		const post = new PostBlockComponent(posts.globalPosts[i]);
		postsFrag.appendChild(post);
	}
	if (posts.followedPosts) {
		for (let i in posts.followedPosts) {
			const post = new PostBlockComponent(posts.followedPosts[i]);
			fpostsFrag.appendChild(post);
		}
	}
	if (posts.globalPosts.length == 0) {
		const span = document.createElement("span");
		span.setAttribute("class", "posts");
		span.textContent = "There's nothing here ;(";
		$("#posts").appendChild(span);
	} else {
		$("#posts").appendChild(postsFrag);
		$("#followedposts").appendChild(fpostsFrag);
	}
	if (api.loggedIn && posts.followedPosts.length == 0) {
		const span = document.createElement("span");
		span.setAttribute("class", "posts");
		span.textContent = "There's nothing here ;(";
		$("#followedposts").appendChild(span);
	}
}

async function newPost() {
	if (clicked) return;
	const title = $("#newposttitle").value;
	const content = $("#newpostbody").value;
	if (title.trim() == "" || content.trim() == "") {
		alert("Title and post body must not be blank!");
		return;
	}
	clicked = true;
	$("#newpostbutton").textContent = "";
	$("#newpostbutton").classList.add("loading", "small");
	for (const file of attachmentFiles) {
		const fileName = await api.uploadFile(file, "attachment");
		attachments.push(fileName);
	}
	const newPost = await api.newPost(title, { content, attachments: (attachments.length > 0) ? attachments : undefined });
	$("#newpostbutton").textContent = "Post";
	$("#newpostbutton").classList.remove("loading", "small");
	$("#newposttitle").value = "";
	$("#newpostbody").value = "";
	attachments = [];
	attachmentFiles = [];
	for (const child of Array.from($("#attachments").childNodes)) {
		child.click();
	}
	attachmentBlobURLs = [];
	location.href = `/post.html?id=${newPost}`;
}

function setFeed(activeFeed) {
	if (activeFeed == "followed") {
		$("#posts").classList.add("hidden");
		$("#followedposts").classList.remove("hidden");
		$("#globalBtn").classList.remove("active");
		$("#followedBtn").classList.add("active");
		$("#loadMoreBtn").classList.remove("hidden");
		if (hideLoadMoreFollowed) {
			$("#loadMoreBtn").classList.add("hidden");
		}
	} else {
		$("#posts").classList.remove("hidden");
		$("#followedposts").classList.add("hidden");
		$("#followedBtn").classList.remove("active");
		$("#globalBtn").classList.add("active");
		$("#loadMoreBtn").classList.remove("hidden");
		if (hideLoadMoreGlobal) {
			$("#loadMoreBtn").classList.add("hidden");
		}
	}
	localStorage.activeFeed = activeFeed;
}

async function loadMore() {
	if (localStorage.activeFeed == "followed" && !api.loggedIn) return;

	const loader = document.createElement("span");
	loader.setAttribute("class", "loader");
	$("#loadMoreBtn").classList.add("hidden");
	$("main")[0].appendChild(loader);

	let globalFeed = localStorage.activeFeed === "global" || localStorage.activeFeed === undefined || localStorage.activeFeed === "undefined";

	const posts = document.createDocumentFragment();
	const response = await api.getPosts({
		useLastSeenGlobal: globalFeed,
		useLastSeenFollowed: (localStorage.activeFeed === "followed" && localStorage.sess !== undefined && localStorage.sess !== "undefined")
	});
	const feedPosts = (globalFeed) ? response.globalPosts : response.followedPosts;

	if (feedPosts.length !== 0) {
		if (globalFeed) {
			lastSeenGlobalPost = feedPosts[feedPosts.length - 1].id;
		} else {
			lastSeenFollowedPost = feedPosts[feedPosts.length - 1].id;
		}
	}

	for (let i in feedPosts) {
		const post = new PostBlockComponent(feedPosts[i]);
		posts.appendChild(post);
	}

	if (globalFeed) {
		$("#posts").appendChild(posts);
	} else {
		$("#followedposts").appendChild(posts);
	}

	if (globalFeed) {
		hideLoadMoreGlobal = (feedPosts.length == 0);
	} else {
		hideLoadMoreFollowed = (feedPosts.length == 0);
	}

	loader.remove();
	if (feedPosts.length !== 0) $("#loadMoreBtn").classList.remove("hidden");
}

window.addEventListener("load", function () {
	setFeed(localStorage.activeFeed);
	$("#globalBtn").onclick = function () {
		setFeed("global");
	}
	$("#followedBtn").onclick = function () {
		setFeed("followed");
	}
	$(".floatingbutton").forEach(e => {
		e.style.transition = "background-color 0.2s ease-out";
	});
	$("#loadMoreBtn").onclick = loadMore;
	$("#newpost").onclick = function (e) {
		if (api.loggedIn) {
			window.scrollTo(0, 0);
			$("#newpostformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		} else {
			$("stibarc-login-modal")[0].show();
		}
	}
	$("#addattachment").onclick = function (e) {
		const attachmentElements = $("#attachments");
		const fileInput = document.createElement("input");
		fileInput.setAttribute("type", "file");
		fileInput.setAttribute("accept", "image/*,audio/*,video/*");
		fileInput.setAttribute("multiple", "");
		fileInput.addEventListener("change", async function (e) {
			attachmentFiles = [...attachmentFiles, ...fileInput.files];
			for (const file of fileInput.files) {
				const objURL = URL.createObjectURL(file);
				attachmentBlobURLs.push(objURL);
				let attachmentElement = new AttachmentBlockComponent(objURL, false, file.name);
				attachmentElement.onclick = function (e) {
					const index = attachmentFiles.indexOf(file);
					URL.revokeObjectURL(objURL);
					attachmentFiles.splice(index, 1);
					attachmentBlobURLs.splice(index, 1);
					attachmentElement.preRemove();
					attachmentElement.remove();
				}
				attachmentElement.classList.add("attachmentimage");
				attachmentElements.appendChild(attachmentElement);
			}
		});
		fileInput.click();
	}
	$("#newpostcancel").onclick = function (e) {
		$("#newpostformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#newposttitle").value = "";
		$("#newpostbody").value = "";
		attachmentFiles = [];
		for (const child of Array.from($("#attachments").childNodes)) {
			child.click();
		}
		attachmentBlobURLs = [];
	}
	$("#newpostbutton").onclick = newPost;

	listatehooks.push(async (state) => {
		$("stibarc-post").forEach((e) => {
			e.remove();
		});
		await getPosts();
		if (state) {
			hideLoadMoreFollowed = false;
		}
		$("#loadMoreBtn").classList.remove("hidden");
	});

	api.getAnnouncement().then((announcement) => {
		if (announcement) {
			$("#announcement").classList.remove("hidden");
			$("#announcement").textContent = announcement;
		}
	});

	if (this.sessionStorage.loadedBefore === "true" || !api.loggedIn) {
		setLoggedinState(api.loggedIn);
	}
});

window.addEventListener("scroll", function () {
	if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
		document.querySelector("#globalBtn").classList.add("floatingbuttonShadow");
		document.querySelector("#followedBtn").classList.add("floatingbuttonShadow");
	} else {
		document.querySelector("#globalBtn").classList.remove("floatingbuttonShadow");
		document.querySelector("#followedBtn").classList.remove("floatingbuttonShadow");
	}
});
let attachments = [];
let attachmentFiles = [];
let attachmentBlobURLs = [];

async function getPosts() {
	const posts = document.createDocumentFragment();
	const fposts = document.createDocumentFragment();
	const request = await fetch("https://betaapi.stibarc.com/v4/getposts.sjs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			returnFollowed: (localStorage.sess != undefined) ? true : undefined,
			session: localStorage.sess
		})
	});
	const requestJSON = await request.json();
	for (let i in requestJSON.globalPosts) {
		const post = postblock(requestJSON.globalPosts[i]);
		posts.appendChild(post);
	}
	if (requestJSON.followedPosts) {
		for (let i in requestJSON.followedPosts) {
			const post = postblock(requestJSON.followedPosts[i]);
			fposts.appendChild(post);
			
		}
	}
	if (requestJSON.globalPosts.length == 0) {
		const span = document.createElement("span");
		span.setAttribute("class", "posts");
		span.innerText = "There's nothing here ;(";
		$("#posts").appendChild(span);
	} else {
		$("#posts").appendChild(posts);
		$("#followedposts").appendChild(fposts);
	}
	if (localStorage.sess != undefined && requestJSON.followedPosts.length == 0) {
		const span = document.createElement("span");
		span.setAttribute("class", "posts");
		span.innerText = "There's nothing here ;(";
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
	for (const file of attachmentFiles) {
		const response = await fetch("https://betaapi.stibarc.com/v4/uploadfile.sjs", {
		method: "post",
		headers: {
				"Content-Type": file.type,
				"X-Session-Key": localStorage.sess,
				"X-File-Usage": "attachment"
			},
			body: await file.arrayBuffer()
		});
		const responseJSON = await response.json();
		attachments.push(responseJSON.file);
	}
	const response = await fetch("https://betaapi.stibarc.com/v4/newpost.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: localStorage.sess,
			title,
			content,
			attachments: (attachments.length > 0) ? attachments : undefined
		})
	});
	const responseJSON = await response.json();
	$("#newposttitle").value = "";
	$("#newpostbody").value = "";
	attachments = [];
	attachmentFiles = [];
	for (const child of Array.from($("#attachments").childNodes)) {
		child.click();
	}
	attachmentBlobURLs = [];
	location.href = `post.html?id=${responseJSON.id}`;
}

window.addEventListener("load", function() {
	$("#globalBtn").onclick = function() {
		$("#posts").classList.remove("hidden");
		$("#followedposts").classList.add("hidden");
	}
	$("#followedBtn").onclick = function() {
		$("#posts").classList.add("hidden");
		$("#followedposts").classList.remove("hidden");
	}
	$("#newpost").onclick = function(e) {
		if (localStorage.sess) {
			window.scrollTo(0, 0);
			$("#newpostformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		} else {
			window.scrollTo(0, 0);
			$("#loginformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		}
	}
	$("#addattachment").onclick = function(e) {
		const attachmentElements = $("#attachments");
		const fileInput = document.createElement("input");
		fileInput.setAttribute("type", "file");
		fileInput.setAttribute("accept", "image/*,audio/*,video/*");
		fileInput.setAttribute("multiple", "");
		fileInput.addEventListener("change", async function(e) {
			attachmentFiles = [...attachmentFiles, ...fileInput.files];
			for (const file of fileInput.files) {
				const objURL = URL.createObjectURL(file);
				attachmentBlobURLs.push(objURL);
				let attachmentElement;
				const source = document.createElement("source");
				switch (file.type.split("/")[0]) {
					case "image":
						attachmentElement = document.createElement("img");
						attachmentElement.setAttribute("src", objURL);
						break;
					case "audio":
						attachmentElement = document.createElement("audio");
						source.setAttribute("src", objURL);
						source.setAttribute("type", file.type);
						attachmentElement.appendChild(source);
						break;
					case "video":
						attachmentElement = document.createElement("video");
						source.setAttribute("src", objURL);
						source.setAttribute("type", file.type);
						attachmentElement.appendChild(source);
						break;
				}
				attachmentElement.onclick = function(e) {
					const index = attachments.indexOf(file);
					URL.revokeObjectURL(objURL);
					attachmentFiles.splice(index, 1);
					attachmentBlobURLs.splice(index, 1);
					attachmentElement.remove();
				}
				attachmentElement.classList.add("attachmentimage");
				attachmentElements.appendChild(attachmentElement);
			}
		});
		fileInput.click();
	}
	$("#newpostcancel").onclick = function(e) {
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
	if (localStorage.sess == undefined) {
		const span = document.createElement("span");
		span.innerText = "Log in or register to view followed users";
		$("#followedposts").appendChild(span);
	}
	setLoggedinState(localStorage.sess);
	getPosts();
});

window.addEventListener("scroll", function() {
	if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
		document.querySelector("#globalBtn").classList.add("floatingbuttonShadow");
		document.querySelector("#followedBtn").classList.add("floatingbuttonShadow");
	} else {
		document.querySelector("#globalBtn").classList.remove("floatingbuttonShadow");
		document.querySelector("#followedBtn").classList.remove("floatingbuttonShadow");
	}
});
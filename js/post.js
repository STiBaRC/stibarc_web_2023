let post;
let attachments = [];
let attachmentFiles = [];
let attachmentBlobURLs = [];
let newAttachments = [];
let newAttachmentFiles = [];
let newAttachmentBlobURLs = [];
const id = parseInt(new URL(location).searchParams.get("id"));

async function newComment() {
	if (clicked) return;
	const content = $("#newcommentbody").value;
	if (content.trim() == "" && newAttachmentFiles.length == 0) return;
	clicked = true;
	for (const file of newAttachmentFiles) {
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
		newAttachments.push(responseJSON.file);
	}
	const response = await fetch("https://betaapi.stibarc.com/v4/postcomment.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: localStorage.sess,
			id,
			content,
			attachments: (newAttachments.length > 0) ? newAttachments : undefined
		})
	});
	const responseJSON = await response.json();
	$("#opennewcommentbutton").classList.remove("hidden");
	$("#newcomment").classList.add("hidden");
	$("#newcommentbody").value = "";
	newAttachments = [];
	newAttachmentFiles = [];
	for (const child of Array.from($("#attachments").childNodes)) {
		child.click();
	}
	newAttachmentBlobURLs = [];
	location.reload();
}

window.addEventListener("load", async function () {
	$("#upvoteBtn").addEventListener("click", async () => {
		if (localStorage.sess) {
			const voteResult = await vote({ id, target: "post", vote: "upvote" });
			$("#upvoteBtn").innerText = `\u2191 ${voteResult.upvotes}`;
			$("#downvoteBtn").innerText = `\u2193 ${voteResult.downvotes}`;
		} else {
			window.scrollTo(0, 0);
			$("#loginformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		}
	});
	$("#downvoteBtn").addEventListener("click", async () => {
		if (localStorage.sess) {
			const voteResult = await vote({ id, target: "post", vote: "downvote" });
			$("#upvoteBtn").innerText = `\u2191 ${voteResult.upvotes}`;
			$("#downvoteBtn").innerText = `\u2193 ${voteResult.downvotes}`;
		} else {
			window.scrollTo(0, 0);
			$("#loginformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		}
	});
	$("#opennewcommentbutton").addEventListener("click", () => {
		if (localStorage.sess) {
			$("#opennewcommentbutton").classList.add("hidden");
			$("#newcomment").classList.remove("hidden");
		} else {
			window.scrollTo(0, 0);
			$("#loginformcontainer").classList.remove("hidden");
			$("#overlay").classList.remove("hidden");
			document.body.classList.add("overflowhidden");
		}
	});
	$("#newcommentbutton").addEventListener("click", newComment);
	$("#newcommentcancel").onclick = function (e) {
		$("#opennewcommentbutton").classList.remove("hidden");
		$("#newcomment").classList.add("hidden");
		$("#newcommentbody").value = "";
		newAttachmentFiles = [];
		for (const child of Array.from($("#attachments").childNodes)) {
			child.click();
		}
		newAttachmentBlobURLs = [];
	}
	$("#addattachment").onclick = function (e) {
		const attachmentElements = $("#attachments");
		const fileInput = document.createElement("input");
		fileInput.setAttribute("type", "file");
		fileInput.setAttribute("accept", "image/*,audio/*,video/*");
		fileInput.setAttribute("multiple", "");
		fileInput.addEventListener("change", async function (e) {
			newAttachmentFiles = [...newAttachmentFiles, ...fileInput.files];
			for (const file of fileInput.files) {
				const objURL = URL.createObjectURL(file);
				newAttachmentBlobURLs.push(objURL);
				let attachmentElement;
				const source = document.createElement("source");
				switch (file.type.split("/")[0]) {
					case "image":
						attachmentElement = document.createElement("img");
						attachmentElement.setAttribute("src", objURL);
						break;
					case "audio":
						attachmentElement = document.createElement("audio");
						attachmentElement.setAttribute("controls", true);
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
				attachmentElement.onclick = function (e) {
					const index = newAttachments.indexOf(file);
					URL.revokeObjectURL(objURL);
					newAttachmentFiles.splice(index, 1);
					newAttachmentBlobURLs.splice(index, 1);
					attachmentElement.remove();
				}
				attachmentElement.classList.add("attachmentimage");
				attachmentElements.appendChild(attachmentElement);
			}
		});
		fileInput.click();
	}
	$("#editBtn").addEventListener("click", () => {
		location.href = `./edit.html?id=${id}`;
	});

	setLoggedinState(localStorage.sess);

	const request = await fetch("https://betaapi.stibarc.com/v4/getpost.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			id
		})
	});
	const responseJSON = await request.json();
	if (responseJSON.status == "error") {
		switch (responseJSON.errorCode) {
			case "rni":
			case "pnfod":
				location.href = "/404.html";
				break;
			case "ise":
				location.href = "/500.html";
		}
		return;
	}
	post = responseJSON.post;
	document.title = `${post.title} | STiBaRC`;
	$("#posttitle").innerText = post.title;
	$("#postuserlink").setAttribute("href", `./user.html?id=${post.poster.username}`);
	$("#postpfp").setAttribute("src", post.poster.pfp);
	$("#postusername").innerText = post.poster.username;
	if (post.poster.verified) $("#postverified").classList.remove("hidden");
	if (post.poster.pronouns) {
		$("#pronouns").innerText = `(${post.poster.pronouns})`;
		$("#pronouns").title = `Pronouns (${post.poster.pronouns})`;
	}
	$("#postdate").innerText = new Date(post.date).toLocaleString();
	if (post.edited) {
		$("#edited").classList.remove("hidden");
		$("#edited").title = `Edited ${new Date(post.lastEdited).toLocaleString()}`;
	}
	$("#postcontent").innerText = post.content;
	$("#upvoteBtn").innerText = `\u2191 ${post.upvotes}`;
	$("#downvoteBtn").innerText = `\u2193 ${post.downvotes}`;
	if (post.poster.username == localStorage.username) $("#editBtn").classList.remove("hidden");

	if (post.attachments && post.attachments.length > 0 && post.attachments[0] !== null) {
		for (let i = 0; i < post.attachments.length; i++) {
			const attachment = attachmentblock(post.attachments[i]);
			attachment.classList.add("postattachment");
			const parts = post.attachments[i].split(".");
			const ext = parts[parts.length - 1];
			if (images.indexOf(ext) != -1) {
				attachment.addEventListener("click", () => {
					window.open(post.attachments[i], "_blank");
				});
			}
			$("#postcontent").append(attachment);
		}
	}

	const comments = document.createDocumentFragment();

	for (const comment of post.comments) {
		comments.appendChild(commentBlock(post, comment, true));
	}

	$("#comments").appendChild(comments);

	listatehooks.push((state) => {
		if (state) {
			if (post.poster.username == localStorage.username) $("#editBtn").classList.remove("hidden");
			$(".editBtn").forEach(editBtn => {
				if (localStorage.username == editBtn.dataset.username) editBtn.classList.remove("hidden");
			});
		} else {
			$(".editBtn").forEach(editBtn => {
				editBtn.classList.add("hidden");
			});
		}
	});
});
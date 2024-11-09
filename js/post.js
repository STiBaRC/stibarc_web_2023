let post;
let attachments = [];
let attachmentFiles = [];
let attachmentBlobURLs = [];
let newAttachments = [];
let newAttachmentFiles = [];
let newAttachmentBlobURLs = [];
let clicked = false;
const id = parseInt(new URL(location).searchParams.get("id"));

const upvoteIcon = document.createElement("stibarc-icon");
const downvoteIcon = document.createElement("stibarc-icon");

upvoteIcon.setAttribute("name", "up_arrow");
downvoteIcon.setAttribute("name", "down_arrow");

upvoteIcon.classList.add("textOnRight");
downvoteIcon.classList.add("textOnRight");

const upvoteSpan = document.createElement("span");
const downvoteSpan = document.createElement("span");

async function newComment() {
	if (clicked) return;
	const content = $("#newcommentbody").value;
	if (content.trim() == "" && newAttachmentFiles.length == 0) return;
	clicked = true;
	$("#newcommentbutton").classList.add("loading", "small");
	$("#newcommentbutton").textContent = "";
	for (const file of newAttachmentFiles) {
		const newFile = await api.uploadFile(file, "attachment");
		newAttachments.push(newFile);
	}
	await api.postComment(id, { content, attachments: (newAttachments.length > 0) ? newAttachments : undefined });
	$("#newcommentbutton").classList.remove("loading", "small");
	$("#newcommentbutton").textContent = "Comment";
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
		if (api.loggedIn) {
			const voteResult = await api.vote({ postId: id, target: "post", vote: "upvote" });
			upvoteSpan.textContent = voteResult.upvotes;
			downvoteSpan.textContent = voteResult.downvotes;
		} else {
			$("stibarc-login-modal")[0].show();
		}
	});
	$("#downvoteBtn").addEventListener("click", async () => {
		if (api.loggedIn) {
			const voteResult = await api.vote({ postId: id, target: "post", vote: "downvote" });
			upvoteSpan.textContent = voteResult.upvotes;
			downvoteSpan.textContent = voteResult.downvotes;
		} else {
			$("stibarc-login-modal")[0].show();
		}
	});
	$("#opennewcommentbutton").addEventListener("click", () => {
		if (api.loggedIn) {
			$("#opennewcommentbutton").classList.add("hidden");
			$("#newcomment").classList.remove("hidden");
		} else {
			$("stibarc-login-modal")[0].show();
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

	setLoggedinState(api.loggedIn);

	let post;
	try {
		post = await api.getPost(id);
	} catch(e) {
		switch (e.message) {
			default:
				location.href = "/500.html";
				break;
			case "Post not found":
				location.href = "/404.html";
				break;
		}
	}
	document.title = `${post.title} | STiBaRC`;
	$("#posttitle").textContent = post.title;
	$("#postuserlink").setAttribute("href", `./user.html?id=${post.poster.username}`);
	$("#postpfp").setAttribute("src", post.poster.pfp);
	$("#postusername").textContent = post.poster.username;
	if (post.poster.verified) $("#postverified").classList.remove("hidden");
	if (post.poster.pronouns) {
		$("#pronouns").textContent = `(${post.poster.pronouns})`;
		$("#pronouns").title = `Pronouns (${post.poster.pronouns})`;
	}
	$("#postdate").textContent = new Date(post.date).toLocaleString();
	if (post.edited) {
		$("#edited").classList.remove("hidden");
		$("#edited").title = `Edited ${new Date(post.lastEdited).toLocaleString()}`;
	}
	$("#posttextcontent").textContent = post.content;
	$("#upvoteBtn").textContent = "";
	$("#downvoteBtn").textContent = "";
	upvoteSpan.textContent = post.upvotes;
	downvoteSpan.textContent = post.downvotes;
	$("#upvoteBtn").append(upvoteIcon, upvoteSpan);
	$("#downvoteBtn").append(downvoteIcon, downvoteSpan);
	if (post.poster.username == api.username) $("#editBtn").classList.remove("hidden");

	if (post.attachments && post.attachments.length > 0 && post.attachments[0] !== null) {
		for (let i = 0; i < post.attachments.length; i++) {
			const attachment = new AttachmentBlockComponent(post.attachments[i], true);
			$("#postcontent").append(attachment);
		}
	}

	const comments = document.createDocumentFragment();

	for (const comment of post.comments) {
		comments.appendChild(new CommentBlockComponent(post, comment, true));
	}

	$("#comments").appendChild(comments);

	if (post.deleted) {
		$("#deleted").classList.remove("hidden");
		$("#upvoteBtn").classList.add("hidden");
		$("#downvoteBtn").classList.add("hidden");
		$("#editBtn").classList.add("hidden");
		$("#opennewcommentbutton").classList.add("hidden");
		$(".editBtn").forEach(editBtn => {
			editBtn.classList.add("hidden");
		});
		$(".voteBtn").forEach(editBtn => {
			editBtn.classList.add("hidden");
		});
	}

	listatehooks.push((state) => {
		if (!post.deleted) {
			if (state) {
				if (post.poster.username == api.username) $("#editBtn").classList.remove("hidden");
				$(".editBtn").forEach(editBtn => {
					if (api.username == editBtn.dataset.username) editBtn.classList.remove("hidden");
				});
			} else {
				$(".editBtn").forEach(editBtn => {
					editBtn.classList.add("hidden");
				});
			}
		}
	});
});
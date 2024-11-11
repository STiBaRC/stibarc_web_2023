let post;
let comment;
let target;
let newAttachments = [];
let newAttachmentFiles = [];
let newAttachmentBlobURLs = [];
let clicked = false;
const sp = new URL(location).searchParams;
const id = parseInt(sp.get("id"));
const cid = parseInt(sp.get("cid"));

window.addEventListener("load", async () => {
	if (cid) {
		$("#edittitle").classList.add("hidden");
	}
	$("#addattachment").onclick = function(e) {
		const attachmentElements = $("#attachments");
		const fileInput = document.createElement("input");
		fileInput.setAttribute("type", "file");
		fileInput.setAttribute("accept", "image/*,audio/*,video/*");
		fileInput.setAttribute("multiple", "");
		fileInput.addEventListener("change", async function(e) {
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
				attachmentElement.onclick = function(e) {
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
	$("#cancel").addEventListener("click", () => {
		location.href = `/post.html?id=${id}`;
	});
	$("#editbutton").addEventListener("click", async () => {
		if (clicked) return;
		const title = $("#edittitle").value;
		const content = $("#editbody").value;
		if (target == "post" && title.trim() == "" || target == "post" && content.trim() == "") {
			alert("Title and post body must not be blank!");
			return;
		}
		if (target == "comment" && (comment.attachments.length + newAttachmentFiles.length) == 0 && content.trim() == "") {
			alert("Comment must not be blank. Have at least one attachment or content.")
			return;
		}
		clicked = true;
		for (const file of newAttachmentFiles) {
			const uploadedFile = await api.uploadFile(file, "attachment");
			newAttachments.push(uploadedFile);
		}
		const to = (target == "post") ? post : comment;
		const combinedAttachments = [...to.attachments, ...newAttachments];
		await api.edit({ postId: id, target, commentId: (target === "comment") ? cid : undefined, title: (target == "post") ? title : undefined, content, attachments: combinedAttachments });
		location.href = `/post.html?id=${id}`;
	});
	$("#deletebutton").addEventListener("click", async () => {
		if (!window.confirm(`Delete this ${target}?`)) {
			return;
		}
		if (clicked) return;
		clicked = true;
		await api.edit({ postId: id, target, commentId: (target === "comment") ? cid : undefined, deleted: true });
		location.href = (target == "post") ? "/" : `post.html?id=${id}`;
	});

	let post;
	try {
		post = await api.getPost(id);
	} catch (e) {
		switch (e.message) {
			default:
				location.href = "/500.html";
				break;
			case "Post not found":
				location.href = "/404.html";
				break;
		}
	}
	if (cid) comment = post.comments.filter(comment => comment.id == cid)[0];
	if (cid && !comment) location.href = `/post.html?id=${id}`;
	if (!cid) {
		$("#edittitle").value = post.title;
		$("#editbody").value = post.content;
		if (post.attachments && post.attachments.length > 0 && post.attachments[0] !== null) {
			for (let i = 0; i < post.attachments.length; i++) {
				const attachment = new AttachmentBlockComponent(post.attachments[i]);
				attachment.addEventListener("click", () => {
					post.attachments.splice(i, 1);
					attachment.remove();
				});
				attachment.classList.add("attachmentimage");
				$("#attachments").append(attachment);
			}
		}
		target = "post";
	} else {
		$("#editbody").value = comment.content;
		for (const i in comment.attachments) {
			let attachment = new AttachmentBlockComponent(comment.attachments[i]);
			attachment.addEventListener("click", () => {
				comment.attachments.splice(i, 1);
				attachment.remove();
			});
			attachment.classList.add("attachmentimage");
			$("#attachments").append(attachment);
		}
		target = "comment";
	}
	setLoggedinState(api.loggedIn);
});
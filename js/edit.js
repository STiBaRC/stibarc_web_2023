let post;
let comment;
let target;
let newAttachments = [];
let newAttachmentFiles = [];
let newAttachmentBlobURLs = [];
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
		location.href = `./post.html?id=${id}`;
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
		const to = (target == "post") ? post : comment;
		const combinedAttachments = [...to.attachments, ...newAttachments];
		console.log(combinedAttachments);
		const r = await fetch("https://betaapi.stibarc.com/v4/edit.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				id,
				target,
				commentId: (target == "comment") ? cid : undefined,
				title: (target == "post") ? title : undefined,
				content,
				attachments: combinedAttachments
			})
		});
		const rj = await r.json();
		location.href = `./post.html?id=${id}`;
	});
	$("#deletebutton").addEventListener("click", async () => {
		if (!window.confirm(`Delete this ${target}?`)) {
			return
		}
		if (clicked) return;
		clicked = true;
		const r = await fetch("https://betaapi.stibarc.com/v4/edit.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				id,
				target,
				commentId: (target == "comment") ? cid : undefined,
				deleted: true
			})
		});
		const rj = await r.json();
		clicked = false;
		location.href = (target == "post") ? "/" : `post.html?id=${id}`;
	});
	setLoggedinState(localStorage.sess);
	const r = await fetch("https://betaapi.stibarc.com/v4/getpost.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			id
		})
	});
	const rj = await r.json();
	if (rj.status == "error") {
		switch (rj.errorCode) {
			case "rni":
			case "pnfod":
				location.href = "/404.html";
				break;
			case "ise":
				location.href = "/500.html";
		}
		return;
	}
	post = rj.post;
	if (cid) comment = post.comments.filter(comment => comment.id == cid)[0];
	if (cid && !comment) location.href = `./post.html?id=${id}`;
	if (!cid) {
		$("#edittitle").value = post.title;
		$("#editbody").value = post.content;
		if (post.attachments && post.attachments.length > 0 && post.attachments[0] !== null) {
			for (let i = 0; i < post.attachments.length; i++) {
				const attachment = attachmentblock(post.attachments[i]);
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
			let attachment = attachmentblock(comment.attachments[i]);
			attachment.addEventListener("click", () => {
				comment.attachments.splice(i, 1);
				attachment.remove();
			});
			attachment.classList.add("attachmentimage");
			$("#attachments").append(attachment);
		}
		target = "comment";
	}
});
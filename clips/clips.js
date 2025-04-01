const swipeSensitivity = 150;

function setFeed(activeFeed) {
	if (activeFeed == "followed") {
		$("#globalBtn").classList.remove("active");
		$("#followedBtn").classList.add("active");
		$("#feed").classList.add("hidden");
		$("#followedfeed").classList.remove("hidden");
	} else {
		$("#followedBtn").classList.remove("active");
		$("#globalBtn").classList.add("active");
		$("#followedfeed").classList.add("hidden");
		$("#feed").classList.remove("hidden");
	}
	localStorage.activeClipsFeed = activeFeed;
}

function handleGesture(clip, startY, endY, lastState) {
	return new Promise(async (resolve) => {
		if (endY - startY <= -swipeSensitivity) {
			// Swipe up
			clip.restartVideo();
			const nextClip = clip.previousElementSibling;
			if (nextClip) {
				clip.style.setProperty("transform", "translateY(-100vh)");
				setTimeout(async () => {
					clip.classList.add("hidden");
					await nextClip.play();
					resolve(false);
				}, 400);
				// Check to see if we need to load more clips
				if (nextClip.previousElementSibling === null) {
					await loadClips(localStorage.activeClipsFeed ?? "global");
				}
			}
		} else if (endY - startY >= swipeSensitivity) {
			// Swipe down
			// Unhide previous clip
			clip.restartVideo();
			const previousClip = clip.nextElementSibling;
			if (previousClip) {
				previousClip.classList.remove("hidden");
				previousClip.style.setProperty("transform", "translateY(0px)");
				await previousClip.play();
			}
			resolve(true);
		} else {
			// No swipe detected, it's a tap
			(lastState) ? clip.pause() : await clip.play();
			resolve(true);
		}
	});
}

function assembleClipSequence(clips) {
	const fragment = document.createDocumentFragment();
	for (let i = clips.length - 1; i >= 0; i--) {
		const clip = document.createElement("stibarc-clip");
		clip.setAttribute("data-clip-id", clips[i].id);
		clip.setAttribute("data-username", clips[i].poster.username);
		clip.setAttribute("data-pfp", clips[i].poster.pfp);
		clip.setAttribute("data-verified", clips[i].poster.verified);
		clip.setAttribute("data-pronouns", clips[i].poster.pronouns);
		clip.setAttribute("data-content", clips[i].content);
		clip.setAttribute("data-date", clips[i].date);
		clip.setAttribute("data-upvotes", clips[i].upvotes);
		clip.setAttribute("data-downvotes", clips[i].downvotes);
		clip.setAttribute("data-comments", clips[i].comments);
		clip.setAttribute("data-description", clips[i].description);
		clip.commentButtonListener = () => {
			location.href = `/clips/?id=${clip.getAttribute("data-clip-id")}#comments`;
		}
		fragment.appendChild(clip);

		let startY = 0;
		let endY = 0;

		// Implement swipe up to view next clip, moving the clip as we swipe
		let touchstarted = false;
		let lastState = false;
		clip.addEventListener("touchstart", e => {
			if (e.composedPath()[0].tagName !== "VIDEO") return;
			e.preventDefault();
			startY = e.changedTouches[0].screenY;
			touchstarted = true;
			lastState = clip.playing;

			async function touchend(e) {
				if (!touchstarted) return;
				endY = e.changedTouches[0].screenY;
				touchstarted = false;
				window.removeEventListener("touchend", touchend);
				window.removeEventListener("touchmove", touchmove);
				clip.style.setProperty("transition", "transform 0.1s ease-out");
				if (await handleGesture(clip, startY, endY, lastState)) {
					e.preventDefault();
					clip.style.setProperty("transform", "translateY(0px)");
				}
			}

			function touchmove(e) {
				if (!touchstarted) return;
				e.preventDefault();
				const touchmoveY = e.changedTouches[0].screenY;
				const y = touchmoveY - startY;
				if (touchmoveY > startY) {
					// Show previous clip coming down if we are swiping down
					const previousClip = clip.nextElementSibling;
					if (previousClip) {
						previousClip.classList.remove("hidden");
						previousClip.style.setProperty("transition", "transform 0.1s ease-out");
						previousClip.style.setProperty("transform", `translateY(calc(${y}px - ${clip.clientHeight}px))`);
					}
				} else {
					// Show next clip underneath
					const nextClip = clip.previousElementSibling;
					if (nextClip) {
						clip.style.setProperty("transform", `translateY(${y}px)`);
					}
				}
			}

			window.addEventListener("touchend", touchend);
			window.addEventListener("touchmove", touchmove);
			clip.pause();
		});

		// Do the same for mouse
		let mousestarted = false;
		clip.addEventListener("mousedown", e => {
			if (e.composedPath()[0].tagName !== "VIDEO") return;
			e.preventDefault();
			startY = e.screenY;
			mousestarted = true;
			lastState = clip.playing;

			async function mouseup(e) {
				if (!mousestarted) return;
				endY = e.screenY;
				mousestarted = false;
				window.removeEventListener("mouseup", mouseup);
				window.removeEventListener("mousemove", mousemove);
				clip.style.setProperty("transition", "transform 0.1s ease-out");
				if (await handleGesture(clip, startY, endY, lastState)) {
					e.preventDefault();
					clip.style.setProperty("transform", "translateY(0px)");
				}
			}

			function mousemove(e) {
				if (!mousestarted) return;
				e.preventDefault();
				const touchmoveY = e.screenY;
				const y = touchmoveY - startY;
				if (touchmoveY > startY) {
					// Show previous clip coming down if we are swiping down
					const previousClip = clip.nextElementSibling;
					if (previousClip) {
						previousClip.classList.remove("hidden");
						previousClip.style.setProperty("transition", "transform 0.1s ease-out");
						previousClip.style.setProperty("transform", `translateY(calc(${y}px - ${clip.clientHeight}px))`);
					}
				} else {
					// Show next clip underneath
					const nextClip = clip.previousElementSibling;
					if (nextClip) {
						clip.style.setProperty("transition", "transform 0s");
						clip.style.setProperty("transform", `translateY(${y}px)`);
					}
				}
			}

			window.addEventListener("mouseup", mouseup);
			window.addEventListener("mousemove", mousemove);
			clip.pause();
		});
	}
	return fragment;
}

async function loadClips(feed) {
	// Load clips from the server
	const clips = await api.getClips({
		returnGlobal: feed === "global" || feed === undefined,
		returnFollowed: feed === "followed" || feed === undefined
	});
	if (clips.globalClips && clips.globalClips.length > 0) {
		$("#feed").prepend(assembleClipSequence(clips.globalClips));
	}
	if (clips.followedClips && clips.followedClips.length > 0) {
		$("#followedfeed").prepend(assembleClipSequence(clips.followedClips));
	}
}

window.addEventListener("load", async function () {
	if (new URLSearchParams(location.search).get("id")) {
		$("#newclip").classList.add("hidden");
		const clipId = new URLSearchParams(location.search).get("id");
		let clip;
		try {
			clip = await api.getClip(clipId);
		} catch (e) {
			location.href = "/clips/";
			return;
		}
		if (clip) {
			const clipComponent = document.createElement("stibarc-clip");
			clipComponent.setAttribute("data-clip-id", clip.id);
			clipComponent.setAttribute("data-username", clip.poster.username);
			clipComponent.setAttribute("data-pfp", clip.poster.pfp);
			clipComponent.setAttribute("data-verified", clip.poster.verified);
			clipComponent.setAttribute("data-pronouns", clip.poster.pronouns);
			clipComponent.setAttribute("data-content", clip.content);
			clipComponent.setAttribute("data-date", clip.date);
			clipComponent.setAttribute("data-upvotes", clip.upvotes);
			clipComponent.setAttribute("data-downvotes", clip.downvotes);
			clipComponent.setAttribute("data-comments", clip.comments.length);
			clipComponent.setAttribute("data-description", clip.description);
			clipComponent.onclick = async function (e) {
				if (e.composedPath()[0].tagName !== "VIDEO") return;
				e.preventDefault();
				if (!clipComponent.playing) {
					await clipComponent.play();
				} else {
					clipComponent.pause();
				}
			}

			for (let i = 0; i < clip.comments.length; i++) {
				const comment = new CommentBlockComponent(clip, clip.comments[i], false, true);
				$("#comments").appendChild(comment);
			}

			$("#opennewcommentbutton").onclick = function () {
				$("#commentinput").classList.remove("hidden");
				$("#opennewcommentbutton").classList.add("hidden");
			}

			$("#newcommentcancel").onclick = function () {
				$("#commentinput").classList.add("hidden");
				$("#opennewcommentbutton").classList.remove("hidden");
				$("#newcommentbody").value = "";
			}

			$("#newcommentbutton").onclick = async function () {
				const content = $("#newcommentbody").value.trim();
				if (content === "") return;
				$("#newcommentbody").disabled = true;
				$("#newcommentbutton").innerText = "";
				$("#newcommentbutton").classList.add("loading", "small");
				$("#newcommentbutton").disabled = true;
				$("#newcommentcancel").disabled = true;
				$("#closecomments").disabled = true;
				await api.postClipComment(clip.id, { content });
				$("#newcommentbody").value = "";
				location.reload();
			}

			$("#closecomments").onclick = async function () {
				$("#commentsdialog").close();
				if (api.loggedIn) {
					$("#newcommentcancel").click();
				}
				location.hash = "";
				await clipComponent.play();
			}
			clipComponent.commentButtonListener = () => {
				// Open comments dialog
				clipComponent.pause();
				location.hash = "#comments";
				$("#commentsdialog").showModal();
			}
			$("#loader").classList.add("hidden");
			$("#feed").appendChild(clipComponent);
			clipComponent.pause();
			if (location.hash === "#comments") {
				clipComponent.commentButtonListener();
			}

			listatehooks.push(async (state) => {
				if (state) {
					$("#opennewcommentbutton").classList.remove("hidden");
				} else {
					$("#opennewcommentbutton").classList.add("hidden");
				}
			});

			if (this.sessionStorage.loadedBefore === "true" || !api.loggedIn) {
				setLoggedinState(api.loggedIn);
			}

			return;
		} else {
			location.href = "/clips/";
			return;
		}
	}
	if (api.loggedIn) {
		$("#feedFilter").classList.remove("hidden");
		setFeed(localStorage.activeClipsFeed ?? "global");
	} else {
		setFeed("global");
	}
	$("#globalBtn").onclick = function () {
		setFeed("global");
	}
	$("#followedBtn").onclick = function () {
		setFeed("followed");
	}
	$(".floatingbutton").forEach(e => {
		e.style.setProperty("transition", "background-color 0.2s ease-out, transform 0.4s ease-in-out");
	});
	$(".floatingplusbuttoncontainer")[0].style.setProperty("transition", "transform 0.4s ease-in-out");

	$("#newclipcancel").onclick = function () {
		$("#newclipdialog").close();
	}

	$("#newcliprecord").onclick = function () {
		location.href = "/clips/record.html";
	}

	let clipAttachment = null;
	let clipAttachmentObjectURL = null;
	let clipAttachmentPreview = null;

	$("#newclipupload").onclick = async function () {
		clipAttachment = null;
		clipAttachmentObjectURL = null;
		clipAttachmentPreview = null;
		$("#newclipdialog").close();
		$("#uploadclipdialog").showModal();
	}

	$("#uploadclipcancel").onclick = function () {
		if (clipAttachmentPreview) {
			clipAttachmentPreview.click();
		}
		$("#uploadclipdescription").value = "";
		$("#uploadclipdialog").close();
	}

	$("#selectclip").onclick = function () {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "video/*";
		input.onchange = function () {
			const file = input.files[0];
			if (file) {
				if (clipAttachmentPreview) {
					clipAttachmentPreview.click();
				}
				const objURL = URL.createObjectURL(file);
				clipAttachment = file;
				clipAttachmentObjectURL = objURL;
				clipAttachmentPreview = new AttachmentBlockComponent(objURL, false, file.name);
				clipAttachmentPreview.classList.add("attachmentimage");
				clipAttachmentPreview.onclick = function (e) {
					clipAttachment = null;
					clipAttachmentObjectURL = null;
					URL.revokeObjectURL(clipAttachmentObjectURL);
					clipAttachmentPreview.preRemove();
					clipAttachmentPreview.remove();
					clipAttachmentPreview = null;
					$("#selectclip").classList.remove("hidden");
				}
				$("#selectclip").classList.add("hidden");
				$("#selectedclip").appendChild(clipAttachmentPreview);
			}
		}
		input.click();
	}

	$("#uploadclipconfirm").onclick = async function () {
		const description = $("#uploadclipdescription").value;
		if (!clipAttachment || description.trim() === "") return;
		this.textContent = "";
		this.classList.add("loading");
		const content = await api.uploadFile(clipAttachment, "clip");
		const clip = await api.newClip(content, description);
		if (clip) {
			this.classList.remove("loading");
			location.reload();
		}
		clipAttachmentPreview.click();
		$("#uploadclipdescription").value = "";
		$("#uploadclipdialog").close();
	}

	$("#newclip").onclick = function () {
		if (!api.loggedIn) {
			$("#newclipdialog").close();
			$("stibarc-login-modal")[0].show();
			return;
		}
		$("#newclipdialog").showModal();
	}

	// Hide floating buttons when we haven't interacted with the page for 1.5s
	let timeout = setTimeout(() => {
		$(".floatingbutton").forEach(e => e.style.setProperty("transform", "translateY(-100px)"));
		$(".floatingplusbuttoncontainer")[0].style.setProperty("transform", "translateX(100px)");
	}, 1500);
	window.addEventListener("mousemove", e => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			$(".floatingbutton").forEach(e => e.style.setProperty("transform", "translateY(-100px)"));
			$(".floatingplusbuttoncontainer")[0].style.setProperty("transform", "translateX(100px)");
		}, 1500);
		$(".floatingbutton").forEach(e => e.style.setProperty("transform", "translateY(0px)"));
		$(".floatingplusbuttoncontainer")[0].style.setProperty("transform", "translateX(0px)");
	});

	listatehooks.push(async (state) => {
		// Load clips
		await loadClips();
		$("#loader").classList.add("hidden");
		$("#followedloader").classList.add("hidden");
	});

	if (this.sessionStorage.loadedBefore === "true" || !api.loggedIn) {
		setLoggedinState(api.loggedIn);
	}
});

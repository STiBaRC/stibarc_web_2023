const sp = new URL(location).searchParams;
const username = sp.get("username") || sp.get("id");
let user;

async function followAction() {
	$("#followbutton").textContent = "";
	$("#followbutton").classList.add("loading");

	const response = await api.followUser(username);

	$("#followbutton").classList.remove("loading");
	if (response === "followed") {
		user.followers.push({ username: api.username });
		$("#followbutton").textContent = "Unfollow";
	} else if (response === "requested") {
		$("#followbutton").textContent = "Pending";
	} else if (response === "cancelled") {
		$("#followbutton").textContent = "Follow";
	} else {
		user.followers = user.followers.filter(e => e.username != api.username)
		$("#followbutton").textContent = "Follow";
	}
	$("#followers").textContent = `Followers: ${user.followers.length}`;
	$("#following").textContent = `Following: ${user.following.length}`;
}

function showLogin() {
	document.querySelector("stibarc-login-modal").show();
}

function constructFollowingers(listname) {
	const list = (listname === "followers") ? user.followers : user.following;
	const followingers = document.createDocumentFragment();
	for (let i in list) {
		const followinger = document.createElement("div");
		followinger.classList.add("followinger", "flexcontainer");
		const leftcontainer = document.createElement("span");
		const img = document.createElement("img");
		const name = document.createElement("a");

		img.setAttribute("src", list[i].pfp);
		img.setAttribute("alt", list[i].username);
		img.setAttribute("title", list[i].username);
		img.classList.add("pfp");
		name.textContent = list[i].username;
		name.setAttribute("href", `/user.html?username=${list[i].username}`);

		leftcontainer.classList.add("pointer", "flexcontainer", "leftalign");
		leftcontainer.addEventListener("click", () => {
			window.open(`/user.html?username=${list[i].username}`, "_self");
		});
		leftcontainer.appendChild(img);
		leftcontainer.appendChild(name);

		if (list[i].verified) {
			const icon = document.createElement("stibarc-icon");
			icon.setAttribute("name", "verified");
			icon.setAttribute("type", "verifiedBadge");
			icon.setAttribute("title", "Verified User");
			icon.classList.add("verifiedBadge");
			leftcontainer.appendChild(icon);
		}
		followinger.appendChild(leftcontainer);

		if (user.username === api.username && listname === "followers") {
			const removeContainer = document.createElement("span");
			removeContainer.classList.add("flexcontainer", "rightalign", "width100");
			removeContainer.style.flexGrow = "0";

			const removeButton = document.createElement("button");
			removeButton.classList.add("button", "smallBtn");
			removeButton.setAttribute("title", "Remove user");
			removeButton.textContent = "X";

			removeButton.addEventListener("click", async (e) => {
				await api.followerAction("remove", list[i].username);
				list.splice(i, 1);
				followinger.remove();
				$("#followers").textContent = `Followers: ${user.followers.length}`;
			});

			removeContainer.appendChild(removeButton);
			followinger.appendChild(removeContainer);
		}

		followingers.appendChild(followinger);
	}
	$("#followingerslist").appendChild(followingers);

	if (user.username === api.username && listname === "followers") {
		// Show pending followers if any
		if (user.pendingFollowers?.length > 0) {
			const pendingList = user.pendingFollowers;
			const pending = document.createDocumentFragment();
			for (let i in pendingList) {
				const followinger = document.createElement("div");
				followinger.classList.add("followinger", "flexcontainer");
				const leftcontainer = document.createElement("span");
				const img = document.createElement("img");
				const name = document.createElement("a");

				img.setAttribute("src", pendingList[i].pfp);
				img.setAttribute("alt", pendingList[i].username);
				img.setAttribute("title", pendingList[i].username);
				img.classList.add("pfp");
				name.textContent = pendingList[i].username;
				name.setAttribute("href", `/user.html?username=${pendingList[i].username}`);

				leftcontainer.classList.add("pointer", "flexcontainer", "leftalign");
				leftcontainer.addEventListener("click", () => {
					window.open(`/user.html?username=${pendingList[i].username}`, "_self");
				});
				leftcontainer.appendChild(img);
				leftcontainer.appendChild(name);

				if (pendingList[i].verified) {
					const icon = document.createElement("stibarc-icon");
					icon.setAttribute("name", "verified");
					icon.setAttribute("type", "verifiedBadge");
					icon.setAttribute("title", "Verified User");
					icon.classList.add("verifiedBadge");
					leftcontainer.appendChild(icon);
				}
				followinger.appendChild(leftcontainer);

				const actionContainer = document.createElement("span");
				actionContainer.classList.add("flexcontainer", "rightalign", "width100");
				actionContainer.style.flexGrow = "0.5";

				const approveButton = document.createElement("button");
				approveButton.classList.add("button", "smallBtn");
				approveButton.setAttribute("title", "Approve user");
				approveButton.textContent = "✔";

				approveButton.addEventListener("click", async (e) => {
					await api.followerAction("approve", pendingList[i].username);
					const newFollower = pendingList.splice(i, 1);
					user.followers.push(newFollower[0]);
					followinger.remove();
					$("#followers").textContent = `Followers: ${user.followers.length}`;
					// Reload the followers list to reflect the changes
					if (pendingList.length === 0) {
						$("#pendingfollowerstitle").classList.add("hidden");
						$("#pendingfollowerslist").classList.add("hidden");
						$("#followersdivider").classList.add("hidden");
					}
					$("#followingerslist").replaceChildren();
					constructFollowingers("followers");
				});

				const rejectButton = document.createElement("button");
				rejectButton.classList.add("button", "smallBtn");
				rejectButton.setAttribute("title", "Reject user");
				rejectButton.textContent = "X";

				rejectButton.addEventListener("click", async (e) => {
					await api.followerAction("reject", pendingList[i].username);
					pendingList.splice(i, 1);
					followinger.remove();
					if (pendingList.length === 0) {
						$("#pendingfollowerstitle").classList.add("hidden");
						$("#pendingfollowerslist").classList.add("hidden");
						$("#followersdivider").classList.add("hidden");
					}
				});

				actionContainer.appendChild(approveButton);
				actionContainer.appendChild(rejectButton);
				followinger.appendChild(actionContainer);

				pending.appendChild(followinger);
			}

			$("#pendingfollowerslist").appendChild(pending);
			$("#pendingfollowerstitle").classList.remove("hidden");
			$("#pendingfollowerslist").classList.remove("hidden");
			$("#followersdivider").classList.remove("hidden");
		}
	}

	$("#followingersmodal").showModal();
}

window.addEventListener("load", async () => {
	await waitForGlobalInit();
	document.title = `${username} | STiBaRC`;
	$("#userusername").textContent = username;

	setLoggedinState(api.loggedIn);

	try {
		user = await api.getUser(username);
	} catch (e) {
		switch (e.message) {
			default:
				location.href = "/500.html";
				break;
			case "User not found":
				location.href = "/404.html";
				break;
		}
		return;
	}
	if (user.verified) $("#userverified").classList.remove("hidden");
	$("#userpfp").setAttribute("src", user.pfp);
	$("#userpfp").classList.add("pointer");
	$("#userpfp").addEventListener("click", () => {
		window.open(user.fullPfp, "_blank");
	});
	if (user.banner !== api.defaultBannerUrl) $("#userBanner").classList.remove("hidden");
	$("#userBanner").classList.remove("light", "loading");
	$("#userBanner").classList.add("pointer");
	$("#userBanner").style.backgroundImage = `url('${user.banner}')`;
	$("#userBanner").addEventListener("click", () => {
		window.open(user.fullBanner, "_blank");
	});
	if (user.name && user.displayName) {
		$("#name").textContent = `Real Name: ${user.name}`;
	} else {
		$("#name").classList.add("hidden");
	}
	if (user.pronouns && user.displayPronouns) {
		$("#pronouns").textContent = `(${user.pronouns})`;
		$("#pronouns").title = `Pronouns (${user.pronouns})`;
	}
	if (user.email && user.displayEmail) {
		$("#email").textContent = `Email: ${user.email}`;
	} else {
		$("#email").classList.add("hidden");
	}
	if (user.displayBirthday) {
		const UTCDate = new Date(user.birthday);
		const diff = UTCDate.getTimezoneOffset() * 60000;
		$("#birthday").textContent = `Birthday: ${new Date(UTCDate.valueOf() + diff).toLocaleDateString()}`;
	} else {
		$("#birthday").classList.add("hidden");
	}
	$("#rank").textContent = `Rank: ${user.rank}`;
	if (user.displayBio) {
		$("#bio").textContent = user.bio;
	} else {
		$("#bio").classList.add("hidden");
	}
	$("#followers").textContent = `Followers: ${user.followers.length}`;
	$("#following").textContent = `Following: ${user.following.length}`;
	if (api.loggedIn) {
		$("#followbutton").addEventListener("click", followAction);
	} else {
		$("#followbutton").addEventListener("click", showLogin);
	}
	listatehooks.push((state) => {
		if (state) {
			$("#followbutton").removeEventListener("click", showLogin);
			$("#followbutton").addEventListener("click", followAction);
			if (user.followers.filter(e => e.username == api.username).length > 0) {
				$("#followbutton").textContent = "Unfollow";
			} else {
				$("#followbutton").textContent = "Follow";
				if (user.private && user.username !== api.username) {
					$("#private").classList.remove("hidden");
				}
			}
			if (user.pending) {
				$("#followbutton").textContent = "Pending";
			}
		} else {
			$("#followbutton").removeEventListener("click", followAction);
			$("#followbutton").addEventListener("click", showLogin);
			$("#followbutton").textContent = "Follow";
		}
	});
	if (user.followers.filter(e => e.username == api.username).length > 0) {
		$("#followbutton").textContent = "Unfollow";
	} else {
		$("#followbutton").textContent = "Follow";
		if (user.pending) {
			$("#followbutton").textContent = "Pending";
		}
		if (user.private && user.username !== api.username) {
			$("#private").classList.remove("hidden");
		}
	}
	$("#userPostsLoader").classList.add("hidden");
	if (user.clips.length > 0) {
		const clips = document.createDocumentFragment();
		for (let i in user.clips) {
			const clip = new ClipBlockComponent(user.clips[i]);
			clips.appendChild(clip);
		}
		$("#clips").appendChild(clips);
		$("#clips").classList.remove("hidden");
	}
	$("#followers").addEventListener("click", () => {
		$("#followingerstitle").textContent = "Followers";
		constructFollowingers("followers");
		$("#followingersmodal").scrollTop = 0;
	});
	$("#following").addEventListener("click", () => {
		$("#followingerstitle").textContent = "Following";
		constructFollowingers("following");
		$("#followingersmodal").scrollTop = 0;
	});
	$("#followingersclose").addEventListener("click", () => {
		$("#followingersmodal").close();
		// Clear the list when closing the modal
		$("#followingerslist").replaceChildren();
		$("#pendingfollowerslist").replaceChildren();
		$("#pendingfollowerstitle").classList.add("hidden");
		$("#pendingfollowerslist").classList.add("hidden");
		$("#followersdivider").classList.add("hidden");
	});
	const posts = document.createDocumentFragment();
	for (let i in user.posts) {
		const post = new PostBlockComponent(user.posts[i]);
		posts.appendChild(post);
	}
	$("#posts").appendChild(posts);
});
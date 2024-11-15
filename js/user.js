const sp = new URL(location).searchParams;
const username = sp.get("username") || sp.get("id");
let user;

async function followAction() {
	$("#followbutton").textContent = "";
	$("#followbutton").classList.add("loading");

	const response = await api.followUser(username);

	$("#followbutton").classList.remove("loading");
	if (response == "followed") {
		user.followers.push({username: api.username});
	} else {
		user.followers = user.followers.filter(e => e.username != api.username)
	}
	$("#followers").textContent = `Followers: ${user.followers.length}`;
	$("#following").textContent = `Following: ${user.following.length}`;
	if (user.followers.filter(e => e.username == api.username).length > 0) {
		$("#followbutton").textContent = "Unfollow";
	} else {
		$("#followbutton").textContent = "Follow";
	}
}

function showLogin() {
	document.querySelector("stibarc-login-modal").show();
}

window.addEventListener("load", async () => {
	document.title = `${username} | STiBaRC`;
	$("#userusername").textContent = username;

	if (sessionStorage.loadedBefore !== undefined) setLoggedinState(api.loggedIn);

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
	if (user.banner !== api.defaultBannerUrl) $("#userBanner").classList.remove("hidden");
	$("#userBanner").classList.remove("light", "loading");
	$("#userBanner").classList.add("pointer");
	$("#userBanner").style.backgroundImage = `url('${user.banner}')`;
	$("#userBanner").addEventListener("click", () => {
		window.open(user.banner, "_blank");
	});
	$("#name").textContent = `Real name: ${user.name}`;
	if (user.pronouns) {
		$("#pronouns").textContent = `(${user.pronouns})`;
		$("#pronouns").title = `Pronouns (${user.pronouns})`;
	}
	$("#email").textContent = `Email: ${user.email}`;
	if (user.displayBirthday) {
		const UTCDate = new Date(user.birthday);
		const diff = UTCDate.getTimezoneOffset() * 60000;
		$("#birthday").textContent = `Birthday: ${new Date(UTCDate.valueOf() + diff).toLocaleDateString()}`;
	} else {
		$("#birthday").textContent = "Birthday: Not shown";
	}
	$("#rank").textContent = `Rank: ${user.rank}`;
	$("#bio").textContent = user.bio;
	if (user.displayBio) $("#bio").classList.remove("hidden");
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
	}
	$("#userPostsLoader").classList.add("hidden");
	const posts = document.createDocumentFragment();
	for (let i in user.posts) {
		const post = new PostBlockComponent(user.posts[i]);
		posts.appendChild(post);
	}
	$("#posts").appendChild(posts);
});
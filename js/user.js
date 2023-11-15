const sp = new URL(location).searchParams;
const username = sp.get("username") || sp.get("id");
let user;

async function followSwitch() {
	$("#followbutton").innerText = "";
	$("#followbutton").classList.add("loading");
	const fr = await fetch("https://betaapi.stibarc.com/v4/followuser.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: localStorage.sess,
			username
		})
	});
	const frj = await fr.json();
	$("#followbutton").classList.remove("loading");
	if (frj.action == "followed") {
		user.followers.push({username: localStorage.username});
	} else {
		user.followers = user.followers.filter(e => e.username != localStorage.username)
	}
	$("#followers").innerText = `Followers: ${user.followers.length}`;
	$("#following").innerText = `Following: ${user.following.length}`;
	if (user.followers.filter(e => e.username == localStorage.username).length > 0) {
		$("#followbutton").innerText = "Unfollow";
	} else {
		$("#followbutton").innerText = "Follow";
	}
}

window.addEventListener("load", async () => {
	document.title = `${username} | STiBaRC`;
	$("#userusername").innerText = username;
	setLoggedinState(localStorage.sess);
	const request = await fetch("https://betaapi.stibarc.com/v4/getuser.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			username
		})
	});
	const requestJSON = await request.json();
	if (requestJSON.status == "error") {
		switch (requestJSON.errorCode) {
			case "rnu":
			case "unf":
				location.href = "/404.html";
				break;
			case "ise":
				location.href = "/500.html";
		}
		return;
	}
	user = requestJSON.user;
	if (user.verified) $("#userverified").classList.remove("hidden");
	$("#userpfp").setAttribute("src", user.pfp);
	if (user.banner !== "https://betacdn.stibarc.com/banner/default.png") $("#userBanner").classList.remove("hidden");
	$("#userBanner").classList.remove("light", "loading");
	$("#userBanner").classList.add("pointer");
	$("#userBanner").style.backgroundImage = `url('${user.banner}')`;
	$("#userBanner").addEventListener("click", () => {
		window.open(user.banner, "_blank");
	});
	$("#name").innerText = `Real name: ${user.name}`;
	if (user.pronouns) {
		$("#pronouns").innerText = `(${user.pronouns})`;
		$("#pronouns").title = `Pronouns (${user.pronouns})`;
	}
	$("#email").innerText = `Email: ${user.email}`;
	if (user.displayBirthday) {
		const UTCDate = new Date(user.birthday);
		const diff = UTCDate.getTimezoneOffset() * 60000;
		$("#birthday").innerText = `Birthday: ${new Date(UTCDate.valueOf() + diff).toLocaleDateString()}`;
	} else {
		$("#birthday").innerText = "Birthday: Not shown";
	}
	$("#rank").innerText = `Rank: ${user.rank}`;
	$("#bio").innerText = user.bio;
	if (user.displayBio) $("#bio").classList.remove("hidden");
	$("#followers").innerText = `Followers: ${user.followers.length}`;
	$("#following").innerText = `Following: ${user.following.length}`;
	listatehooks.push((state) => {
		if (state) {
			if (user.followers.filter(e => e.username == localStorage.username).length > 0) {
				$("#followbutton").innerText = "Unfollow";
			} else {
				$("#followbutton").innerText = "Follow";
			}
		} else {
			$("#followbutton").innerText = "Follow";
		}
	});
	if (user.followers.filter(e => e.username == localStorage.username).length > 0) {
		$("#followbutton").innerText = "Unfollow";
	} else {
		$("#followbutton").innerText = "Follow";
	}
	$("#followbutton").addEventListener("click", async () => {
		followSwitch();
	});
	$("#userPostsLoader").classList.add("hidden");
	const posts = document.createDocumentFragment();
	for (let i in user.posts) {
		const post = postblock(user.posts[i]);
		posts.appendChild(post);
	}
	$("#posts").appendChild(posts);
});
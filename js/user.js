const sp = new URL(location).searchParams;
const username = sp.get("username") || sp.get("id");
let user;

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
				location.href = "404.html";
				break;
			case "ise":
				location.href = "500.html";
		}
		return;
	}
	user = requestJSON.user;
	if (user.verified) $("#userverified").classList.remove("hidden");
	$("#userpfp").setAttribute("src", user.pfp);
	$("#name").innerText = `Real name: ${user.name}`;
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
	});
	
	const posts = document.createDocumentFragment();
	for (let i in user.posts) {
		const post = postblock(user.posts[i]);
		posts.appendChild(post);
	}
	$("#posts").appendChild(posts);
});
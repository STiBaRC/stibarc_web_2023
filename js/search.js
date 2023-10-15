window.addEventListener("load", async () => {
	const query = new URL(location).searchParams.get("q");
	$("#searchbox").value = query;
	setLoggedinState(localStorage.sess);
	const r = await fetch("https://betaapi.stibarc.com/v4/search.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			query
		})
	});
	const rj = await r.json();
	if (rj.status == "error") return;

	const users = document.createDocumentFragment();
	const posts = document.createDocumentFragment();
	
	for (const user of rj.results.users) {
		users.appendChild(userBlock(user));
	}

	for (const post of rj.results.posts) {
		posts.appendChild(postblock(post));
	}

	$("#users").appendChild(users);
	$("#posts").appendChild(posts);
});
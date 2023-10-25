window.addEventListener("load", async () => {
	
	$("#searchboxMobile").addEventListener("change", (e) => {
		$("#searchbox").value = $("#searchboxMobile").value;
	});

	$("#searchboxMobile").addEventListener("keypress", (e) => {
		const query = encodeURIComponent($("#searchboxMobile").value);
		if (e.key == "Enter" && query.trim() != "") {
			location.href = `search.html?q=${query}`;
		}
	});

	setLoggedinState(localStorage.sess);

	const url = new URL(location);
	let query = null;
	if (url.searchParams.has('q')) {
		query = url.searchParams.get("q");
	} else {
		console.log("No query!");
		return;
	}

	$("#searchbox").value = query;
	$("#searchboxMobile").value = query;

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
	if (rj.status == "error") console.error(rj);

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

	if (rj.results.users.length == 0 && rj.results.posts.length == 0) {
		$("#noResults").style.display = "block";
	}
});
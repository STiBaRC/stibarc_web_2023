window.addEventListener("load", async () => {
	
	$("#searchboxMobile").addEventListener("change", (e) => {
		$("#searchbox").value = $("#searchboxMobile").value;
	});

	$("#searchboxMobile").addEventListener("keypress", (e) => {
		const query = encodeURIComponent($("#searchboxMobile").value);
		if (e.key == "Enter" && query.trim() != "") {
			location.href = `/search.html?q=${query}`;
		}
	});

	if (sessionStorage.loadedBefore !== undefined) setLoggedinState(api.loggedIn);

	const url = new URL(location);
	let query = null;
	if (url.searchParams.has('q')) {
		query = url.searchParams.get("q");
	} else {
		console.log("No query!");
		return;
	}

	$("stibarc-header")[0].setSearchBox(query);
	$("#searchboxMobile").value = query;
	$("#loader").style.display = "flex";

	const results = await api.search(query);

	$("#loader").style.display = "none";

	const users = document.createDocumentFragment();
	const posts = document.createDocumentFragment();

	for (const user of results.users) {
		users.appendChild(new UserBlockComponent(user));
	}

	for (const post of results.posts) {
		posts.appendChild(new PostBlockComponent(post));
	}

	$("#users").appendChild(users);
	$("#posts").appendChild(posts);

	if (results.users.length == 0 && results.posts.length == 0) {
		$("#noResults").style.display = "block";
	}
});
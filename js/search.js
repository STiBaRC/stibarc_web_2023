window.addEventListener("load", async () => {

	setLoggedinState(api.loggedIn);

	const url = new URL(location);
	let query = null;
	if (url.searchParams.has('q')) {
		query = url.searchParams.get("q");
	} else {
		console.log("No query!");
		return;
	}

	$("stibarc-header")[0].setSearchBox(query);
	$("#query").textContent = `${query}`;
	$("#loader").classList.remove("hidden");

	const results = await api.search(query);

	$("#loader").classList.add("hidden");
	$("#query").classList.remove("hidden");
	const resultsCount = results.users.length + results.clips.length + results.posts.length;
	$("#resultsCount").textContent = `${resultsCount} Results`;
	$("#resultsCount").classList.remove("hidden");

	const users = document.createDocumentFragment();
	const clips = document.createDocumentFragment();
	const posts = document.createDocumentFragment();

	for (const user of results.users) {
		users.appendChild(new UserBlockComponent(user));
	}

	for (const clip of results.clips) {
		clips.appendChild(new ClipBlockComponent(clip));
	}

	if (results.clips.length > 0) {
		$("#clips").classList.remove("hidden");
	}

	for (const post of results.posts) {
		posts.appendChild(new PostBlockComponent(post));
	}

	$("#users").appendChild(users);
	$("#clips").appendChild(clips);
	$("#posts").appendChild(posts);

	if (results.users.length == 0 && results.clips.length == 0 && results.posts.length == 0) {
		$("#noResults").classList.remove("hidden");
	}
});
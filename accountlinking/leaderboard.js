window.addEventListener("load", async function () {
	await waitForGlobalInit();

	// Get the leaderboard data and populate the table
	fetch(`${api.host}/v4/accountlinking/getleaderboard.sjs`).then(response => response.json()).then(data => {
		const tbody = document.querySelector("#leaderboard tbody");
		for (const entry of data.leaderboard) {
			let displayUsername = entry.username;
			if (displayUsername.length > maxUsernameLength) displayUsername = `${displayUsername.substring(0, maxUsernameLength)}...`;

			const tr = document.createElement("tr");
			const usernameTd = document.createElement("td");
			const usernameLink = document.createElement("a");
			usernameLink.href = `/user.html?username=${encodeURIComponent(entry.username)}`;
			usernameLink.textContent = displayUsername;
			usernameTd.appendChild(usernameLink);
			tr.appendChild(usernameTd);
			const scoreTd = document.createElement("td");
			scoreTd.textContent = entry.score;
			tr.appendChild(scoreTd);
			const linkedAccountsTd = document.createElement("td");
			linkedAccountsTd.textContent = entry.linked;
			tr.appendChild(linkedAccountsTd);
			tbody.appendChild(tr);
		}
	});

	setLoggedinState(api.loggedIn);
});
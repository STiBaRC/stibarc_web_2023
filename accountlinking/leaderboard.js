window.addEventListener("load", async function () {
	await waitForGlobalInit();

	// Get the leaderboard data and populate the table
	fetch(`${api.host}/v4/accountlinking/getleaderboard.sjs`).then(response => response.json()).then(data => {
		const tbody = document.querySelector("#leaderboard tbody");
		for (const entry of data.leaderboard) {
			const tr = document.createElement("tr");
			const usernameTd = document.createElement("td");
			usernameTd.textContent = entry.username;
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
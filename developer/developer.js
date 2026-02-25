window.addEventListener("load", async function () {
	await waitForGlobalInit();

	$("#newapp").addEventListener("click", function () {
		$("#newappdialog").showModal();
	});

	$("#cancelcreateapp").addEventListener("click", function () {
		$("#newappdialog").close();
		$("#appname").value = "";
		$("#appiconurl").value = "";
		$("#appdescription").value = "";
		$("#appdescription").textContent = "";
	});

	$("#appname").addEventListener("input", function (e) {
		if (e.target.value.length > 0) {
			$("#submitcreateapp").removeAttribute("disabled");
		} else {
			$("#submitcreateapp").setAttribute("disabled", "true");
		}
	});

	$("#submitcreateapp").addEventListener("click", async function (e) {
		e.preventDefault();
		$("#submitcreateapp").setAttribute("disabled", "true");
		$("#submitcreateapp").textContent = "";
		$("#submitcreateapp").classList.add("loading", "small");

		const appName = $("#appname").value;
		const appIconURL = $("#appiconurl").value;
		const appDescription = $("#appdescription").value;

		const response = await fetch(`${api.host}/v4/developer/createapp.sjs`, {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name: appName,
				icon: appIconURL,
				description: appDescription,
				session: api.session
			})
		});

		const responseJSON = await response.json();

		location.href = `/developer/app.html?id=${responseJSON.clientId}`;
	});

	listatehooks.push(async (state) => {
		if (state) {

			const apps = await api.getApps();
			$("#app-list").classList.remove("loading");
			console.log(apps)

			if (apps.length === 0) {
				const noApps = document.createElement("div");
				noApps.innerText = "Get started by creating your first app";
				$("#app-list").appendChild(noApps);
			}

			const appList = document.createDocumentFragment();

			apps.forEach((app) => {
				const appItem = document.createElement("stibarc-developer-app");
				appItem.setAttribute("name", app.name);
				appItem.setAttribute("id", app.id);
				appItem.setAttribute("description", app.description);
				appItem.setAttribute("icon", app.icon);
				appItem.setAttribute("verified", app.verified);
				appItem.setAttribute("firstparty", app.firstparty);
				appList.appendChild(appItem);
			});

			$("#app-list").appendChild(appList);
		}
	});

	setLoggedinState(api.loggedIn);

});
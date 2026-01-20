let selectedTab = location.hash.slice(1) || "general";
let isMobile = false;

async function getApp(id) {
	const response = await fetch(`${api.host}/v4/developer/getappdetails.sjs?client_id=${encodeURIComponent(id)}`, {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: api.session
		})
	});
	const data = await response.json();
	return data.application;
}

function switchTab(tabEl) {
	$(".sidebarItems li").forEach(item => {
		item.classList.remove("active");
	});
	tabEl.classList.add("active");
	let tab = tabEl.id.replace("tab-", "");
	location.hash = tab;
	$(".tabContent").forEach(item => {
		item.classList.add("hidden");
	});
	if (isMobile) {
		$("#backBtn").classList.remove("hidden");
		$("#sidebarTabs").classList.add("hidden");
		if (tab) {
			$("#sideContent").classList.remove("hidden");
		}
	}
	if (tab || !isMobile) {
		$(`#tabContent-${tab}`).classList.remove("hidden");
	}
}

const mediaQuery = window.matchMedia("(max-width: 475px)");

function handleViewportChange(e) {
	if (e.matches) {
		isMobile = true;
		if (location.hash) {
			$("#backBtn").classList.remove("hidden");
			$("#sideContent").classList.remove("hidden");
			$("#sidebarTabs").classList.add("hidden");
		} else {
			$("#backBtn").classList.add("hidden");
			$("#sideContent").classList.add("hidden");
			$("#sidebarTabs").classList.remove("hidden");
		}
	} else {
		isMobile = false;
		$("#backBtn").classList.add("hidden");
		$("#sideContent").classList.remove("hidden");
		$("#sidebarTabs").classList.remove("hidden");
	}
}

function reloadCallbackUrls(appDetails) {
	$("#callbackurls").replaceChildren();
	const entries = document.createDocumentFragment();
	appDetails.callbackurls.forEach((url, index) => {
		const container = document.createElement("div");
		const callbackurl = document.createElement("input");

		callbackurl.type = "text";
		callbackurl.value = url;
		callbackurl.classList.add("callbackurl");
		callbackurl.placeholder = `Callback URL ${index + 1}`;
		callbackurl.id = `callbackurl-${index}`;
		callbackurl.addEventListener("input", () => {
			appDetails.callbackurls[index] = callbackurl.value;
		});

		const removeButton = document.createElement("button");
		removeButton.classList.add("button", "smallBtn");
		removeButton.setAttribute("title", "Remove callback URL");
		removeButton.textContent = "X";

		removeButton.addEventListener("click", (e) => {
			e.preventDefault();
			appDetails.callbackurls.splice(index, 1);
			reloadCallbackUrls(appDetails);
		});

		container.appendChild(callbackurl);
		container.appendChild(removeButton);
		entries.appendChild(container);
	});
	$("#callbackurls").appendChild(entries);
}

function reloadWebhookUrls(appDetails) {
	$("#webhookurls").replaceChildren();
	const entries = document.createDocumentFragment();
	appDetails.webhooks.forEach((webhook, index) => {
		const container = document.createElement("div");
		const webhookurl = document.createElement("input");
		const webhookevent = document.createElement("select");
		const webhookmethod = document.createElement("select");

		for (const event of [{name:"newpost",humanName:"New post"}, {name:"newclip",humanName:"New clip"}, {name:"newcomment",humanName:"New post comment"}, {name:"newclipcomment",humanName:"New clip comment"}]) {
			const option = document.createElement("option");
			option.value = event.name;
			option.textContent = event.humanName;
			if (webhook.hook === event.name) {
				option.selected = true;
			}
			webhookevent.appendChild(option);
		}
		webhookevent.classList.add("webhookevent");
		webhookevent.id = `webhookevent-${index}`;
		webhookevent.addEventListener("input", () => {
			appDetails.webhooks[index].hook = webhookevent.value;
		});

		for (const method of ["GET", "POST"]) {
			const option = document.createElement("option");
			option.value = method;
			option.textContent = method;
			if (webhook.method === method) {
				option.selected = true;
			}
			webhookmethod.appendChild(option);
		}

		webhookmethod.classList.add("webhookmethod");
		webhookmethod.id = `webhookmethod-${index}`;
		webhookmethod.addEventListener("input", () => {
			appDetails.webhooks[index].method = webhookmethod.value;
		});

		webhookurl.type = "text";
		webhookurl.value = webhook.endpoint;
		webhookurl.classList.add("webhookurl");
		webhookurl.placeholder = `Webhookurl URL ${index + 1}`;
		webhookurl.id = `webhookurl-${index}`;
		webhookurl.addEventListener("input", () => {
			appDetails.webhooks[index].endpoint = webhookurl.value;
		});

		const removeButton = document.createElement("button");
		removeButton.classList.add("button", "smallBtn");
		removeButton.setAttribute("title", "Remove webhook URL");
		removeButton.textContent = "X";

		removeButton.addEventListener("click", (e) => {
			e.preventDefault();
			appDetails.webhooks.splice(index, 1);
			reloadWebhookUrls(appDetails);
		});

		container.appendChild(webhookurl);
		container.appendChild(webhookevent);
		container.appendChild(webhookmethod);
		container.appendChild(removeButton);
		entries.appendChild(container);
	});
	$("#webhookurls").appendChild(entries);
}

window.addEventListener("load", async () => {
	await waitForGlobalInit();

	$(".sidebarItems li").forEach(item => {
		item.addEventListener("click", () => {
			switchTab(item);
		});
	});
	$(".tabContent").forEach(element => {
		element.classList.add("hidden");
	});
	$(`#tab-${selectedTab}`).classList.add("active");
	if (location.hash || !isMobile) {
		$(`#tabContent-${selectedTab}`).classList.remove("hidden");
	}

	if (!api.loggedIn) {
		window.location.href = `/developer/`;
	}

	const client_id = new URLSearchParams(window.location.search).get("id");
	const appDetails = await getApp(client_id);

	if (!appDetails) {
		window.location.href = `/developer/`;
		return;
	}

	document.title = `${appDetails.name} | Developer | STiBaRC`;
	$("#appnameheader").textContent = appDetails.name;
	$("#appicon").src = appDetails.icon;
	$("#appname").value = appDetails.name;
	$("#appiconurl").value = appDetails.icon;
	$("#appdesc").textContent = appDetails.description;
	$("#clientid").textContent = appDetails.id;
	$("#clientsecret").textContent = appDetails.secret;
	$("#confirmdeleteinput").setAttribute("placeholder", appDetails.name);

	$("#appname").addEventListener("input", () => {
		appDetails.name = $("#appname").value;
		document.title = `${appDetails.name} | Developer | STiBaRC`;
		$("#appnameheader").textContent = appDetails.name;
		$("#confirmdeleteinput").setAttribute("placeholder", appDetails.name);
	});
	$("#appiconurl").addEventListener("input", () => {
		appDetails.icon = $("#appiconurl").value;
		$("#appicon").src = appDetails.icon;
	});
	$("#appdesc").addEventListener("input", () => {
		appDetails.description = $("#appdesc").value;
	});

	reloadCallbackUrls(appDetails);

	$("#addcallbackurl").addEventListener("click", () => {
		appDetails.callbackurls.push("");
		reloadCallbackUrls(appDetails);
	});

	reloadWebhookUrls(appDetails);
	$("#addwebhookurl").addEventListener("click", () => {
		appDetails.webhooks.push({hook: "newpost", method: "GET", endpoint: ""});
		reloadWebhookUrls(appDetails);
	});

	$("#sideContentLoading").classList.add("hidden");

	handleViewportChange(mediaQuery);
	mediaQuery.addEventListener("change", handleViewportChange);

	$("#backBtn").addEventListener("click", () => {
		$("#backBtn").classList.add("hidden");
		$("#sideContent").classList.add("hidden");
		$("#sidebarTabs").classList.remove("hidden");
		selectedTab = "";
		$(".sidebarItems li").forEach(item => {
			item.classList.remove("active");
		});
	});

	$("#saveapp").addEventListener("click", async () => {
		$("#saveapp").setAttribute("disabled", "true");
		$("#saveapp").textContent = "";
		$("#saveapp").classList.add("loading", "small");
		await fetch(`${api.host}/v4/developer/updateapp.sjs?client_id=${encodeURIComponent(client_id)}`, {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name: appDetails.name,
				description: appDetails.description,
				icon: appDetails.icon,
				callbackURLs: appDetails.callbackurls,
				webhooks: appDetails.webhooks,
				session: api.session
			})
		});
		$("#saveapp").removeAttribute("disabled");
		$("#saveapp").textContent = "Save";
		$("#saveapp").classList.remove("loading", "small");
	});

	$("#deleteapp").addEventListener("click", async (e) => {
		$("#deleteconfirm").showModal();
	});

	$("#canceldelete").addEventListener("click", (e) => {
		e.preventDefault();
		$("#deleteconfirm").close();
		$("#confirmdeleteinput").value = "";
	});

	$("#confirmdeleteinput").addEventListener("input", (e) => {
		if (e.target.value === appDetails.name) {
			$("#confirmdelete").removeAttribute("disabled");
		} else {
			$("#confirmdelete").setAttribute("disabled", "true");
		}
	});

	$("#confirmdelete").addEventListener("click", async (e) => {
		e.preventDefault();
		$("#confirmdelete").setAttribute("disabled", "true");
		$("#confirmdelete").textContent = "";
		$("#confirmdelete").classList.add("loading", "small");
		await fetch(`${api.host}/v4/developer/deleteapp.sjs?client_id=${encodeURIComponent(client_id)}`, {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: api.session
			})
		});
		window.location.href = `/developer/`;
	});

	setLoggedinState(api.loggedIn);
});

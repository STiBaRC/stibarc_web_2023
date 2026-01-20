function loggedOutOnClick() {
	$("stibarc-login-modal")[0].show();
}

async function loggedInOnClick(clientId, redirectUri, scopes, state) {
	const response = await fetch(`${api.host}/v4/developer/oauth2/authorize.sjs`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			client_id: clientId,
			redirect_uri: redirectUri,
			permissions: scopes,
			session: api.session
		})
	});
	const data = await response.json();
	if (response.status !== 200) {
		// Handle error
		const params = new URLSearchParams();
		params.set("error", "invalid_request");
		params.set("error_description", data.error);
		params.set("state", state);
		window.location.href = `${redirectUri}#${params.toString()}`;
	}

	const params = new URLSearchParams();
	params.set("access_token", data.session);
	params.set("token_type", "stibarc_session"); // Change to "Bearer" once we support Bearer tokens
	params.set("state", state);
	window.location.href = `${redirectUri}#${params.toString()}`;
}

window.addEventListener("load", async function () {
	await waitForGlobalInit();

	$("#authorize-button").disabled = true;

	const searchParams = new URLSearchParams(window.location.search);
	const responseType = searchParams.get("response_type");
	const clientId = searchParams.get("client_id");
	let redirectUri = searchParams.get("redirect_uri");
	const state = searchParams.get("state");
	let scopes = (searchParams.get("scope") ?? "").split(" ");

	if (scopes.includes("all")) scopes = ["post", "comment", "vote", "editprofile", "viewprivate", "readcontent"];
	if (scopes.includes("authorize")) scopes = ["authorize"];

	const validScopes = {
		readcontent: "Read posts, clips, and comments on your behalf, including private ones",
		post: "Make posts/clips on your behalf",
		comment: "Make comments on your behalf",
		vote: "Vote on posts, clips, and comments",
		editprofile: "Edit your profile",
		viewprivate: "View your hidden profile fields",
		authorize: "Just know who you are"
	};

	const fragment = document.createDocumentFragment();
	for (const scope of scopes) {
		const scopeDetails = validScopes[scope];
		if (scopeDetails === undefined) {
			// Invalid scope
			const params = new URLSearchParams();
			params.set("error", "invalid_scope");
			params.set("error_description", `Invalid scope: ${scope}`);
			params.set("state", state);
			window.location.href = `${redirectUri}#${params.toString()}`;
			return;
		}
		const scopeElement = document.createElement("li");
		scopeElement.textContent = scopeDetails;
		fragment.appendChild(scopeElement);
	}
	$("#scope-list").appendChild(fragment);

	listatehooks.push((listate) => {
		if (!listate) {
			$("stibarc-login-modal")[0].show();
			$("#authorize-button").addEventListener("click", loggedOutOnClick);
		} else {
			try {
				$("#authorize-button").removeEventListener("click", loggedOutOnClick);
			} catch(e) {}
			$("#authorize-button").addEventListener("click", () => {
				loggedInOnClick(clientId, redirectUri, scopes, state);
			});
		}
	});

	const appDetailsReq = await fetch(`${api.host}/v4/developer/getpublicappdetails.sjs?client_id=${clientId}`);

	if (appDetailsReq.status === 404) {
		// App not found
		$("#authorize-button").disabled = true;
		$("#cid-go-back").onclick = function () {
			window.history.back();
		}
		$("#invalid-client-id").showModal();
		return;
	}

	const appDetails = await appDetailsReq.json();

	if (redirectUri === null) {
		// No redirect URI provided, use the first one from the list
		redirectUri = appDetails.application.callbackurls[0];
	}

	$("#app-icon").src = appDetails.application.icon;
	$("#app-name").textContent = appDetails.application.name;
	$("#app-description").textContent = appDetails.application.description;

	if (appDetails.application.verified || appDetails.application.firstparty) {
		$("#app-verified").classList.remove("hidden");
		if (appDetails.application.firstparty) {
			$("#app-verified").title = "First Party Application";
		} else {
			$("#app-verified").title = "Verified Application";
		}
	}

	// Check redirect URI against the list of allowed redirect URIs
	let validRedirectUri = false;
	for (const uri of appDetails.application.callbackurls) {
		if (uri === redirectUri) {
			validRedirectUri = true;
			break;
		}
	}
	if (!validRedirectUri) {
		// Redirect URI is not valid
		$("#authorize-button").disabled = true;
		$("#uri-go-back").onclick = function () {
			window.history.back();
		}
		$("#invalid-redirect-uri").showModal();
		return;
	}

	if (responseType !== "token") {
		// We only support implicit flow
		const params = new URLSearchParams();
		params.set("error", "invalid_request");
		params.set("error_description", "Unsupported response type");
		params.set("state", state);
		window.location.href = `${redirectUri}#${params.toString()}`;
	}

	$("#cancel-button").onclick = function () {
		// Reject the authorization request
		const params = new URLSearchParams();
		params.set("error", "access_denied");
		params.set("error_description", "User denied access");
		params.set("state", state);
		window.location.href = `${redirectUri}#${params.toString()}`;
	}

	if (this.sessionStorage.loadedBefore === "true" || !api.loggedIn) {
		setLoggedinState(api.loggedIn);
	}

	$("#authorize-button").disabled = false;
});
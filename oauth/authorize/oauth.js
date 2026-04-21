// Save this to restore the session
let originalUsername = null;

function loggedOutOnClick() {
	$("stibarc-login-modal")[0].show();
}

function buildRedirectUri(redirectUri, hashParams, queryParams) {
	const redirect = new URL(redirectUri);
	const redirectHashParams = new URLSearchParams();
	for (const [key, value] of Object.entries(hashParams)) {
		redirectHashParams.set(key, value);
	}
	redirect.hash = redirectHashParams.toString();
	for (const [key, value] of Object.entries(queryParams)) {
		redirect.searchParams.set(key, value);
	}
	return redirect.toString();
}

async function loggedInOnClick(clientId, responseTypes, redirectUri, scopes, state) {
	let implicitGrant = false;
	if (responseTypes.includes("token")) implicitGrant = true;

	const response = await fetch(`${api.host}/v4/developer/oauth2/authorize.sjs`, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${api.session}`,
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: new URLSearchParams({
			response_type: responseTypes.join(" "),
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: scopes.join(" ")
		}).toString()
	});
	const data = await response.json();
	if (response.status !== 200) {
		// Handle error
		const params = {
			error: "invalid_request",
			error_description: data.error,
			state: state
		};
		let hashParams = {};
		let queryParams = params;
		if (implicitGrant) {
			hashParams = params;
			queryParams = {};
		}
		window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
	}

	const params = {
		state: state
	};
	if (data.access_token) params.access_token = data.access_token;
	if (data.token_type) params.token_type = data.token_type;
	if (data.id_token) params.id_token = data.id_token;
	if (data.code) params.code = data.code;
	let hashParams = {};
	let queryParams = params;
	if (implicitGrant) {
		hashParams = params;
		queryParams = {};
	}

	// Restore the original session before redirecting
	await api.switchUser(originalUsername);

	window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
}

window.addEventListener("load", async function () {
	await waitForGlobalInit();

	originalUsername = api.username;

	$("#authorize-button").disabled = true;

	const searchParams = new URLSearchParams(window.location.search);
	const responseTypes = (searchParams.get("response_type") ?? "").split(" ");
	const clientId = searchParams.get("client_id");
	let redirectUri = searchParams.get("redirect_uri");
	const state = searchParams.get("state");
	let scopes = (searchParams.get("scope") ?? "").split(" ");
	let implicitGrant = false;
	if (responseTypes.includes("token")) implicitGrant = true;

	if (scopes.includes("all")) scopes = ["post", "comment", "vote", "editprofile", "viewprivate", "readcontent"];
	if (scopes.includes("authorize")) scopes = ["authorize"];

	const validScopes = {
		readcontent: "Read posts, clips, and comments on your behalf, including private ones",
		post: "Make posts/clips on your behalf",
		comment: "Make comments on your behalf",
		vote: "Vote on posts, clips, and comments",
		editprofile: "Edit your profile",
		viewprivate: "View your hidden profile fields",
		authorize: "Just know who you are",
		openid: "Authenticate with STiBaRC",
		profile: "Access your basic profile information (username, icon, etc.)",
		email: "Access your email address"
	};

	let currentListener = null;
	listatehooks.push((listate) => {
		if (!listate) {
			$("stibarc-login-modal")[0].show();
			try {
				$("#authorize-button").removeEventListener("click", currentListener);
			} catch(e) {}
			currentListener = loggedOutOnClick;
			$("#authorize-button").addEventListener("click", currentListener);
			$("#user-info").classList.add("hidden");
		} else {
			try {
				$("#authorize-button").removeEventListener("click", currentListener);
			} catch(e) {}
			currentListener = async () => {
				await loggedInOnClick(clientId, responseTypes, redirectUri, scopes, state);
			};
			$("#authorize-button").addEventListener("click", currentListener);
			$("#pfp").src = api.pfp;
			$("#user-name").textContent = api.username ?? "Loading...";
			$("#user-info").classList.remove("hidden");
		}
	});

	$("#switch-account-link").addEventListener("click", () => {
		$("stibarc-switchaccount-modal")[0].show();
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

	const fragment = document.createDocumentFragment();
	for (const scope of scopes) {
		const scopeDetails = validScopes[scope];
		if (scopeDetails === undefined) {
			// Invalid scope
			const params = {
				error: "invalid_scope",
				error_description: `Invalid scope: ${scope}`,
				state: state
			};
			let hashParams = {};
			let queryParams = params;
			if (implicitGrant) {
				hashParams = params;
				queryParams = {};
			}
			window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
			return;
		}
		const scopeElement = document.createElement("li");
		scopeElement.textContent = scopeDetails;
		fragment.appendChild(scopeElement);
	}
	$("#scope-list").appendChild(fragment);

	// Check response_type
	if (searchParams.get("response_type") === null) {
		const params = {
			error: "invalid_request",
			error_description: "Missing response_type",
			state: state
		};
		let hashParams = params;
		let queryParams = params;
		window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
	}

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

	for (const responseType of responseTypes) {
		if (responseType !== "token" && responseType !== "code" && responseType !== "id_token") {
			// Unsupported response type
			const params = {
				error: "invalid_request",
				error_description: `Unsupported response type: ${responseType}`,
				state: state
			};
			let hashParams = params;
			let queryParams = params;
			window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
			return;
		}
	}

	// Enforce token response for public clients, and code response for confidential clients
	if (appDetails.application.applicationtype === "public" && (!(responseTypes.includes("token") || responseTypes.includes("id_token")) || responseTypes.includes("code"))) {
		const params = {
			error: "invalid_request",
			error_description: "Public clients must use token response type",
			state: state
		};
		let hashParams = params;
		let queryParams = {};
		window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
	}
	if (appDetails.application.applicationtype === "confidential" && (!responseTypes.includes("code") || responseTypes.includes("token") || responseTypes.includes("id_token"))) {
		const params = {
			error: "invalid_request",
			error_description: "Confidential clients must use code response type",
			state: state
		};
		let hashParams = {};
		let queryParams = params;
		window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
	}

	$("#cancel-button").onclick = async function () {
		// Reject the authorization request
		const params = {
			error: "access_denied",
			error_description: "User denied access",
			state: state
		};
		let hashParams = {};
		let queryParams = params;
		if (implicitGrant) {
			hashParams = params;
			queryParams = {};
		}

		// Restore the original session before redirecting
		await api.switchUser(originalUsername);

		window.location.href = buildRedirectUri(redirectUri, hashParams, queryParams);
	}

	if (this.sessionStorage.loadedBefore === "true" || !api.loggedIn) {
		setLoggedinState(api.loggedIn);
	}

	$("#authorize-button").disabled = false;

	if (appDetails.application.autoauthorize && api.loggedIn) {
		$("#authorize-button").click();
	}
});

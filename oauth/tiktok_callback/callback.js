function handleError(error) {
	console.error("Error during OAuth callback:", error);
	const errorMessage = $("#error-message");
	errorMessage.textContent = `Error: ${error.message}`;
	$("#error-dialog").showModal();
}

window.addEventListener("load", async () => {
	$("#error-go-back").addEventListener("click", () => {
		location.href = "/settings.html#account-linking";
	});

	await waitForGlobalInit();
	const params = new URLSearchParams(window.location.search);

	// Check for errors in the URL parameters
	if (params.get("error")) {
		const errorDescription = params.get("error_description") || "An unknown error occurred";
		handleError(new Error(errorDescription));
		return;
	}

	// Know what service we're working with (it's always TikTok)
	const serviceName = "tiktok";
	const service = api.authCreds[serviceName];
	if (!service) {
		handleError(new Error(`Unknown provider: ${serviceName}`));
		return;
	}

	// Give the necessary information to the API to complete the authentication process
	// Get the authorization code and state from the URL
	const code = params.get("code");
	const state = params.get("state");

	if (!code) {
		handleError(new Error("Missing authorization code"));
		return;
	}

	// Verify state
	const expectedState = sessionStorage.getItem("oauth_state");
	if (state !== expectedState) {
		handleError(new Error("Invalid state parameter"));
		return;
	}
	sessionStorage.removeItem("oauth_state");

	const linkRequest = await fetch(`${api.host}/v4/accountlinking/linkaccount.sjs`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: api.session,
			serviceName,
			code,
			redirectUri: `${location.origin}${service.redirectUrl}`,
			codeVerifier: sessionStorage.getItem("code_verifier") // For PKCE
		})
	});
	if (!linkRequest.ok) {
		const { error } = await linkRequest.json();
		handleError(new Error(`Failed to link account: ${error}`));
		return;
	}
	sessionStorage.removeItem("code_verifier");

	// Success
	location.href = "/settings.html#account-linking";
});
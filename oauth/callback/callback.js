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

	// Know what service we're working with
	const serviceName = params.get("provider");
	if (!serviceName) {
		handleError(new Error("No provider specified"));
		return;
	}
	const service = api.authCreds[serviceName];
	if (!service) {
		handleError(new Error(`Unknown provider: ${serviceName}`));
		return;
	}

	// Give the necessary information to the API to complete the authentication process
	switch (service.protocol) {
		case "oauth1": {
			// Get the oauth token and verifier from the URL
			const oauthToken = params.get("oauth_token");
			const oauthVerifier = params.get("oauth_verifier");
			if (!oauthToken || !oauthVerifier) {
				handleError(new Error("Missing OAuth token or verifier"));
				return;
			}
			const linkRequest = await fetch(`${api.host}/v4/accountlinking/linkaccount.sjs`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: api.session,
					serviceName,
					oauthToken,
					oauthVerifier,
					redirectUri: `${location.origin}${service.redirectUrl}`
				})
			});
			if (!linkRequest.ok) {
				try {
					const { error } = await linkRequest.json();
					handleError(new Error(`Failed to link account: ${error}`));
					return;
				} catch {
					handleError(new Error("Failed to link account"));
					return;
				}
			}
			break;
		}
		case "oauth2": {
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
					codeVerifier: service.pkceSupported ? sessionStorage.getItem("code_verifier") : undefined // For PKCE
				})
			});
			if (!linkRequest.ok) {
				const { error } = await linkRequest.json();
				handleError(new Error(`Failed to link account: ${error}`));
				return;
			}
			if (service.pkceSupported) sessionStorage.removeItem("code_verifier");
			break;
		}
		case "oauth2_mastodon": {
			// Get the authorization code, state, and instance from the URL
			const code = params.get("code");
			const state = params.get("state");
			const instance = params.get("instance");

			if (!code) {
				handleError(new Error("Missing authorization code"));
				return;
			}
			
			if (!instance) {
				handleError(new Error("Missing Mastodon instance"));
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
					serviceName: instance, // Use the instance as the service name for Mastodon
					code,
					redirectUri: `${location.origin}/oauth/callback?provider=mastodon&instance=${instance}`,
					codeVerifier: service.pkceSupported ? sessionStorage.getItem("code_verifier") : undefined, // For PKCE
				})
			});
			if (!linkRequest.ok) {
				const { error } = await linkRequest.json();
				handleError(new Error(`Failed to link account: ${error}`));
				return;
			}
			if (service.pkceSupported) sessionStorage.removeItem("code_verifier");
			break;
		}
		case "oauth2_bsky": {
			// Get the authorization code and state from the URL
			const code = params.get("code");
			const state = params.get("state");
			const iss = params.get("iss");

			if (!code) {
				handleError(new Error("Missing authorization code"));
				return;
			}

			if (!state) {
				handleError(new Error("Missing state parameter"));
				return;
			}

			if (!iss) {
				handleError(new Error("Missing issuer parameter"));
				return;
			}

			// Recall Bluesky handle
			const handle = sessionStorage.getItem("bluesky_username");
			if (!handle) {
				handleError(new Error("Missing Bluesky handle in session storage"));
				return;
			}
			sessionStorage.removeItem("bluesky_username");

			// Recall DPoP nonce
			const dpopNonce = sessionStorage.getItem("dpop_nonce");
			if (!dpopNonce) {
				handleError(new Error("Missing DPoP nonce in session storage"));
				return;
			}
			sessionStorage.removeItem("dpop_nonce");

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
					serviceName: serviceName,
					code,
					redirectUri: `${location.origin}${service.redirectUrl}`,
					codeVerifier: service.pkceSupported ? sessionStorage.getItem("code_verifier") : undefined, // For PKCE
					handle,
					dpopNonce
				})
			});
			if (!linkRequest.ok) {
				const { error } = await linkRequest.json();
				handleError(new Error(`Failed to link account: ${error}`));
				return;
			}
			if (service.pkceSupported) sessionStorage.removeItem("code_verifier");
			break;
		}
		default:
			handleError(new Error(`Unsupported protocol: ${service.protocol}`));
			return;
	}

	// Success
	location.href = "/settings.html#account-linking";
});
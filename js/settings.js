let selectedTab = location.hash.slice(1) || "display";
let loggedIn;
let isMobile;
let tfaEnabled = false;

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

window.addEventListener("load", () => {
	updateThemeSelector();
	$("#changeThemeSelector").addEventListener("change", (e) => {
		localStorage.setItem("theme", e.target.value || "lightTheme");
		updateThemeSelector();
		refreshTheme();
	});
});

function updateAccountLinking() {
	// Get current linked services
	api.getLinkedAccounts(api.username, true).then(linkedAccounts => {
		$("#linkedServices").innerHTML = "";
		$("#linkedServicesMobile").innerHTML = "";
		const fragment = document.createDocumentFragment();
		const mobileFragment = document.createDocumentFragment();
		for (const linkedAccount of linkedAccounts) {
			const container = document.createElement("tr");
			container.id = `linkedAccount-${linkedAccount.id}`;

			const serviceName = document.createElement("td");
			let serviceNameText = api.authCreds[linkedAccount.servicename]?.name;
			if (linkedAccount.protocol === "oauth2_mastodon") {
				serviceNameText = linkedAccount.servicename; // For Mastodon, the servicename is the instance URL, so show that instead of looking up a name
			}
			serviceName.textContent = serviceNameText;

			const accountName = document.createElement("td");
			accountName.textContent = linkedAccount.externalusername;

			if (linkedAccount.externaluserlink !== null) {
				const link = document.createElement("a");
				link.href = linkedAccount.externaluserlink;
				link.textContent = linkedAccount.externalusername;
				link.target = "_blank";
				accountName.textContent = "";
				accountName.appendChild(link);
			}

			const actions = document.createElement("td");

			const showHideButton = document.createElement("button");
			showHideButton.classList.add("button");
			showHideButton.textContent = linkedAccount.displayonprofile ? "Hide" : "Show";
			showHideButton.addEventListener("click", async () => {
				showHideButton.disabled = true;
				showHideButton.classList.add("loading");
				const response = await fetch(`${api.host}/v4/accountlinking/setdisplayonprofile.sjs`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						session: api.session,
						accountLinkingId: linkedAccount.id,
						displayOnProfile: !linkedAccount.displayonprofile
					})
				});
				if (!response.ok) {
					const error = await response.json();
					alert(`Error updating linked account: ${error.message}`);
					showHideButton.disabled = false;
					showHideButton.classList.remove("loading");
					return;
				}
				linkedAccount.displayonprofile = !linkedAccount.displayonprofile;
				showHideButton.textContent = linkedAccount.displayonprofile ? "Hide" : "Show";
				showHideButton.disabled = false;
				showHideButton.classList.remove("loading");
			});

			const unlinkButton = document.createElement("button");
			unlinkButton.classList.add("button");
			unlinkButton.textContent = "Unlink";
			unlinkButton.addEventListener("click", async () => {
				if (!confirm(`Are you sure you want to unlink your ${serviceNameText} account?`)) {
					return;
				}
				unlinkButton.disabled = true;
				unlinkButton.classList.add("loading");
				const response = await fetch(`${api.host}/v4/accountlinking/unlinkaccount.sjs`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						session: api.session,
						accountLinkingId: linkedAccount.id
					})
				});
				if (!response.ok) {
					const error = await response.json();
					alert(`Error unlinking account: ${error.message}`);
					unlinkButton.disabled = false;
					unlinkButton.classList.remove("loading");
					return;
				}
				$(`#linkedAccountMobile-${linkedAccount.id}`)?.remove(); // Remove the mobile version of the block if it exists
				container.remove();
			});

			actions.appendChild(showHideButton);
			actions.appendChild(unlinkButton);

			container.appendChild(serviceName);
			container.appendChild(accountName);
			container.appendChild(actions);

			fragment.appendChild(container);

			const linkingBlock = new AccountLinkingBlockComponent(linkedAccount);
			mobileFragment.appendChild(linkingBlock);
		}
		$("#linkedServices").appendChild(fragment);
		$("#linkedServicesMobile").appendChild(mobileFragment);
	});
}

async function updateInfo() {
	$("#sideContent").classList.add("hidden");
	$("#sideContentLoading").classList.remove("hidden");
	const user = await api.getPrivateData();
	/* FTA */
	$(".sideContent").forEach((item) => {
		item.classList.remove("hidden");
	});
	$("#sideContent").classList.remove("hidden");
	$("#sideContentLoading").classList.add("hidden");
	$("#tfabutton").textContent = user.totpEnabled ? "Disable 2FA" : "Enable 2FA";
	tfaEnabled = user.totpEnabled;
	/* Sessions */
	const sessions = user.sessions;
	displaySessions(sessions);

	/* Account linking */
	updateAccountLinking();
}

function displaySessions(sessions) {
	const sessionBlocks = document.createDocumentFragment();
	for (const session of sessions) {
		sessionBlocks.appendChild(new SessionBlockComponent(session));
	}
	$("#sessions").appendChild(sessionBlocks);
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

window.addEventListener("load", async () => {
	await waitForGlobalInit();

	listatehooks.push((state) => {
		if (state) {
			if (isMobile && !location.hash) {
				$("#sideContent").classList.remove("hidden");
				$("#sideContentLoading").classList.add("hidden");
			}
			$("#tab-security").classList.remove("hidden");
			$("#tab-sessions").classList.remove("hidden");
			$("#tab-account-linking").classList.remove("hidden");
			$("#tab-experiments").classList.remove("hidden");
			updateInfo();
		} else {
			switchTab($("#tab-display"));
			$("#sideContent").classList.remove("hidden");
			$("#sideContentLoading").classList.add("hidden");
			$("#tab-security").classList.add("hidden");
			$("#tab-sessions").classList.add("hidden");
			$("#tab-account-linking").classList.add("hidden");
			$("#tab-experiments").classList.add("hidden");
		}
	});

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

	$("#changepasswordbutton").addEventListener("click", () => {
		if (!api.loggedIn) {
			document.querySelector("stibarc-login-modal").show();
			return;
		}
		window.scrollTo(0, 0);
		$("#changepasswordformcontainer").classList.remove("hidden");
		$("#overlay").classList.remove("hidden");
		document.body.classList.add("overflowhidden");
	});

	$("#changepasswordcancel").addEventListener("click", () => {
		$("#changepasswordformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#oldpasswordinput").value = "";
		$("#newpasswordinput").value = "";
		$("#newpasswordinput2").value = "";
		$("#logoutothers").checked = false;
		$("#changepassworderror").textContent = "";
		$("#changepassworderrorcontainer").classList.add("hidden");
	});

	$("#changepasswordsubmitbutton").addEventListener("click", async () => {
		if ($("#newpasswordinput").value != $("#newpasswordinput2").value) {
			$("#changepassworderror").textContent = "Passwords do not match";
			$("#changepassworderrorcontainer").classList.remove("hidden");
			return;
		}
		try {
			await api.updatePassword($("#oldpasswordinput").value, $("#newpasswordinput").value, $("#logoutothers").checked);
			$("#changepasswordformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#oldpasswordinput").value = "";
			$("#newpasswordinput").value = "";
			$("#newpasswordinput2").value = "";
			$("#logoutothers").checked = false;
			$("#changepassworderror").textContent = "";
			$("#changepassworderrorcontainer").classList.add("hidden");
		} catch (e) {
			$("#changepassworderror").textContent = e.message;
			$("#changepassworderrorcontainer").classList.remove("hidden");
		}
	});

	$("#tfabutton").addEventListener("click", async () => {
		if (!api.loggedIn) {
			document.querySelector("stibarc-login-modal").show();
			return;
		}
		window.scrollTo(0, 0);
		$("#overlay").classList.remove("hidden");
		$("#pleaseWait").classList.remove("hidden");
		document.body.classList.add("overflowhidden");
		if (tfaEnabled) {
			$("#disabletfaformcontainer").classList.remove("hidden");
		} else {
			window.scrollTo(0, 0);
			$("#enabletfaformcontainer").classList.remove("hidden");

			const totpCode = await api.manage2FA("generatetotp");

			await navigator.clipboard.writeText(totpCode);
			$("#tfakey").textContent = totpCode;
			const totpString = `otpauth://totp/${encodeURIComponent(
				api.username
			)}?secret=${encodeURIComponent(totpCode)}&issuer=STiBaRC`;
			$("#enabletfaqr").setAttribute(
				"src",
				`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
					totpString
				)}`
			);
			$("#pleaseWait").classList.add("hidden");
		}
	});

	$("#enabletfasubmitbutton").addEventListener("click", async () => {
		if ($("#enabletfainput").value == "") return;
		try {
			await api.manage2FA("enabletotp", $("#enabletfainput").value);
			$("#enabletfaformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#enabletfaerror").textContent = "";
			$("#enabletfaerrorcontainer").classList.add("hidden");
			$("#enabletfaqr").setAttribute("src", "");
			$("#tfakey").textContent = "";
			$("#enabletfainput").value = "";
			$("#tfabutton").textContent = "Disable 2FA";
			tfaEnabled = true;
		} catch(e) {
			$("#enabletfaerror").textContent = e.message;
			$("#enabletfaerrorcontainer").classList.remove("hidden");
		}
	});

	$("#enabletfacancel").addEventListener("click", () => {
		$("#enabletfaformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#enabletfaerror").textContent = "";
		$("#enabletfaerrorcontainer").classList.add("hidden");
		$("#enabletfaqr").setAttribute("src", "");
		$("#tfakey").textContent = "";
		$("#tfacode").value = "";
	});

	$("#disabletfasubmitbutton").addEventListener("click", async () => {
		if ($("#disabletfainput").value == "") return;
		try {
			await api.manage2FA("disabletotp", $("#disabletfainput").value);
			$("#disabletfaformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#disabletfaerror").textContent = "";
			$("#disabletfaerrorcontainer").classList.add("hidden");
			$("#disabletfainput").value = "";
			$("#tfabutton").textContent = "Enable 2FA";
			tfaEnabled = false;
		} catch(e) {
			$("#disabletfaerror").textContent = e.message;
			$("#disabletfaerrorcontainer").classList.remove("hidden");
		}
	});

	$("#disabletfacancel").addEventListener("click", () => {
		$("#disabletfaformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#disabletfaerror").textContent = "";
		$("#disabletfaerrorcontainer").classList.add("hidden");
		$("#disabletfainput").value = "";
	});

	$("#mastodoninstancecancel").addEventListener("click", () => {
		$("#mastodoninstanceformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#mastodoninstancesubmitbutton").disabled = true;
		$("#mastodoninstance").value = "";
	});

	$("#mastodoninstance").addEventListener("input", (e) => {
		// Validate that this is a valid hostname
		const instanceHostname = e.target.value?.trim();
		$("#mastodoninstancesubmitbutton").disabled = !(instanceHostname && instanceHostname !== "" && instanceHostname.match(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/));
	});

	$("#mastodoninstancesubmitbutton").addEventListener("click", async () => {
		if ($("#mastodoninstancesubmitbutton").disabled) return;
		$("#mastodoninstancesubmitbutton").disabled = true;
		// We have to tell the API to register a client or re-use one
		let instanceHostname = $("#mastodoninstance").value.trim();
		if (instanceHostname.startsWith("http://") || instanceHostname.startsWith("https://")) {
			instanceHostname = new URL(instanceHostname).hostname;
		}
		const credentialsRequest = await fetch(`${api.host}/v4/accountlinking/mastodondetails.sjs`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: api.session,
				instance: instanceHostname
			})
		});
		if (!credentialsRequest.ok) {
			$("#mastodoninstancesubmitbutton").disabled = false;
			const error = await credentialsRequest.json();
			alert(`Error connecting to Mastodon instance: ${error.error}`);
			return;
		}
		const { clientId, scope } = await credentialsRequest.json();

		// State
		const oauthState = Math.random().toString(36).substring(2);
		sessionStorage.setItem("oauth_state", oauthState);

		// Generate PKCE code verifier and challenge
		let codeVerifier = new Uint8Array(32);
		window.crypto.getRandomValues(codeVerifier);
		codeVerifier = btoa(String.fromCharCode(...codeVerifier)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
		const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
		const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
		const codeChallengeMethod = "S256";
		sessionStorage.setItem("code_verifier", codeVerifier);

		// Now we can redirect to the authorization URL
		const params = new URLSearchParams({
			client_id: clientId,
			response_type: "code",
			scope: scope,
			state: oauthState,
			redirect_uri: `${location.origin}/oauth/callback?provider=mastodon&instance=${instanceHostname}`,
			code_challenge: codeChallenge,
			code_challenge_method: codeChallengeMethod
		});
		location.href = `https://${instanceHostname}/oauth/authorize?${params.toString()}`;
	});

	$("#blueskycancel").addEventListener("click", () => {
		$("#blueskyformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#blueskysubmitbutton").disabled = true;
		$("#blueskyusername").value = "";
	});

	$("#blueskyusername").addEventListener("input", (e) => {
		// Validate that this is a valid hostname
		const blueskyUsername = e.target.value?.trim();
		$("#blueskysubmitbutton").disabled = !(blueskyUsername && blueskyUsername !== "" && blueskyUsername.match(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/));
	});

	$("#blueskysubmitbutton").addEventListener("click", async () => {
		if ($("#blueskysubmitbutton").disabled) return;
		$("#blueskysubmitbutton").disabled = true;
		// We have to have the API look up the personal data server for the user and redirect
		const blueskyUsername = $("#blueskyusername").value.trim();
		sessionStorage.setItem("bluesky_username", blueskyUsername);
		const detailsLookup = await fetch(`${api.host}/v4/accountlinking/blueskydetails.sjs`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: api.session,
				handle: blueskyUsername
			})
		});
		if (!detailsLookup.ok) {
			$("#blueskysubmitbutton").disabled = false;
			const error = await detailsLookup.json();
			alert(`Error looking up Bluesky details: ${error.error}`);
			return;
		}
		const { authorizationEndpoint, pushedAuthorizationRequestEndpoint, clientAssertionType, parJwt } = await detailsLookup.json();
		// State
		const oauthState = Math.random().toString(36).substring(2);
		sessionStorage.setItem("oauth_state", oauthState);

		// Generate PKCE code verifier and challenge
		let codeVerifier = new Uint8Array(32);
		window.crypto.getRandomValues(codeVerifier);
		codeVerifier = btoa(String.fromCharCode(...codeVerifier)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
		const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
		const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
		const codeChallengeMethod = "S256";
		sessionStorage.setItem("code_verifier", codeVerifier);

		// Create params
		const params = new URLSearchParams({
			client_id: api.authCreds.bluesky.clientId,
			response_type: "code",
			scope: api.authCreds.bluesky.scope,
			state: oauthState,
			redirect_uri: `${location.origin}/oauth/callback?provider=bluesky`,
			code_challenge: codeChallenge,
			code_challenge_method: codeChallengeMethod,
			client_assertion_type: clientAssertionType,
			client_assertion: parJwt,
			login_hint: blueskyUsername
		});

		// Send pushed authorization request
		const parResponse = await fetch(pushedAuthorizationRequestEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: params.toString()
		});
		if (!parResponse.ok) {
			$("#blueskysubmitbutton").disabled = false;
			const error = await parResponse.json();
			alert(`Error sending pushed authorization request: ${error.error}`);
			return;
		}
		const { request_uri } = await parResponse.json();
		// Get the dpop-nonce header from the response and save it for later
		const dpopNonce = parResponse.headers.get("dpop-nonce");
		sessionStorage.setItem("dpop_nonce", dpopNonce);

		// Now we can redirect to the authorization URL with the request_uri
		const authParams = new URLSearchParams({
			request_uri,
			client_id: api.authCreds.bluesky.clientId,
			login_hint: blueskyUsername,
		});
		location.href = `${authorizationEndpoint}?${authParams.toString()}`;
	});

	// Populate services to connect
	for (const serviceId in api.authCreds) {
		const service = api.authCreds[serviceId];

		// Create name and button for service
		const container = document.createElement("div");

		const name = document.createElement("span");
		name.textContent = service.name;

		const connectButton = document.createElement("button");
		connectButton.classList.add("button");
		connectButton.textContent = "Connect";
		connectButton.addEventListener("click", async () => {
			switch(service.protocol) {
				case "oauth1": {
					// We have to tell the server to request an OAuth token first.
					const oauth1TokenRequest = await fetch(`${api.host}/v4/accountlinking/oauth1request.sjs`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({
							session: api.session,
							serviceName: serviceId,
							callbackUrl: `${location.origin}${service.redirectUrl}`
						})
					});
					if (!oauth1TokenRequest.ok) {
						const error = await oauth1TokenRequest.json();
						alert(`Error connecting to ${service.name}: ${error.message}`);
						return;
					}
					const { oauthToken } = await oauth1TokenRequest.json();
					// Now we can redirect to the authorization URL
					const params = new URLSearchParams({
						oauth_token: oauthToken
					});
					location.href = `${service.authorize}?${params.toString()}`;
					break;
				}
				case "oauth2": {
					const oauthState = Math.random().toString(36).substring(2);
					sessionStorage.setItem("oauth_state", oauthState);
					let codeChallenge = undefined;
					let codeChallengeMethod = undefined;
					if (service.pkceSupported) {
						// Generate PKCE code verifier and challenge
						let codeVerifier = new Uint8Array(32);
						window.crypto.getRandomValues(codeVerifier);
						codeVerifier = btoa(String.fromCharCode(...codeVerifier)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
						const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
						codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
						codeChallengeMethod = "S256";
						sessionStorage.setItem("code_verifier", codeVerifier);
					}
					const params = new URLSearchParams({
						client_id: service.clientId,
						response_type: "code",
						scope: service.scope,
						state: oauthState,
						redirect_uri: `${location.origin}${service.redirectUrl}`,
						code_challenge: codeChallenge,
						code_challenge_method: codeChallengeMethod
					});
					if (service.extraParams) {
						for (const key in service.extraParams) {
							params.set(key, service.extraParams[key]);
						}
					}
					location.href = `${service.authorize}?${params.toString()}`;
					break;
				}
				case "oauth2_mastodon": {
					// Mastodon doesn't have a global OAuth credentials store, so we have to make one for every instance we encounter.
					// But first, we need to know the instance URL.
					window.scrollTo(0, 0);
					document.body.classList.add("overflowhidden");
					$("#overlay").classList.remove("hidden");
					$("#mastodoninstanceformcontainer").classList.remove("hidden");
					break;
				}
				case "oauth2_bsky": {
					// Bluesky is weird and uses a URL as the client ID. We need to point it at ours.
					// But first, we need to know the Bluesky username to look up what PDS to point to.
					window.scrollTo(0, 0);
					document.body.classList.add("overflowhidden");
					$("#overlay").classList.remove("hidden");
					$("#blueskyformcontainer").classList.remove("hidden");
					break;
				}
				default:
					throw new Error(`Invalid service protocol: ${service.protocol}`);
			}
		});

		container.appendChild(name);
		container.appendChild(connectButton);
		$("#newServices").appendChild(container);
	}

	// Populate wall of shame
	for (const serviceName in api.oauthWallOfShame) {
		const reason = api.oauthWallOfShame[serviceName];
		const entry = document.createElement("div");
		const title = document.createElement("h3");
		title.textContent = serviceName;
		const reasonEl = document.createElement("p");
		reasonEl.textContent = reason;
		entry.appendChild(title);
		entry.appendChild(reasonEl);
		$("#oauthwallofshame").appendChild(entry);
	}

	setLoggedinState(api.loggedIn);
});

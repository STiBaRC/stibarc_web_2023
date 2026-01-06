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
			$("#tab-experiments").classList.remove("hidden");
			updateInfo();
		} else {
			// location.href = "/";
			switchTab($("#tab-display"));
			$("#sideContent").classList.remove("hidden");
			$("#sideContentLoading").classList.add("hidden");
			$("#tab-security").classList.add("hidden");
			$("#tab-sessions").classList.add("hidden");
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
	mediaQuery.addListener(handleViewportChange);

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
	setLoggedinState(api.loggedIn);
});

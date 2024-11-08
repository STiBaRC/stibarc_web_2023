let selectedTab = location.hash.slice(1) || "security";
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
	const r = await fetch("https://betaapi.stibarc.com/v4/getprivatedata.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			session: localStorage.sess,
		}),
	});
	const response = (await r.json());
	/* FTA */
	const user = response['user'];
	$(".sideContent").forEach((item) => {
		item.classList.remove("hidden");
	});
	$("#sideContentLoading").classList.add("hidden");
	$("#tfabutton").textContent = user.totpEnabled ? "Disable 2FA" : "Enable 2FA";
	tfaEnabled = user.totpEnabled;
	/* Sessions */
	const sessions = user['sessions'];
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
	listatehooks.push((state) => {
		if (state) {
			if (isMobile && !location.hash) {
				$("#sideContentLoading").classList.add("hidden");
			}
			updateInfo();
		} else {
			location.href = "./";
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
		const r = await fetch("https://betaapi.stibarc.com/v4/updatepassword.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				session: localStorage.sess,
				oldPassword: $("#oldpasswordinput").value,
				newPassword: $("#newpasswordinput").value,
				logoutOthers: $("#logoutothers").checked,
			}),
		});
		const d = await r.json();
		if (d.status == "ok") {
			$("#changepasswordformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#oldpasswordinput").value = "";
			$("#newpasswordinput").value = "";
			$("#newpasswordinput2").value = "";
			$("#logoutothers").checked = false;
			$("#changepassworderror").textContent = "";
			$("#changepassworderrorcontainer").classList.add("hidden");
		} else {
			$("#changepassworderror").textContent = d.error;
			$("#changepassworderrorcontainer").classList.remove("hidden");
		}
	});
	$("#tfabutton").addEventListener("click", async () => {
		window.scrollTo(0, 0);
		$("#overlay").classList.remove("hidden");
		$("#pleaseWait").classList.remove("hidden");
		document.body.classList.add("overflowhidden");
		if (tfaEnabled) {
			$("#disabletfaformcontainer").classList.remove("hidden");
		} else {
			window.scrollTo(0, 0);
			$("#enabletfaformcontainer").classList.remove("hidden");
			const r = await fetch("https://betaapi.stibarc.com/v4/manage2fa.sjs", {
				method: "post",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					session: localStorage.sess,
					state: "generatetotp",
				}),
			});
			const d = await r.json();
			if (d.status == "ok") {
				$("#tfakey").textContent = d.totpCode;
				const totpString = `otpauth://totp/${encodeURIComponent(
					localStorage.username
				)}?secret=${encodeURIComponent(d.totpCode)}&issuer=STiBaRC%20Beta`;
				$("#enabletfaqr").setAttribute(
					"src",
					`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(
						totpString
					)}`
				);
				$("#pleaseWait").classList.add("hidden");
			}
		}
	});
	$("#enabletfasubmitbutton").addEventListener("click", async () => {
		if ($("#enabletfainput").value == "") return;
		const r = await fetch("https://betaapi.stibarc.com/v4/manage2fa.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				session: localStorage.sess,
				state: "enabletotp",
				totpCode: $("#enabletfainput").value,
			}),
		});
		const d = await r.json();
		if (d.status == "ok") {
			$("#enabletfaformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#enabletfaerror").textContent = "";
			$("#enabletfaerrorcontainer").classList.add("hidden");
			$("#enabletfaqr").setAttribute("src", "");
			$("#tfakey").textContent = "";
			$("#tfacode").value = "";
			$("#tfabutton").textContent = "Disable 2FA";
			tfaEnabled = true;
		} else {
			$("#enabletfaerror").textContent = d.error;
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
		const r = await fetch("https://betaapi.stibarc.com/v4/manage2fa.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				session: localStorage.sess,
				state: "disabletotp",
				totpCode: $("#disabletfainput").value,
			}),
		});
		const d = await r.json();
		if (d.status == "ok") {
			$("#disabletfaformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#disabletfaerror").textContent = "";
			$("#disabletfaerrorcontainer").classList.add("hidden");
			$("#disabletfainput").value = "";
			$("#tfabutton").textContent = "Enable 2FA";
			tfaEnabled = false;
		} else {
			$("#disabletfaerror").textContent = d.error;
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
	setLoggedinState(localStorage.sess);
});

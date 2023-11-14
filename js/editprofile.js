let tfaEnabled = false;

async function updateInfo() {
	$("#userusername").innerText = localStorage.username;
	const r = await fetch("https://betaapi.stibarc.com/v4/getprivatedata.sjs", {
		method: "post",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			session: localStorage.sess
		})
	});
	const user = (await r.json()).user;
	$("#userpfp").setAttribute("src", user.pfp);
	$("#userPfpLoader").classList.remove("loading");
	$("#userBannerLoader").classList.add("hidden");
	$("#userBanner").style.backgroundImage = `url("${user.banner}")`;
	$("#nameinput").value = user.name;
	$("#showname").checked = user.displayName;
	$("#pronounsinput").value = user.pronouns;
	$("#showpronouns").checked = user.displayPronouns;
	$("#emailinput").value = user.email;
	$("#showemail").checked = user.displayEmail;
	if (user.birthday) {
		const bday = new Date(user.birthday);
		$("#bdayinput").value = `${bday.getUTCFullYear()}-${(bday.getUTCMonth()+1).toString().padStart(2, "0")}-${bday.getUTCDate()}`;	
	}
	$("#showbday").checked = user.displayBirthday;
	$("#bioinput").value = user.bio;
	$("#showbio").checked = user.displayBio;
	$("#tfabutton").innerText = user.totpEnabled ? "Disable 2FA" : "Enable 2FA";
	tfaEnabled = user.totpEnabled;
}

function uploadBannerImage() {
	const fileInput = document.createElement("input");
	fileInput.setAttribute("type", "file");
	fileInput.setAttribute("accept", "image/*");
	fileInput.addEventListener("change", async function(e) {
		if (fileInput.files.length == 0) return;
		$("#userBannerLoader").classList.remove("hidden");
		const response = await fetch("https://betaapi.stibarc.com/v4/uploadfile.sjs", {
		method: "post",
		headers: {
				"Content-Type": fileInput.files[0].type,
				"X-Session-Key": localStorage.sess,
				"X-File-Usage": "banner"
			},
			body: await fileInput.files[0].arrayBuffer()
		});
		const responseJSON = await response.json();
		$("#userBannerLoader").classList.add("hidden");
		localStorage.banner = responseJSON.file;
		$("#userBanner").style.backgroundImage = `url("${responseJSON.file}")`;
	});
	fileInput.click();
}

window.addEventListener("load", async () => {
	listatehooks.push((state) => {
		if (state) {
			updateInfo();
		} else {
			location.href = "./";
		}
	});
	setLoggedinState(localStorage.sess);
	$("#userpfp").addEventListener("click", () => {
		const fileInput = document.createElement("input");
		fileInput.setAttribute("type", "file");
		fileInput.setAttribute("accept", "image/*");
		fileInput.addEventListener("change", async function(e) {
			if (fileInput.files.length == 0) return;
			$("#userPfpLoader").classList.add("loading");
			const response = await fetch("https://betaapi.stibarc.com/v4/uploadfile.sjs", {
			method: "post",
			headers: {
					"Content-Type": fileInput.files[0].type,
					"X-Session-Key": localStorage.sess,
					"X-File-Usage": "pfp"
				},
				body: await fileInput.files[0].arrayBuffer()
			});
			const responseJSON = await response.json();
			$("#userPfpLoader").classList.remove("loading");
			localStorage.pfp = responseJSON.file;
			$("#userpfp").setAttribute("src", responseJSON.file);
		});
		fileInput.click();
	});
	$("#uploadBanner").addEventListener("click", () => {
		uploadBannerImage();
	});
	$("#removeBanner").addEventListener("click", async () => {
		$("#userBannerLoader").classList.add("loading");
		const response = await fetch("https://betaapi.stibarc.com/v4/editprofile.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				banner: "https://betacdn.stibarc.com/banner/default.png",
			})
		});
		const responseJSON = await response.json();
		$("#userBannerLoader").classList.remove("loading");
		delete localStorage.banner;
		$("#userBanner").setAttribute("src", "");
	});
	$("#editprofilebutton").addEventListener("click", async () => {
		const r = await fetch("https://betaapi.stibarc.com/v4/editprofile.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				name: $("#nameinput").value,
				displayName: $("#showname").checked,
				pronouns: $("#pronounsinput").value,
				displayPronouns: $("#showpronouns").checked,
				email: $("#emailinput").value,
				displayEmail: $("#showemail").checked,
				birthday: $("#bdayinput").value,
				displayBirthday: $("#showbday").checked,
				bio: $("#bioinput").value,
				displayBio: $("#showbio").checked
			})
		});
		location.href = `user.html?username=${localStorage.username}`;
	});
	$("#cancel").addEventListener("click", () => {
		location.href = `user.html?username=${localStorage.username}`;
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
		$("#changepassworderror").innerText = "";
		$("#changepassworderrorcontainer").classList.add("hidden");
	});
	$("#changepasswordsubmitbutton").addEventListener("click", async () => {
		if ($("#newpasswordinput").value != $("#newpasswordinput2").value) {
			$("#changepassworderror").innerText = "Passwords do not match";
			$("#changepassworderrorcontainer").classList.remove("hidden");
			return;
		}
		const r = await fetch("https://betaapi.stibarc.com/v4/updatepassword.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				oldPassword: $("#oldpasswordinput").value,
				newPassword: $("#newpasswordinput").value,
				logoutOthers: $("#logoutothers").checked
			})
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
			$("#changepassworderror").innerText = "";
			$("#changepassworderrorcontainer").classList.add("hidden");
		} else {
			$("#changepassworderror").innerText = d.error;
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
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: localStorage.sess,
					state: "generatetotp"
				})
			});
			const d = await r.json();
			if (d.status == "ok") {
				$("#tfakey").innerText = d.totpCode;
				const totpString = `otpauth://totp/${encodeURIComponent(localStorage.username)}?secret=${encodeURIComponent(d.totpCode)}&issuer=STiBaRC%20Beta`;
				$("#enabletfaqr").setAttribute("src", `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(totpString)}`);
				$("#pleaseWait").classList.add("hidden");
			}
		}
	});
	$("#enabletfasubmitbutton").addEventListener("click", async () => {
		if ($("#enabletfainput").value == "") return;
		const r = await fetch("https://betaapi.stibarc.com/v4/manage2fa.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				state: "enabletotp",
				totpCode: $("#enabletfainput").value
			})
		});
		const d = await r.json();
		if (d.status == "ok") {
			$("#enabletfaformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#enabletfaerror").innerText = "";
			$("#enabletfaerrorcontainer").classList.add("hidden");
			$("#enabletfaqr").setAttribute("src", "");
			$("#tfakey").innerText = "";
			$("#tfacode").value = "";
			$("#tfabutton").innerText = "Disable 2FA";
			tfaEnabled = true;
		} else {
			$("#enabletfaerror").innerText = d.error;
			$("#enabletfaerrorcontainer").classList.remove("hidden");
		}
	});
	$("#enabletfacancel").addEventListener("click", () => {
		$("#enabletfaformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#enabletfaerror").innerText = "";
		$("#enabletfaerrorcontainer").classList.add("hidden");
		$("#enabletfaqr").setAttribute("src", "");
		$("#tfakey").innerText = "";
		$("#tfacode").value = "";
	});
	$("#disabletfasubmitbutton").addEventListener("click", async () => {
		if ($("#disabletfainput").value == "") return;
		const r = await fetch("https://betaapi.stibarc.com/v4/manage2fa.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				state: "disabletotp",
				totpCode: $("#disabletfainput").value
			})
		});
		const d = await r.json();
		if (d.status == "ok") {
			$("#disabletfaformcontainer").classList.add("hidden");
			$("#overlay").classList.add("hidden");
			document.body.classList.remove("overflowhidden");
			$("#disabletfaerror").innerText = "";
			$("#disabletfaerrorcontainer").classList.add("hidden");
			$("#disabletfainput").value = "";
			$("#tfabutton").innerText = "Enable 2FA";
			tfaEnabled = false;
		} else {
			$("#disabletfaerror").innerText = d.error;
			$("#disabletfaerrorcontainer").classList.remove("hidden");
		}
	});
	$("#disabletfacancel").addEventListener("click", () => {
		$("#disabletfaformcontainer").classList.add("hidden");
		$("#overlay").classList.add("hidden");
		document.body.classList.remove("overflowhidden");
		$("#disabletfaerror").innerText = "";
		$("#disabletfaerrorcontainer").classList.add("hidden");
		$("#disabletfainput").value = "";
	});
});
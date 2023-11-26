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
	$("#userBanner").classList.remove("loading");
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
		$("#userBanner").classList.add("loading");
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
		$("#userBanner").classList.remove("loading");
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
	clickhooks.push((event) => {
		/* banner edit dropdown */
		if (
			$("#bannerUpdateDropdown").classList.contains("hidden") ||
			$("#bannerUpdateDropdown").contains(event.target)
		) {
			$("#bannerUpdateBtn").classList.add("active");
			$("#bannerUpdateDropdown").classList.remove("hidden");
		} else {
			$("#bannerUpdateBtn").classList.remove("active");
			$("#bannerUpdateDropdown").classList.add("hidden");
		}
		if (!$("#bannerUpdateBtn").contains(event.target)) {
			$("#bannerUpdateBtn").classList.remove("active");
			$("#bannerUpdateDropdown").classList.add("hidden");
		}
	});
	
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
		const defaultBannerUrl = "https://betacdn.stibarc.com/banner/default.png";
		$("#userBanner").classList.add("loading");
		const response = await fetch("https://betaapi.stibarc.com/v4/editprofile.sjs", {
			method: "post",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				session: localStorage.sess,
				banner: defaultBannerUrl,
			})
		});
		const responseJSON = await response.json();
		$("#userBanner").classList.remove("loading");
		delete localStorage.banner;
		$("#userBanner").style.backgroundImage = `url("${defaultBannerUrl}")`;
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
	setLoggedinState(localStorage.sess)
});
let tfaEnabled = false;

async function updateInfo() {
	$("#userusername").textContent = api.username;
	const user = await api.getPrivateData();
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
}

function uploadBannerImage() {
	const fileInput = document.createElement("input");
	fileInput.setAttribute("type", "file");
	fileInput.setAttribute("accept", "image/*");
	fileInput.addEventListener("change", async function(e) {
		if (fileInput.files.length == 0) return;
		$("#userBanner").classList.add("loading");
		const file = await api.uploadFile(fileInput.files[0], "banner");
		$("#userBanner").classList.remove("loading");
		api.banner = `${file}.thumb.webp`;
		localStorage.banner = `${file}.thumb.webp`;
		$("#userBanner").style.backgroundImage = `url("${file}.thumb.webp")`;
	});
	fileInput.click();
}

window.addEventListener("load", async () => {
	listatehooks.push((state) => {
		if (state) {
			updateInfo();
		} else {
			location.href = "/";
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
			const file = await api.uploadFile(fileInput.files[0], "pfp");
			$("#userPfpLoader").classList.remove("loading");
			$("#userpfp").setAttribute("src", `${file}.thumb.webp`);
			api.pfp = `${file}.thumb.webp`;
			localStorage.pfp = `${file}.thumb.webp`;
		});
		fileInput.click();
	});
	$("#uploadBanner").addEventListener("click", () => {
		uploadBannerImage();
	});
	$("#removeBanner").addEventListener("click", async () => {
		$("#userBanner").classList.add("loading");
		await api.editProfile({ banner: api.defaultBannerUrl });
		$("#userBanner").classList.remove("loading");
		api.removeBanner();
		$("#userBanner").style.backgroundImage = `url("${api.defaultBannerUrl}")`;
	});
	$("#editprofilebutton").addEventListener("click", async () => {
		await api.editProfile({
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
		});
		location.href = `user.html?username=${api.username}`;
	});
	$("#cancel").addEventListener("click", () => {
		location.href = `user.html?username=${api.username}`;
	});
	setLoggedinState(api.loggedIn);
});
window.addEventListener("load", async () => {
	$("#userusername").innerText = localStorage.username;
	$("#userpfp").addEventListener("click", () => {
		const fileInput = document.createElement("input");
		fileInput.setAttribute("type", "file");
		fileInput.setAttribute("accept", "image/*");
		fileInput.addEventListener("change", async function(e) {
			if (fileInput.files.length == 0) return;
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
			localStorage.pfp = responseJSON.file;
			$("#userpfp").setAttribute("src", responseJSON.file);
		});
		fileInput.click();
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
	setLoggedinState(localStorage.sess);
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
	$("#nameinput").value = user.name;
	$("#showname").checked = user.displayName;
	$("#emailinput").value = user.email;
	$("#showemail").checked = user.displayEmail;
	const bday = new Date(user.birthday);
	$("#bdayinput").value = `${bday.getUTCFullYear()}-${(bday.getUTCMonth()+1).toString().padStart(2, "0")}-${bday.getUTCDate()}`;
	$("#showbday").checked = user.displayBirthday;
	$("#bioinput").value = user.bio;
	$("#showbio").checked = user.displayBio;
});
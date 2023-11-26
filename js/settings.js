let selectedTab = location.hash.slice(1) || "security";
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
    $(`#tabContent-${tab}`).classList.remove("hidden");
}

async function updateInfo() {
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
    $("#tfabutton").innerText = user.totpEnabled ? "Disable 2FA" : "Enable 2FA";
    tfaEnabled = user.totpEnabled;
}

window.addEventListener("load", async () => {
    listatehooks.push((state) => {
        if (state) {
            updateInfo();
        } else {
            location.href = "./";
        }
    });
    $(".sidebarItems li").forEach(item => {
        item.addEventListener("click", () => {
            switchTab(item);
        })
    });
    $(".tabContent").forEach(element => {
        element.classList.add("hidden");
    });
    $(`#tab-${selectedTab}`).classList.add("active");
    $(`#tabContent-${selectedTab}`).classList.remove("hidden");
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
    setLoggedinState(localStorage.sess);
});
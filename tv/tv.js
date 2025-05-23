window.addEventListener("load", async function() {
	const socket = new io("https://tv.stibarc.com");

	listatehooks.push(function(loggedIn) {
		if (loggedIn) {
			$("#chatmsg").disabled = false;
			$("#chatmsg").placeholder = "Type a message...";
			$("#sendmsg").disabled = false;
		} else {
			$("#chatmsg").disabled = true;
			$("#chatmsg").placeholder = "Log in to chat";
			$("#sendmsg").disabled = true;
		}
	});

	setLoggedinState(api.loggedIn);

	socket.on("connect", function() {
		listatehooks.push(function(loggedIn) {
			if (loggedIn) {
				socket.emit("login", {session: api.session});
			} else {
				socket.emit("logout");
			}
		});

		if (api.loggedIn) {
			socket.emit("login", {session: api.session});
		}
	});

	socket.on("viewercount", function(data) {
		$("#viewers").textContent = data.viewers;
	});

	let lastUserToSend = "";

	socket.on("chatmemberschange", function(data) {
		lastUserToSend = "";
		const evt = document.createElement("i");
		evt.classList.add("width100", "sysnotif");
		evt.setAttribute("title", new Date().toLocaleString());
		if (data.event === "join") {
			evt.textContent = `${data.username} joined the chat.`;
		} else if (data.event === "leave") {
			evt.textContent = `${data.username} left the chat.`;
		}
		$("#chatmessages").append(evt);
		$("#chatmessages").scrollTop = $("#chatmessages").scrollHeight;
	});

	socket.on("chatmessage", function(data) {
		const msg = new ChatMessageComponent(data.user, data.message, lastUserToSend !== data.user.username);
		msg.classList.add("width100");
		msg.setAttribute("title", new Date().toLocaleString());
		$("#chatmessages").append(msg);
		$("#chatmessages").scrollTop = $("#chatmessages").scrollHeight;
		lastUserToSend = data.user.username;
	});

	socket.on("history", function(data) {
		lastUserToSend = "";
		data.forEach(function(msg) {
			switch (msg.event) {
				case "message": {
					const msgElem = new ChatMessageComponent(msg.user, msg.message, lastUserToSend !== msg.user.username);
					msgElem.classList.add("width100");
					msgElem.setAttribute("title", new Date(msg.time).toLocaleString());
					$("#chatmessages").append(msgElem);
					lastUserToSend = msg.user.username;
					break;
				}
				case "join": {
					lastUserToSend = "";
					const evt = document.createElement("i");
					evt.classList.add("width100", "sysnotif");
					evt.setAttribute("title", new Date(msg.time).toLocaleString());
					evt.textContent = `${msg.username} joined the chat.`;
					$("#chatmessages").append(evt);
					break;
				}
				case "leave": {
					lastUserToSend = "";
					const evt = document.createElement("i");
					evt.classList.add("width100", "sysnotif");
					evt.setAttribute("title", new Date(msg.time).toLocaleString());
					evt.textContent = `${msg.username} left the chat.`;
					$("#chatmessages").append(evt);
					break;
				}
			}
		});
		$("#chatmessages").scrollTop = $("#chatmessages").scrollHeight;
	});

	socket.on("typing", function(data) {
		// Remove self from typing list
		const index = data.typing.indexOf(api.username);
		if (index > -1) {
			data.typing.splice(index, 1);
		}
		if (data.typing.length === 0) {
			$("#typing").textContent = "";
			$("#typing").classList.add("hidden");
			return;
		}
		$("#typing").classList.remove("hidden");
		if (data.typing.length === 1) {
			$("#typing").textContent = `${data.typing[0]} is typing...`;
		} else if (data.typing.length > 1 && data.typing.length <= 4) {
			$("#typing").textContent = `${data.typing.slice(0, -1).join(", ")}${(data.typing.length > 2) ? "," : ""} and ${data.typing[data.typing.length - 1]} are typing...`;
		} else {
			$("#typing").textContent = "Several people are typing...";
		}
	});

	let sendingMessage = false;
	function sendChatMessage() {
		if (sendingMessage) return;
		sendingMessage = true;
		const msg = $("#chatmsg").value;
		if (msg.trim() === "") return;
		socket.emit("chatmessage", {message: msg});
		$("#chatmsg").value = "";
		setTimeout(function() {
			sendingMessage = false;
		}, 500);
	}

	$("#sendmsg").addEventListener("click", sendChatMessage);

	$("#chatmsg").addEventListener("keydown", function(e) {
		if (e.key === "Enter") {
			sendChatMessage();
		} else {
			socket.emit("typing");
		}
	});

	// const source = document.createElement("source");
	// source.src = "https://tv.stibarc.com/stream";
	// source.type = "video/webm";

	const video = $("#videoplayer");
	const source = "https://tv.stibarc.com/stream/hls/stream.m3u8";

	if (video.canPlayType("application/vnd.apple.mpegurl")) {
		video.src = source;
		video.load();
	} else if (Hls.isSupported()) {
		function waitForGood() {
			return new Promise(async function (resolve) {
				let good = false;
				while (!good) {
					try {
						await fetch(source);
						good = true;
					} catch (e) {
						await new Promise(function(resolve) {
							setTimeout(resolve, 1000);
						});
					}
				}
				resolve();
			});
		}
		
		await waitForGood();
		const hls = new Hls();
		hls.loadSource(source);
		hls.on(Hls.Events.MANIFEST_PARSED, function() {
			$("#colorbars").classList.add("hidden");
			video.classList.remove("hidden");
			$("#nowplaying").textContent = "Live broadcast";
			video.play();
		});
		hls.attachMedia(video);
	}

	video.addEventListener("loadedmetadata", function() {
		$("#colorbars").classList.add("hidden");
		video.classList.remove("hidden");
		$("#nowplaying").textContent = "Live broadcast";
	});

	video.addEventListener("canplaythrough", function() {
		video.play();
	});

	video.addEventListener("ended", function() {
		video.classList.add("hidden");
		$("#colorbars").classList.remove("hidden");
		$("#nowplaying").textContent = "Nothing";
		video.load();
	});

	video.addEventListener("error", function() {
		setTimeout(function() {
			video.load();
		}, 1000);
	});

	// $("#videoplayer").append(source);
});
window.addEventListener("load", function() {
	const socket = new io("https://tv.stibarc.com");

	listatehooks.push(function(loggedIn) {
		if (loggedIn) {
			$("#chatmsg").disabled = false;
			$("#sendmsg").disabled = false;
		} else {
			$("#chatmsg").disabled = true;
			$("#sendmsg").disabled = true;
		}
	});

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
		$("#viewers").innerText = data.viewers;
	});

	socket.on("chatmemberschange", function(data) {
		const evt = document.createElement("i");
		evt.classList.add("width100");
		evt.setAttribute("title", new Date().toLocaleString());
		if (data.event === "join") {
			evt.innerText = `${data.username} joined the chat.`;
		} else if (data.event === "leave") {
			evt.innerText = `${data.username} left the chat.`;
		}
		$("#chatmessages").append(evt);
		$("#chatmessages").scrollTop = $("#chatmessages").scrollHeight;
	});

	let lastUserToSend = "";
	socket.on("chatmessage", function(data) {
		const msg = new ChatMessageComponent(data.user, data.message, lastUserToSend !== data.user.username);
		msg.classList.add("width100");
		msg.setAttribute("title", new Date().toLocaleString());
		$("#chatmessages").append(msg);
		$("#chatmessages").scrollTop = $("#chatmessages").scrollHeight;
		lastUserToSend = data.user.username;
	});

	socket.on("typing", function(data) {
		// Remove self from typing list
		const index = data.typing.indexOf(api.username);
		if (index > -1) {
			data.typing.splice(index, 1);
		}
		if (data.typing.length === 0) {
			$("#typing").innerText = "";
			$("#typing").classList.add("hidden");
			return;
		}
		$("#typing").classList.remove("hidden");
		if (data.typing.length === 1) {
			$("#typing").innerText = `${data.typing[0]} is typing...`;
		} else if (data.typing.length > 1 && data.typing.length <= 4) {
			$("#typing").innerText = `${data.typing.slice(0, -1).join(", ")}, and ${data.typing[data.typing.length - 1]} are typing...`;
		} else {
			$("#typing").innerText = "Several people are typing...";
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

	const source = document.createElement("source");
	source.src = "https://tv.stibarc.com/stream";
	source.type = "video/webm";

	$("#videoplayer").addEventListener("canplay", function() {
		$("#colorbars").classList.add("hidden");
		$("#videoplayer").classList.remove("hidden");
		$("#videoplayer").play();
		$("#nowplaying").innerText = "Live broadcast";
	});

	$("#videoplayer").addEventListener("ended", function() {
		$("#videoplayer").classList.add("hidden");
		$("#colorbars").classList.remove("hidden");
		$("#nowplaying").innerText = "Nothing";
		$("#videoplayer").load();
	});

	source.addEventListener("error", function() {
		setTimeout(function() {
			$("#videoplayer").load();
		}, 1000);
	});

	$("#videoplayer").append(source);
	$("#videoplayer").load();

	setLoggedinState(api.loggedIn);
});
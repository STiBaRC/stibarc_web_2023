window.addEventListener("load", function() {
	const socket = new io("https://tv.stibarc.com");

	socket.on("chatmemberschange", function(data) {
		const evt = document.createElement("i");
		evt.classList.add("width100");
		evt.setAttribute("title", new Date().toLocaleString());
		if (data.event === "join") {
			evt.textContent = `${data.username} joined the chat.`;
		} else if (data.event === "leave") {
			evt.textContent = `${data.username} left the chat.`;
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
					const evt = document.createElement("i");
					evt.classList.add("width100", "sysnotif");
					evt.setAttribute("title", new Date(msg.time).toLocaleString());
					evt.textContent = `${msg.username} joined the chat.`;
					$("#chatmessages").append(evt);
					break;
				}
				case "leave": {
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
		if (data.typing.length === 0) {
			$("#typing").textContent = "";
			$("#typing").classList.add("hidden");
			return;
		}
		$("#typing").classList.remove("hidden");
		if (data.typing.length === 1) {
			$("#typing").textContent = `${data.typing[0]} is typing...`;
		} else if (data.typing.length > 1 && data.typing.length <= 4) {
			$("#typing").textContent = `${data.typing.slice(0, -1).join(", ")}, and ${data.typing[data.typing.length - 1]} are typing...`;
		} else {
			$("#typing").textContent = "Several people are typing...";
		}
	});
});
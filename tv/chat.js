window.addEventListener("load", function() {
	const socket = new io("https://tv.stibarc.com");

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
});
const swipeSensitivity = 150;

function setFeed(activeFeed) {
	if (activeFeed == "followed") {
		$("#globalBtn").classList.remove("active");
		$("#followedBtn").classList.add("active");
	} else {
		$("#followedBtn").classList.remove("active");
		$("#globalBtn").classList.add("active");
	}
	localStorage.activeClipsFeed = activeFeed;
}

function handleGesture(clip, startY, endY) {
	return new Promise((resolve) => {
		if (endY - startY <= -swipeSensitivity) {
			// Swipe up
			console.log("swipe up");
			clip.style.setProperty("transform", "translateY(-100vh)");
			setTimeout(() => {
				clip.remove();
				resolve(false);
			}, 400);
		} else if (endY - startY >= swipeSensitivity) {
			// Swipe down
			console.log("swipe down");
			resolve(true);
		} else {
			resolve(true);
		}
	});
}

window.addEventListener("load", async function() {
	setFeed(localStorage.activeClipsFeed);
	$("#globalBtn").onclick = function () {
		setFeed("global");
	}
	$("#followedBtn").onclick = function () {
		setFeed("followed");
	}
	$(".floatingbutton").forEach(e => {
		e.style.setProperty("transition", "background-color 0.2s ease-out, transform 0.4s ease-in-out");
	});
	$(".floatingplusbuttoncontainer")[0].style.setProperty("transition", "transform 0.4s ease-in-out");

	// Hide floating buttons when we haven't interacted with the page for 1.5s
	let timeout = setTimeout(() => {
		$(".floatingbutton").forEach(e => e.style.setProperty("transform", "translateY(-100px)"));
		$(".floatingplusbuttoncontainer")[0].style.setProperty("transform", "translateX(100px)");
	}, 1500);
	window.addEventListener("mousemove", e => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			$(".floatingbutton").forEach(e => e.style.setProperty("transform", "translateY(-100px)"));
			$(".floatingplusbuttoncontainer")[0].style.setProperty("transform", "translateX(100px)");
		}, 1500);
		$(".floatingbutton").forEach(e => e.style.setProperty("transform", "translateY(0px)"));
		$(".floatingplusbuttoncontainer")[0].style.setProperty("transform", "translateX(0px)");
	});

	for (let i = 19; i >= 0; i--) {
		const clip = document.createElement("stibarc-clip");
		clip.setAttribute("content", `Clip ${i}`);
		$("#feed").appendChild(clip);

		let startY = 0;
		let endY = 0;

		// Implement swipe up to view next clip, moving the clip as we swipe
		let touchstarted = false;
		clip.addEventListener("touchstart", e => {
			startY = e.changedTouches[0].screenY;
			touchstarted = true;

			async function touchend(e) {
				endY = e.changedTouches[0].screenY;
				touchstarted = false;
				window.removeEventListener("touchend", touchend);
				window.removeEventListener("touchmove", touchmove);
				if (await handleGesture(clip, startY, endY)) {
					clip.style.setProperty("transform", "translateY(0px)");
					clip.style.setProperty("transition", "transform 0.1s ease-out");
				}
			}

			function touchmove(e) {
				e.preventDefault();
				if (!touchstarted) return;
				const touchmoveY = e.changedTouches[0].screenY;
				const y = touchmoveY - startY;
				clip.style.setProperty("transform", `translateY(${y}px)`);
				clip.style.setProperty("transition", "transform 0s");
			}

			window.addEventListener("touchend", touchend);
			window.addEventListener("touchmove", touchmove);
		});

		// Do the same for mouse
		let mousestarted = false;
		clip.addEventListener("mousedown", e => {
			startY = e.screenY;
			mousestarted = true;

			async function mouseup(e) {
				endY = e.screenY;
				mousestarted = false;
				window.removeEventListener("mouseup", mouseup);
				window.removeEventListener("mousemove", mousemove);
				if (await handleGesture(clip, startY, endY)) {
					clip.style.setProperty("transform", "translateY(0px)");
					clip.style.setProperty("transition", "transform 0.1s ease-out");
				}
			}

			function mousemove(e) {
				if (!mousestarted) return;
				const touchmoveY = e.screenY;
				const y = touchmoveY - startY;
				clip.style.setProperty("transform", `translateY(${y}px)`);
				clip.style.setProperty("transition", "transform 0s");
			}

			window.addEventListener("mouseup", mouseup);
			window.addEventListener("mousemove", mousemove);
		});
	}
});

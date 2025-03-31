class ClipComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");

			:host {
				display: block;
				aspect-ratio: 9 / 16;
				height: 100%;
				max-width: 100vw;
			}

			#clip {
				width: 100%;
				height: 100%;
				object-fit: cover;
				background-color: var(--color2);
			}

			#video {
				width: 100%;
				height: 100%;
			}

			#sideui {
				display: flex;
				gap: 8px;
				margin: 0 4px;
			}

			#bottomui {
				position: absolute;
				box-sizing:border-box;
				bottom: 0px;
				left: 0px;
				padding: 14px 14px;
				align-items: end;
				flex-direction: row;
				width: 100%;
				word-break: break-word;
				overflow: hidden;
				background: linear-gradient(to bottom, transparent 0%, var(--color11) 100%);
			}
			
			#playicon {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
			}

			#date {
				font-style: italic;
			}
			
			.iconcontainer {
				display: flex;
				align-items: center;
				justify-content: center;
				flex-direction: column;
			}
		</style>
		<div id="clip">
			<video id="video" loop></video>
			<stibarc-icon name="play" size="iconVeryBig" id="playicon" color="white"></stibarc-icon>
			<div id="bottomui" class="flexcontainer leftalign fadeout">
				<div id="metadata" class="flexcontainer leftalign flexcolumn flexgrow">
					<div class="flexcontainer leftalign width100">
						<a id="userLink" class="flexcontainer">
							<img id="pfp" class="pfp" width="55px"></img>
							<span id="username"></span>
						</a>
						<stibarc-icon id="verified" type="verifiedBadge" name="verified" class="verifiedBadge hidden" title="Verified"></stibarc-icon>
						<span id="pronouns" class="pronouns"></span>
					</div>
					<div class="flexcontainer leftalign width100" style="flex-direction: column;">
						<span id="date" class="leftalign width100"></span>
						<span id="description" class="leftalign width100"></span>
					</div>
				</div>
				<div id="sideui" class="flexcontainer flexcolumn">
					<div id="upvotec" class="iconcontainer">
						<stibarc-icon name="up_arrow" size="iconLarge" id="upvoteicon"></stibarc-icon>
						<span id="upvotes"></span>
					</div>
					<div id="downvotec" class="iconcontainer">
						<stibarc-icon name="down_arrow" size="iconLarge" id="downvoteicon"></stibarc-icon>
						<span id="downvotes"></span>
					</div>
					<div id="commentc" class="iconcontainer">
						<stibarc-icon name="comment" size="iconLarge" id="commentsicon"></stibarc-icon>
						<span id="comments"></span>
					</div>
				</div>
			</div>
		</div>
	`;
	#video = null;
	#playIcon = null;
	#commentButtonListener = null;
	#maxDescriptionLength = 150;

	constructor() {
		super();
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "open" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		const id = this.getAttribute("data-clip-id");

		this.shadow.querySelector("#upvotes").textContent = this.getAttribute("data-upvotes");
		this.shadow.querySelector("#downvotes").textContent = this.getAttribute("data-downvotes");
		this.shadow.querySelector("#comments").textContent = this.getAttribute("data-comments");

		this.#playIcon = this.shadow.querySelector("#playicon");
		this.#video = this.shadow.querySelector("#video");

		this.#video.src = this.getAttribute("data-content");
		this.#video.setAttribute("poster", `${this.getAttribute("data-content")}.thumb.webp`);

		this.shadow.querySelector("#pfp").src = this.getAttribute("data-pfp");
		this.shadow.querySelector("#username").textContent = this.getAttribute("data-username");
		this.shadow.querySelector("#userLink").href = `/user.html?username=${this.getAttribute("data-username")}`;
		if (this.getAttribute("data-verified") == "true") this.shadow.querySelector("#verified").classList.remove("hidden");
		this.shadow.querySelector("#pronouns").setAttribute("title", `Pronouns (${this.getAttribute("data-pronouns")})`);
		if (this.getAttribute("data-pronouns")) this.shadow.querySelector("#pronouns").textContent = `(${this.getAttribute("data-pronouns")})`;

		this.shadow.querySelector("#date").textContent = new Date(this.getAttribute("data-date")).toLocaleString();
		this.shadow.querySelector("#description").textContent = this.getAttribute("data-description").substring(0, this.#maxDescriptionLength) + (this.getAttribute("data-description").length > this.#maxDescriptionLength ? "..." : "");

		this.shadow.querySelector("#upvotec").addEventListener("click", () => {
			if (!api.loggedIn) return;
			api.vote({
				postId: id,
				vote: "upvote",
				target: "clip"
			}).then((results) => {
				if (results) {
					this.shadow.querySelector("#upvotes").textContent = results.upvotes;
					this.shadow.querySelector("#downvotes").textContent = results.downvotes;
				}
			});
		});

		this.shadow.querySelector("#downvotec").addEventListener("click", () => {
			if (!api.loggedIn) return;
			api.vote({
				postId: id,
				vote: "downvote",
				target: "clip"
			}).then((results) => {
				if (results) {
					this.shadow.querySelector("#upvotes").textContent = results.upvotes;
					this.shadow.querySelector("#downvotes").textContent = results.downvotes;
				}
			});
		});

		this.shadow.querySelector("#commentc").addEventListener("click", () => {
			if (this.#commentButtonListener) {
				this.#commentButtonListener();
			}
		});

		this.pause();
	}

	play() {
		this.#playIcon.classList.add("hidden");
		setTimeout(() => {
			this.shadow.querySelector("#bottomui").classList.add("fadeout");
			this.shadow.querySelector("#bottomui").classList.remove("show");
		}, 700);
		try {
			this.#video.play();
		} catch (e) {
			this.#playIcon.classList.remove("hidden");
			this.shadow.querySelector("#bottomui").classList.add("show");
			// Wait until the video can play
			function onCanPlay() {
				this.#video.removeEventListener("canplay", onCanPlay);
				this.#playIcon.classList.add("hidden");
				this.#video.play();
			}
			this.#video.addEventListener("canplay", onCanPlay);
		}
	}

	pause() {
		this.#playIcon.classList.remove("hidden");
		this.shadow.querySelector("#sideui").classList.remove("hidden");
		this.shadow.querySelector("#bottomui").classList.remove("fadeout");
		this.shadow.querySelector("#bottomui").classList.add("show");
		this.#video.pause();
	}

	restartVideo() {
		this.#video.currentTime = 0;
	}

	set commentButtonListener(listener) {
		this.#commentButtonListener = listener;
	}

	get commentButtonListener() {
		return this.#commentButtonListener;
	}

	get playing() {
		return !this.#video?.paused ?? false;
	}
}

customElements.define("stibarc-clip", ClipComponent);
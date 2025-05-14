class AttachmentBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");
			@import url("/css/post.css");
			#source { max-width: 100%; }
		</style>
	`;
	#shadowDomHTMLImg = `
		<img id="source" loading="lazy"></img>
	`;
	#shadowDomHTMLVideo = `
		<video controls>
			<source id="source"></source>
		</video>
	`;
	#shadowDomHTMLAudio = `
		<audio controls>
			<source id="source"></source>
		</audio>
	`;
	#shadowDomHTMLVideoPreview = `
		<div style="position: relative;">
			<img id="source" loading="lazy"></img>
			<stibarc-icon name="play" size="iconLarge" color="white" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></stibarc-icon>
		</div>
	`;
	#shadowDomHTMLAudioPreview = `
		<div class="flexcontainer" style="flex-direction: column; justify-content: center; align-items: center; width: 150px; height: 100px; background-color: var(--color1); border-radius: 10px;">
			<stibarc-icon name="audio" size="iconVeryBig" color="white"></stibarc-icon>
		</div>
	`;
	#shadowDomHTMLError = `
		<img src="/img/jimbomournsyourmisfortune.png" title="Error: attachment can not be displayed." loading="lazy"></img>
	`;
	#attachment;
	#isPost = false;
	#localFileName = null;
	#previewBlobURL = null;

	constructor(attachment, isPost = false, localFileName = null) {
		super();
		this.#attachment = attachment;
		this.#isPost = isPost;
		this.#localFileName = localFileName;
	}

	createLocalVideoPreview(attachment) {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const video = document.createElement("video");
			video.src = attachment;

			video.muted = true;
			video.currentTime = 0;
			video.load();

			video.addEventListener("loadedmetadata", () => {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
			});

			video.addEventListener("loadeddata", () => {
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

				canvas.toBlob((blob) => {
					const previewBlobURL = URL.createObjectURL(blob);

					video.remove();
					canvas.remove();

					resolve(previewBlobURL);
				});
			});
		});
	}

	async connectedCallback() {
		const images = ["png", "jpg", "gif", "webp", "svg"];
		const videos = ["mov", "mp4", "webm"];
		const audios = ["spx", "m3a", "m4a", "wma", "wav", "mp3"];
		const parts = (this.#localFileName !== null) ? this.#localFileName.split(".") : this.#attachment.split(".");
		const ext = parts[parts.length - 1];
		let type;

		if (images.indexOf(ext) != -1) {
			this.#shadowDomHTML += this.#shadowDomHTMLImg;
			type = "img";
			if (!this.#isPost && this.#localFileName === null) {
				this.#attachment = `${this.#attachment}.thumb.webp`;
			}
		} else if (videos.indexOf(ext) != -1) {
			if (this.#isPost) {
				this.#shadowDomHTML += this.#shadowDomHTMLVideo;
			} else {
				if (this.#localFileName !== null) {
					this.#previewBlobURL = await this.createLocalVideoPreview(this.#attachment);
					this.#attachment = this.#previewBlobURL;
				}
				this.#shadowDomHTML += this.#shadowDomHTMLVideoPreview;
			}
			type = "video";
			if (!this.#isPost && this.#localFileName === null) {
				this.#attachment = `${this.#attachment}.thumb.webp`;
			}
		} else if (audios.indexOf(ext) != -1) {
			if (this.#isPost) {
				this.#shadowDomHTML += this.#shadowDomHTMLAudio;
			} else {
				this.#shadowDomHTML += this.#shadowDomHTMLAudioPreview;
			}
			type = "audio";
		} else {
			this.#shadowDomHTML += this.#shadowDomHTMLError;
			type = "error";
		}

		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		if (type == "error") return;

		const source = this.shadow.querySelector("#source");
		source.setAttribute("src", this.#attachment);

		let element;
		switch (type) {
			case "img":
				element = this.shadow.querySelector("img");
				if (this.#isPost) {
					element.addEventListener("click", () => {
						window.open(this.#attachment, "_blank");
					});
				}
				break;
			case "video":
				if (this.#isPost) {
					element = this.shadow.querySelector("video");
					element.setAttribute("poster", `${this.#attachment}.thumb.webp`);
				} else {
					element = this.shadow.querySelector("img");
				}
				break;
			case "audio":
				element = this.shadow.querySelector("audio");
				break;
		}
		if (this.#isPost) {
			element.classList.add("postattachment");
		} else {
			if (type !== "audio") {
				element.classList.add("attachmentimage");
			}
		}
	}

	preRemove() {
		if (this.#previewBlobURL) {
			URL.revokeObjectURL(this.#previewBlobURL);
		}
	}
}

customElements.define("stibarc-attachment", AttachmentBlockComponent);
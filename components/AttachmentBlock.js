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
	#shadowDomHTMLError = `
		<img src="/img/jimbomournsyourmisfortune.png" title="Error: attachment can not be displayed." loading="lazy"></img>
	`;
	type;
	attachment;
	isPost = false;

	constructor(attachment, isPost = false) {
		super();
		this.attachment = attachment;
		this.isPost = isPost;
		const images = ["png", "jpg", "gif", "webp", "svg"];
		const videos = ["mov", "mp4", "webm"];
		const audios = ["spx", "m3a", "m4a", "wma", "wav", "mp3"];
		const parts = attachment.split(".");
		const ext = parts[parts.length - 1];

		if (images.indexOf(ext) != -1) {
			this.#shadowDomHTML += this.#shadowDomHTMLImg;
			this.type = "img";
		} else if (videos.indexOf(ext) != -1) {
			this.#shadowDomHTML += this.#shadowDomHTMLVideo;
			this.type = "video";
		} else if (audios.indexOf(ext) != -1) {
			this.#shadowDomHTML += this.#shadowDomHTMLAudio;
			this.type = "audio";
		} else {
			this.#shadowDomHTML += this.#shadowDomHTMLError;
			this.type = "error";
		}
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		if (this.type == "error") return;

		const source = this.shadow.querySelector("#source");
		source.setAttribute("src", this.attachment);

		let element;
		switch (this.type) {
			case "img":
				element = this.shadow.querySelector("img");
				if (this.isPost) {
					element.addEventListener("click", () => {
						window.open(this.attachment, "_blank");
					});
				}
				break;
			case "video":
				element = this.shadow.querySelector("video");
				break;
			case "audio":
				element = this.shadow.querySelector("audio");
				break;
		}
		if (this.isPost) {
			element.classList.add("postattachment");
		} else {
			element.classList.add("attachmentimage");
		}
	}
}

customElements.define("stibarc-attachment", AttachmentBlockComponent);
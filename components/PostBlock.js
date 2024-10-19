class PostBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("./css/global.css");
			@import url("./css/post.css");
			:host {
				width: 100%;
			}
		</style>
		<span class="post flexcontainer flexcolumn">
			<a id="titleLink" class="posttitle leftalign width100"></a>
			<span class="flexcontainer leftalign width100">
				<a id="userLink" class="flexcontainer">
					<img id="pfp" class="pfp"></img>
					<span id="username"></span>
				</a>
				<stibarc-icon id="verified" type="verifiedBadge" name="verified" class="verifiedBadge hidden" title="Verified"></stibarc-icon>
				<span id="pronouns" class="pronouns"></span>
			</span>
			<span id="date" class="postdate leftalign width100">
			</span>
			<hr class="width100">
			<span id="postcontent" class="postcontent flexcolumn leftalign width100">
				<span id="posttextcontent"></span>
			</span>
			<hr class="width100">
			<span class="leftalign width100 metaSpan">
				<stibarc-icon name="up_arrow"></stibarc-icon>
				<span id="upvotes"></span>
				<stibarc-icon name="down_arrow"></stibarc-icon>
				<span id="downvotes"></span>
				<stibarc-icon name="comment"></stibarc-icon>
				<span id="comments"></span>
			</span>
		</span>
	`;
	post;

	constructor(post) {
		super();
		this.post = post;
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		let title = this.post.title;
		if (this.post.title.length > maxTitleLength) title = `${this.post.title.substring(0, maxTitleLength)}...`;

		this.shadow.querySelector("#titleLink").setAttribute("href", `./post.html?id=${this.post.id}`);
		this.shadow.querySelector("#titleLink").textContent = title;
		this.shadow.querySelector("#userLink").setAttribute("href", `./user.html?username=${this.post.poster.username}`);
		this.shadow.querySelector("#pfp").setAttribute("src", this.post.poster.pfp);
		this.shadow.querySelector("#username").textContent = this.post.poster.username;
		if (this.post.poster.verified) this.shadow.querySelector("#verified").classList.remove("hidden");
		this.shadow.querySelector("#pronouns").setAttribute("title", `Pronouns (${this.post.poster.pronouns})`);
		if (this.post.poster.pronouns) this.shadow.querySelector("#pronouns").textContent = `(${this.post.poster.pronouns})`;
		this.shadow.querySelector("#date").textContent = this.post.date;
		this.shadow.querySelector("#posttextcontent").textContent = this.post.content;
		this.shadow.querySelector("#upvotes").textContent = this.post.upvotes;
		this.shadow.querySelector("#downvotes").textContent = this.post.downvotes;
		this.shadow.querySelector("#comments").textContent = this.post.comments;

		if (
			this.post.attachments &&
			this.post.attachments.length > 0 &&
			this.post.attachments[0] !== null
		) {
			const attachmentContainer = document.createElement("span");
			const moreAttachments = document.createElement("div");
			attachmentContainer.classList.add("attachmentContainer");
			moreAttachments.classList.add("moreAttachments");
			const attachment = new AttachmentBlockComponent(this.post.attachments[0]);
			attachmentContainer.append(attachment);
			if (this.post.attachments.length > 1) {
				moreAttachments.innerText = `+${this.post.attachments.length - 1}`;
				attachmentContainer.append(moreAttachments);
			}
			this.shadow.querySelector("#postcontent").append(attachmentContainer);
		}
	}
}

customElements.define("stibarc-post", PostBlockComponent);
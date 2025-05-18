class PostBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("/css/global.css");
			@import url("/css/post.css");
			:host {
				width: 100%;
			}
			#posttextcontent {
				-webkit-box-orient: vertical;
				display: -webkit-box;
				flex-basis: unset;
				-webkit-line-clamp: 7;
				line-clamp: 7;
				word-wrap: break-word;
				max-width: 100%;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: pre-wrap;
			}
		</style>
		<div class="post flexcontainer flexcolumn">
			<div class="width100">
				<a id="titleLink" class="posttitle leftalign width100"></a
			</div>
			<div class="flexcontainer leftalign width100">
				<a id="userLink" class="flexcontainer">
					<img id="pfp" class="pfp" width="55px"></img>
					<span id="username"></span>
				</a>
				<stibarc-icon id="verified" type="verifiedBadge" name="verified" class="verifiedBadge hidden" title="Verified"></stibarc-icon>
				<span id="pronouns" class="pronouns"></span>
			</div>
			<span class="postdate leftalign width100">
				<span id="postdate"></span>
				<stibarc-icon name="lock" title="Private post" id="privateposticon" class="hidden"></stibarc-icon>
			</span>
			<hr class="width100">
			<div id="postcontent" class="postcontent flexcolumn leftalign width100">
				<span id="posttextcontent"></span>
			</div>
			<hr class="width100">
			<div class="leftalign width100 metaSpan">
				<stibarc-icon name="up_arrow"></stibarc-icon>
				<span id="upvotes"></span>
				<stibarc-icon name="down_arrow"></stibarc-icon>
				<span id="downvotes"></span>
				<stibarc-icon name="comment"></stibarc-icon>
				<span id="comments"></span>
			</div>
		</div>
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

		this.shadow.querySelector("#titleLink").setAttribute("href", `/post.html?id=${this.post.id}`);
		this.shadow.querySelector("#titleLink").textContent = title;
		this.shadow.querySelector("#userLink").setAttribute("href", `/user.html?username=${this.post.poster.username}`);
		this.shadow.querySelector("#pfp").setAttribute("src", this.post.poster.pfp);
		this.shadow.querySelector("#username").textContent = this.post.poster.username;
		if (this.post.poster.verified) this.shadow.querySelector("#verified").classList.remove("hidden");
		this.shadow.querySelector("#pronouns").setAttribute("title", `Pronouns (${this.post.poster.pronouns})`);
		if (this.post.poster.pronouns) this.shadow.querySelector("#pronouns").textContent = `(${this.post.poster.pronouns})`;
		this.shadow.querySelector("#postdate").textContent = new Date(this.post.date).toLocaleString();
		if (this.post.private) this.shadow.querySelector("#privateposticon").classList.remove("hidden");
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
				moreAttachments.textContent = `+${this.post.attachments.length - 1}`;
				attachmentContainer.append(moreAttachments);
			}
			this.shadow.querySelector("#postcontent").append(attachmentContainer);
		}

		this.addEventListener("click", () => {
			window.location.href = `/post.html?id=${this.post.id}`;
		});
	}
}

customElements.define("stibarc-post", PostBlockComponent);
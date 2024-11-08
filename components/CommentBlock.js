class CommentBlockComponent extends HTMLElement {
	// This is safe because no part of this is dynamic
	#shadowDomHTML = `
		<style>
			@import url("./css/global.css");

			:host {
				width: 100%;
			}
		</style>
		<span class="comment flexcontainer flexcolumn">
			<span class="flexcontainer leftalign width100">
				<a id="userLink" class="flexcontainer">
					<img id="pfp" class="pfp"></img>
					<span id="username"></span>
				</a>
				<stibarc-icon id="verified" type="verifiedBadge" name="verified" class="verifiedBadge hidden" title="Verified"></stibarc-icon>
				<span id="pronouns" class="pronouns"></span>
			</span>
			<span id="postdate" class="postdate leftalign width100"></span>
			<span>
				<span id="edited" class="smallBadge dark hidden">Edited</span>
			</span>
			<hr class="width100">
			<span id="content" class="postcontent flexcolumn leftalign width100"></span>
			<hr class="width100">
			<span id="actions-post" class="aligncenter leftalign width100 flexwrap hidden">
				<button id="upvote" class="flexcontainer button primary voteBtn" title="Upvote">
					<stibarc-icon name="up_arrow"></stibarc-icon>
					<span id="upvotes"></span>
				</button>
				<button id="downvote" class="flexcontainer button primary voteBtn" title="Downvote">
					<stibarc-icon name="down_arrow"></stibarc-icon>
					<span id="downvotes"></span>
				</button>
				<span class="flexgrow"></span>
				<button id="edit" class="flexcontainer editBtn hidden" title="Edit comment">
					<stibarc-icon name="edit" size="24" inverted-light=true></stibarc-icon>
				</button>
			</span>
			<span id="actions-not-post" class="aligncenter leftalign width100 flexwrap hidden">
				<stibarc-icon name="up_arrow"></stibarc-icon>
				<span id="upvotes-non"></span>
				<stibarc-icon name="down_arrow"></stibarc-icon>
				<span id="downvotes-non"></span>
				<stibarc-icon name="comment"></stibarc-icon>
				<span id="comments-non"></span>
			</span>
		</span>
	`;
	post;
	comment;
	isPostPage;

	constructor(post, comment, isPostPage) {
		super();
		this.post = post;
		this.comment = comment;
		this.isPostPage = isPostPage;
	}

	connectedCallback() {
		this.shadow = this.attachShadow({ mode: "closed" });
		this.shadow.innerHTML = this.#shadowDomHTML;

		this.shadow.querySelector("#userLink").setAttribute("href", `./user.html?username=${this.comment.poster.username}`);
		this.shadow.querySelector("#pfp").setAttribute("src", this.comment.poster.pfp);
		this.shadow.querySelector("#username").textContent = this.comment.poster.username;
		if (this.comment.poster.verified) this.shadow.querySelector("#verified").classList.remove("hidden");
		this.shadow.querySelector("#pronouns").setAttribute("title", `Pronouns (${this.comment.poster.pronouns})`);
		if (this.comment.poster.pronouns) this.shadow.querySelector("#pronouns").textContent = `(${this.comment.poster.pronouns})`;
		this.shadow.querySelector("#postdate").textContent = new Date(this.comment.date).toLocaleString();
		this.shadow.querySelector("#content").textContent = this.comment.content;
		if (this.comment.edited) {
			this.shadow.querySelector("#edited").setAttribute("title", `Edited ${new Date(this.comment.lastEdited).toLocaleString()}`);
			this.shadow.querySelector("#edited").classList.remove("hidden");
		}
		if (this.isPostPage) {
			this.shadow.querySelector("#actions-post").classList.remove("hidden");
			this.shadow.querySelector("#upvotes").textContent = this.comment.upvotes;
			this.shadow.querySelector("#downvotes").textContent = this.comment.downvotes;

			if (this.comment.poster.username === localStorage.username) {
				this.shadow.querySelector("#edit").classList.remove("hidden");
				this.shadow.querySelector("#edit").addEventListener("click", () => {
					window.location.href = `./edit.html?id=${this.post.id}&cid=${this.comment.id}`;
				});
			}

			this.shadow.querySelector("#upvote").addEventListener("click", async () => {
				if (localStorage.sess) {
					const voteResult = await vote({
						id: this.post.id,
						commentId: this.comment.id,
						target: "comment",
						vote: "upvote",
					});
					this.shadow.querySelector("#upvotes").textContent = voteResult.upvotes;
					this.shadow.querySelector("#downvotes").textContent = voteResult.downvotes;
				} else {
					$("stibarc-login-modal")[0].show();
				}
			});
		
			this.shadow.querySelector("#downvote").addEventListener("click", async () => {
				if (localStorage.sess) {
					const voteResult = await vote({
						id: this.post.id,
						commentId: this.comment.id,
						target: "comment",
						vote: "downvote",
					});
					this.shadow.querySelector("#upvotes").textContent = voteResult.upvotes;
					this.shadow.querySelector("#downvotes").textContent = voteResult.downvotes;
				} else {
					$("stibarc-login-modal")[0].show();
				}
			});
		} else {
			this.shadow.querySelector("#actions-not-post").classList.remove("hidden");
			this.shadow.querySelector("#upvotes-non").textContent = this.comment.upvotes;
			this.shadow.querySelector("#downvotes-non").textContent = this.comment.downvotes;
			this.shadow.querySelector("#comments-non").textContent = this.comment.comments;
		}

		if (
			this.comment.attachments &&
			this.comment.attachments.length > 0 &&
			this.comment.attachments[0] !== null
		) {
			for (let i = 0; i < this.comment.attachments.length; i++) {
				let attachment = new AttachmentBlockComponent(this.comment.attachments[i]);
				attachment.classList.add("postattachment");
				attachment.addEventListener("click", () => {
					window.open(this.comment.attachments[i], "_blank");
				});
				this.shadow.querySelector("#content").append(attachment);
			}
		}

		listatehooks.push((state) => {
			if (state) {
				if (this.comment.poster.username === localStorage.username) {
					this.shadow.querySelector("#edit").classList.remove("hidden");
				}
			} else {
				this.shadow.querySelector("#edit").classList.add("hidden");
			}
		});
	}
}

customElements.define("stibarc-comment", CommentBlockComponent);
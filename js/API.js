class API {
	#config;
	#host;
	#cdn;
	#session;
	#username;
	#pfp;
	#banner;
	#private;
	#lastSeenGlobalPost;
	#lastSeenFollowedPost;
	#lastSeenGlobalClip;
	#lastSeenFollowedClip;

	constructor() {
		this.#session = localStorage.sess;
		this.#username = localStorage.username;
		this.#pfp = localStorage.pfp || `${this.#cdn}/pfp/default.png`;
		this.#banner = localStorage.banner;
		this.#private = localStorage.private === "true";
	}

	get host() {
		return this.#host;
	}

	get cdn() {
		return this.#cdn;
	}

	get session() {
		return this.#session;
	}

	get username() {
		return this.#username;
	}

	get pfp() {
		return this.#pfp;
	}

	get banner() {
		return this.#banner;
	}

	get private() {
		return this.#private;
	}

	get defaultBannerUrl() {
		return `${api.cdn}/banner/default.png.thumb.webp`;
	}

	get loggedIn() {
		return this.#session !== undefined;
	}

	/**
	 * Removes the cached banner
	 */
	removeBanner() {
		this.#banner = undefined;
		delete localStorage.banner;
	}

	/**
	 * Initializes the API
	 * @returns {Promise<void>}
	 */
	async init() {
		this.#config = await (await fetch("/config/config.json")).json();
		this.#host = this.#config.apiHost;
		this.#cdn = this.#config.cdn;
	}

	/**
	 * Reload session info
	 */
	async reloadSessInfo() {
		if (!this.loggedIn) return;
		const sessInfo = await this.getPrivateData();
		this.#username = sessInfo.username;
		this.#pfp = sessInfo.pfp || `${this.#cdn}/pfp/default.png`;
		this.#banner = sessInfo.banner;
		this.#private = sessInfo.private;
		localStorage.username = this.#username;
		localStorage.pfp = this.#pfp;
		localStorage.banner = this.#banner;
		localStorage.private = this.#private;
	}

	/**
	 * Fetches an announcement
	 * @returns {Promise<string>} The announcement
	 */
	async getAnnouncement() {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/getannouncement.sjs`);
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch announcement");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse announcement");
		}
		if (responseJSON.status !== "ok") {
			// TODO: Show popup
			throw new Error("Failed to fetch announcement");
		}
		return responseJSON.announcement;
	}

	/**
	 * Uploads a file
	 * @param {File} file The file to upload
	 * @param {string} usage The usage of the file. Can be "attachment", "pfp", or "banner".
	 * @returns {Promise<object>} The uploaded file
	 */
	async uploadFile(file, usage) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/uploadfile.sjs`, {
				method: "post",
				headers: {
					"Content-Type": file.type,
					"X-Session-Key": this.#session,
					"X-File-Usage": usage
				},
				body: await file.arrayBuffer()
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to upload file");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse upload response");
		}
		if (responseJSON.status !== "ok") {
			// TODO: Show popup
			throw new Error("Failed to upload file");
		}
		switch (usage) {
			case "pfp":
				this.#pfp = responseJSON.file;
				localStorage.pfp = this.#pfp;
				break;
			case "banner":
				this.#banner = responseJSON.file;
				localStorage.banner = this.#banner;
				break;
		}
		return responseJSON.file;
	}

	/**
	 * Registers a new user
	 * @param {{
	 * 	username: string,
	 * 	password: string,
	 * 	name: string,
	 * 	email: string,
	 * 	birthday: string,
	 * 	bio: string,
	 * 	pronouns: string,
	 * 	displayName: boolean,
	 * 	displayEmail: boolean,
	 * 	displayBirthday: boolean,
	 * 	displayBio: boolean,
	 * 	displayPronouns: boolean
	 * }} user The user to register
	 * @returns {Promise<object>} The session key, username, and profile picture
	 */
	async registerUser({ username, password, name, email, birthday, bio, pronouns, displayName, displayEmail, displayBirthday, displayBio, displayPronouns }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/registeruser.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					username,
					password,
					name,
					email,
					birthday,
					bio,
					pronouns,
					displayName,
					displayEmail,
					displayBirthday,
					displayBio,
					displayPronouns
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to register");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse registration response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "ue":
					throw new Error("Username taken");
				default:
					// TODO: Show popup
					throw new Error("Failed to register");
			}
		}
		this.#session = responseJSON.session;
		this.#username = username;
		this.#pfp = `${this.#cdn}/pfp/default.png`;
		localStorage.sess = this.#session;
		localStorage.username = this.#username;
		localStorage.pfp = this.#pfp;
		return {
			session: this.#session,
			username: this.#username,
			pfp: this.#pfp
		};
	}

	/**
	 * Logs in a user
	 * @param {string} username The username
	 * @param {string} password The password
	 * @param {string} totpCode The TOTP code, if 2FA is enabled
	 * @returns {Promise<object>} The session key, username, and profile picture
	 */
	async login(username, password, totpCode) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/login.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					username,
					password,
					totpCode
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to login");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse login response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "totpr":
					throw new Error("2FA code required");
				case "iuop":
					throw new Error("Invalid username or password");
				case "itotp":
					throw new Error("Invalid 2FA code");
				case "banned":
					throw new Error("User is banned");
				default:
					// TODO: Show popup
					throw new Error("Failed to login");
			}
		}
		this.#session = responseJSON.session;
		this.#username = responseJSON.username;
		this.#pfp = responseJSON.pfp;
		this.#banner = responseJSON.banner;
		this.#private = responseJSON.private;
		localStorage.sess = this.#session;
		localStorage.username = this.#username;
		localStorage.pfp = this.#pfp;
		localStorage.banner = this.#banner;
		localStorage.private = this.#private;
		return {
			session: this.#session,
			username: this.#username,
			pfp: this.#pfp,
			banner: this.#banner,
			private: this.#private
		};
	}

	/**
	 * Deletes session storage
	 * 
	 */
	deleteSession() {
		delete localStorage.sess;
		delete localStorage.username;
		delete localStorage.pfp;
		delete localStorage.banner;
		delete localStorage.private;
		this.#session = undefined;
		this.#username = undefined;
		this.#pfp = undefined;
		this.#banner = undefined;
		this.#private = undefined;
	}

	/**
	 * Logs out the user
	 * @returns {Promise<void>}
	 */
	async logout() {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/logout.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to logout");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse logout response");
		}
		if (responseJSON.status !== "ok") {
			// TODO: Show popup
			throw new Error("Failed to logout");
		}
		this.deleteSession();
	}

	/**
	 * Log out a specific session. Will not log out current instance.
	 * @param {string} session The session to log out
	 * @returns {Promise<void>}
	 */
	async logoutSession(session) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/logout.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to logout");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse logout response");
		}
		if (responseJSON.status !== "ok") {
			// TODO: Show popup
			throw new Error("Failed to logout");
		}
	}

	/**
	 * Updates the user's password
	 * @param {string} oldPassword The old password
	 * @param {string} newPassword The new password
	 * @param {boolean} logoutOthers Whether to log out other sessions
	 * @returns {Promise<void>}
	 */
	async updatePassword(oldPassword, newPassword, logoutOthers) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/updatepassword.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					oldPassword,
					newPassword,
					logoutOthers
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to update password");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse update password response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "ip":
					throw new Error("Invalid old password");
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to update password");
			}
		}
	}

	/**
	 * Updates the user's two-factor authentication settings
	 * @param {string} state The state. Can be "generatetotp", "enabletotp", or "disabletotp"
	 * @param {string} totpCode The TOTP code, if 2FA is enabled
	 * @returns {Promise<string | undefined>} The TOTP secret, if 2FA is being enabled
	 */
	async manage2FA(state, totpCode) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/manage2fa.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					state,
					totpCode
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to manage 2FA");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse manage 2FA response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to manage 2FA");
			}
		}
		return responseJSON.totpCode;
	}

	/**
	 * Gets a user's profile
	 * @param {string} username The username of the user
	 * @returns {Promise<object>} The user's profile
	 */
	async getUser(username) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/getuser.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					username: username,
					session: this.#session
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch user");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse user response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "unf":
					throw new Error("User not found");
				default:
					// TODO: Show popup
					throw new Error("Failed to fetch user");
			}
		}
		return responseJSON.user;
	}

	/**
	 * Gets the private data of the currently logged in user
	 * @returns {Promise<object>} The private data of the user
	 */
	async getPrivateData() {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/getprivatedata.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch private data");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse private data response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to fetch private data");
			}
		}
		return responseJSON.user;
	}

	/**
	 * Edits the profile of the currently logged in user
	 * @param {{
	 * 	pfp: string,
	 * 	banner: string,
	 * 	name: string,
	 * 	email: string,
	 * 	birthday: string,
	 * 	bio: string,
	 * 	pronouns: string,
	 * 	displayName: boolean,
	 * 	displayEmail: boolean,
	 * 	displayBirthday: boolean,
	 * 	displayBio: boolean,
	 * 	displayPronouns: boolean,
	 * 	block: boolean,
	 * 	displayBlock: boolean
	 * 	private: boolean,
	 * 	changePostVisibility: boolean
	 * }} newUserDetails The new details of the user. All fields are optional.
	 * @returns {Promise<void>}
	 */
	async editProfile({ pfp, banner, name, email, birthday, bio, pronouns, displayName, displayEmail, displayBirthday, displayBio, displayPronouns, block, displayBlock, privateProfile, changePostVisibility }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/editprofile.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					pfp,
					banner,
					name,
					email,
					birthday,
					bio,
					pronouns,
					displayName,
					displayEmail,
					displayBirthday,
					displayBio,
					displayPronouns,
					block,
					displayBlock,
					private: privateProfile,
					changePostVisibility
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to edit profile");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse edit profile response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "banned":
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to edit profile");
			}
		}
		if (pfp !== undefined) {
			this.#pfp = pfp;
			localStorage.pfp = this.#pfp;
		}
		if (banner !== undefined) {
			this.#banner = banner;
			localStorage.banner = this.#banner;
		}
		if (privateProfile !== undefined) {
			this.#private = privateProfile;
			localStorage.private = this.#private;
		}
	}

	/**
	 * Follow a user
	 * @param {string} username The username of the user to follow
	 * @returns {Promise<string>} The status of the follow. Can be "followed" or "unfollowed".
	 */
	async followUser(username) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/followuser.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					username
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to follow user");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse follow user response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "unf":
					// TODO: Show popup
					throw new Error("User not found");
				case "banned":
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to follow user");
			}
		}
		return responseJSON.action;
	}

	/**
	 * Remove a follower, or approve/reject a follow request
	 * @param {string} action The action to perform. Can be "remove", "approve", or "reject".
	 * @param {string} username The username of the user to remove/approve/reject
	 * @returns {Promise<void>}
	 */
	async followerAction(action, username) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/followeraction.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					action,
					username
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to perform follower action");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse follower action response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to perform follower action");
			}
		}
	}

	/**
	 * Gets the list of posts
	 * @param {{
	 * 	postsToReturn: number,
	 * 	returnTotalPosts: boolean,
	 * 	returnGlobal: boolean,
	 * 	returnFollowed: boolean,
	 * 	useLastSeenGlobal: boolean,
	 * 	useLastSeenFollowed: boolean
	 * }} options The options for fetching posts.
	 * @returns {Promise<object>} The list of posts, including globalPosts, followedPosts, and totalPosts.
	 */
	async getPosts({ postsToReturn = 20, returnTotalPosts = true, returnGlobal = true, returnFollowed = true, useLastSeenGlobal = true, useLastSeenFollowed = true }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/getposts.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					postsToReturn,
					returnTotalPosts,
					returnGlobal,
					returnFollowed: returnFollowed && this.loggedIn,
					lastSeenGlobalPost: (useLastSeenGlobal) ? this.#lastSeenGlobalPost : undefined,
					lastSeenFollowedPost: (useLastSeenFollowed && returnFollowed && this.loggedIn) ? this.#lastSeenFollowedPost : undefined
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch posts");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse posts response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to fetch posts");
			}
		}
		if (returnGlobal && responseJSON.globalPosts && responseJSON.globalPosts.length > 0) {
			this.#lastSeenGlobalPost = responseJSON.globalPosts[responseJSON.globalPosts.length - 1]?.id;
		}
		if (this.loggedIn && returnFollowed && responseJSON.followedPosts && responseJSON.followedPosts.length > 0) {
			this.#lastSeenFollowedPost = responseJSON.followedPosts[responseJSON.followedPosts.length - 1]?.id;
		}
		return {
			globalPosts: responseJSON.globalPosts,
			followedPosts: responseJSON.followedPosts,
			totalPosts: responseJSON.totalPosts
		};
	}

	/**
	 * Gets a post
	 * @param {string} postId The ID of the post
	 * @returns {Promise<object>} The post
	 */
	async getPost(postId) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/getpost.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					id: postId,
					session: this.#session
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch post");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse post response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "pnfod":
					throw new Error("Post not found");
				default:
					// TODO: Show popup
					throw new Error("Failed to fetch post");
			}
		}
		return responseJSON.post;
	}

	/**
	 * Votes on a post, comment, clip, or clip comment
	 * @param {{
	 *	postId: string,
	 *	commentId: string,
	 *	target: string,
	 *	vote: string
	 * }} options The options for voting. The target can be "post", "comment", "clip", or "clipcomment". The vote can be "upvote" or "downvote".
	 * @returns {Promise<object>} The new number of upvotes and downvotes, and the action taken. The action can be "upvoted", "downvoted", "removed upvote", or "removed downvote".
	 */
	async vote({ postId, commentId, target, vote }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/vote.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					id: postId,
					commentId,
					target,
					vote
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to vote");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse vote response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "banned":
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				case "pnfod":
					throw new Error("Post not found");
				case "cnfod":
					throw new Error("Comment not found");
			}
		}
		return {
			action: responseJSON.action,
			upvotes: responseJSON.upvotes,
			downvotes: responseJSON.downvotes
		};
	}

	/**
	 * Searches for posts, comments, and users on the site
	 * @param {string} query The search query
	 * @returns {Promise<object>} The search results 
	 */
	async search(query) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/search.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					query
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to search");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse search response");
		}
		if (responseJSON.status !== "ok") {
			// TODO: Show popup
			throw new Error("Failed to search");
		}
		return {
			users: responseJSON.results.users,
			clips: responseJSON.results.clips,
			posts: responseJSON.results.posts
		};
	}

	/**
	 * Creates a new post. Title is required. At least content or attachments must be provided, but both can be provided.
	 * @param {string} title The title of the post
	 * @param {{ content: string, attachments: string[], privatePost: boolean }} post The post to create. Must include content or attachments, but both can be provided. Attachments must be an array of attachment URLs.
	 * @returns {Promise<string>} The ID of the new post
	 */
	async newPost(title, { content, attachments, privatePost }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/newpost.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					title,
					content,
					attachments,
					private: privatePost
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to create post");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse create post response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "chill":
					// TODO: Show popup
					throw new Error("Rate limited");
				case "banned":
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to create post");
			}
		}
		return responseJSON.id;
	}

	/**
	 * Posts a new comment on a post
	 * @param {string} postId The ID of the post
	 * @param {{ content: string, attachments: string[] }} comment The comment to post. Must include content or attachments, but both can be provided. Attachments must be an array of attachment URLs.
	 * @returns {Promise<void>}
	 */
	async postComment(postId, { content, attachments }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/postcomment.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					id: postId,
					content,
					attachments
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to post comment");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse post comment response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "chill":
					// TODO: Show popup
					throw new Error("Rate limited");
				case "pnfod":
					throw new Error("Post not found");
				case "banned":
				case "is":
					// TODO: Show popup
					this.this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to post comment");
			}
		}
	}

	/**
	 * Edits a post or comment
	 * @param {{
	 * 	postId: string,
	 * 	commentId: string,
	 * 	target: string,
	 * 	title: string,
	 * 	content: string,
	 * 	attachments: string[],
	 * 	deleted: boolean
	 * 	privatePost: boolean
	 * }} options The options for editing. The target can be "post" or "comment". The title is required for posts. At least content or attachments must be provided, but both can be provided. Attachments must be an array of attachment URLs.
	 * @returns {Promise<void>}
	 */
	async edit({ postId, commentId, target, title, content, attachments, deleted, privatePost }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/edit.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					id: postId,
					commentId,
					target,
					title,
					content,
					attachments,
					deleted,
					private: privatePost
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to edit");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse edit response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "banned":
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
			}
		}
	}

	/**
	 * Gets the list of clips
	 * @param {{
	 * 	clipsToReturn: number,
	 * 	returnTotalClips: boolean,
	 * 	returnGlobal: boolean,
	 * 	returnFollowed: boolean,
	 * 	useLastSeenGlobal: boolean,
	 * 	useLastSeenFollowed: boolean
	 * }} options The options for fetching posts.
	 * @returns {Promise<object>} The list of posts, including globalPosts, followedPosts, and totalPosts.
	 */
	async getClips({ clipsToReturn = 20, returnTotalClips = true, returnGlobal = true, returnFollowed = true, useLastSeenGlobal = true, useLastSeenFollowed = true }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/getclips.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					clipsToReturn,
					returnTotalClips,
					returnGlobal,
					returnFollowed: returnFollowed && this.loggedIn,
					lastSeenGlobalClip: (useLastSeenGlobal) ? this.#lastSeenGlobalClip : undefined,
					lastSeenFollowedClip: (useLastSeenFollowed && returnFollowed && this.loggedIn) ? this.#lastSeenFollowedClip : undefined
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch clips");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse clips response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to fetch clips");
			}
		}
		if (returnGlobal && responseJSON.globalClips && responseJSON.globalClips.length > 0) {
			this.#lastSeenGlobalClip = responseJSON.globalClips[responseJSON.globalClips.length - 1]?.id;
		}
		if (this.loggedIn && returnFollowed && responseJSON.followedClips && responseJSON.followedClips.length > 0) {
			this.#lastSeenFollowedClip = responseJSON.followedClips[responseJSON.followedClips.length - 1]?.id;
		}
		return {
			globalClips: responseJSON.globalClips,
			followedClips: responseJSON.followedClips,
			totalClips: responseJSON.totalClips
		};
	}

	/**
	 * Gets a clip
	 * @param {string} clipId The ID of the clip
	 * @returns {Promise<object>} The clip
	 */
	async getClip(clipId) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/getclip.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					id: clipId
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch clip");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse clip response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "pnfod":
					throw new Error("Clip not found");
				default:
					// TODO: Show popup
					throw new Error("Failed to fetch clip");
			}
		}
		return responseJSON.clip;
	}

	/**
	 * Creates a new clip. Content and description are required.
	 * @param {string} content The content (media URL) of the clip
	 * @param {string} description The description of the clip
	 * @returns {Promise<object>} The new clip
	 */
	async newClip(content, description) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/newclip.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					content,
					description
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to create clip");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse create clip response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "chill":
					// TODO: Show popup
					throw new Error("Rate limited");
				case "banned":
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to create clip");
			}
		}
		return responseJSON.clip;
	}

	/**
	 * Posts a new comment on a clip
	 * @param {string} clipId The ID of the clip
	 * @param {{ content: string }} comment The comment to post
	 * @returns {Promise<void>}
	 */
	async postClipComment(clipId, { content }) {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/postclipcomment.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session,
					id: clipId,
					content
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to post comment");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse post comment response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "chill":
					// TODO: Show popup
					throw new Error("Rate limited");
				case "cnfod":
					throw new Error("Clip not found");
				case "banned":
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to post comment");
			}
		}
	}

	/**
	 * Gets applications
	 * @returns {Promise<object>} List of applications
	 */
	async getApps() {
		let response;
		try {
			response = await fetch(`${this.#host}/v4/developer/getapps.sjs`, {
				method: "post",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					session: this.#session
				})
			});
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to fetch apps");
		}
		let responseJSON;
		try {
			responseJSON = await response.json();
		} catch (e) {
			// TODO: Show popup
			throw new Error("Failed to parse apps response");
		}
		if (responseJSON.status !== "ok") {
			switch (responseJSON.errorCode) {
				case "is":
					// TODO: Show popup
					this.deleteSession();
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to fetch apps");
			}
		}
		return responseJSON.applications;
	}
}
class API {
	#host;
	#cdn;
	#session;
	#username;
	#pfp;
	#banner;
	#lastSeenGlobalPost;
	#lastSeenFollowedPost;

	constructor(environment) {
		switch (environment) {
			default:
			case "development":
				// this.#host = "https://api-dev.stibarc.com";
				// this.#cdn = "https://cdn-dev.stibarc.com";
				this.#host = "https://betaapi.stibarc.com";
				this.#cdn = "https://betacdn.stibarc.com";
				break;
			case "staging":
				this.#host = "https://api-staging.stibarc.com";
				this.#cdn = "https://cdn-staging.stibarc.com";
				break;
			case "production":
				this.#host = "https://api.stibarc.com";
				this.#cdn = "https://cdn.stibarc.com";
				break;
		}
		this.#session = localStorage.sess;
		this.#username = localStorage.username;
		this.#pfp = localStorage.pfp || `${this.#cdn}/pfp/default.png`;
		this.#banner = localStorage.banner;
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

	get defaultBannerUrl() {
		return `${api.cdn}/banner/default.png`;
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
		const sessInfo = await this.getPrivateData();
		this.#username = sessInfo.username;
		this.#pfp = sessInfo.pfp || `${this.#cdn}/pfp/default.png`;
		this.#banner = sessInfo.banner;
		localStorage.username = this.#username;
		localStorage.pfp = this.#pfp;
		localStorage.banner = this.#banner;
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
		delete localStorage.sess;
		delete localStorage.username;
		delete localStorage.pfp;
		this.#session = undefined;
		this.#username = undefined;
		this.#pfp = undefined;
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
			response = await fetch(`${this.#host}/v4/getuser.sjs?username=${username}`);
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
	 * }} newUserDetails The new details of the user. All fields are optional.
	 * @returns {Promise<void>}
	 */
	async editProfile({ pfp, banner, name, email, birthday, bio, pronouns, displayName, displayEmail, displayBirthday, displayBio, displayPronouns, block, displayBlock }) {
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
					displayBlock
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
					throw new Error("Invalid session");
				default:
					// TODO: Show popup
					throw new Error("Failed to follow user");
			}
		}
		return responseJSON.action;
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
			response = await fetch(`${this.#host}/v4/getpost.sjs?id=${postId}`);
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
	 * Votes on a post or comment
	 * @param {{
	 *	postId: string,
	 *	commentId: string,
	 *	target: string,
	 *	vote: string
	 * }} options The options for voting. The target can be "post" or "comment". The vote can be "upvote" or "downvote".
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
			posts: responseJSON.results.posts
		};
	}

	/**
	 * Creates a new post. Title is required. At least content or attachments must be provided, but both can be provided.
	 * @param {string} title The title of the post
	 * @param {{ content: string, attachments: string[] }} post The post to create. Must include content or attachments, but both can be provided. Attachments must be an array of attachment URLs.
	 * @returns {Promise<string>} The ID of the new post
	 */
	async newPost(title, { content, attachments }) {
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
					attachments
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
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
	 * }} options The options for editing. The target can be "post" or "comment". The title is required for posts. At least content or attachments must be provided, but both can be provided. Attachments must be an array of attachment URLs.
	 * @returns {Promise<void>}
	 */
	async edit({ postId, commentId, target, title, content, attachments, deleted }) {
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
					deleted
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
					this.#session = undefined;
					this.#username = undefined;
					this.#pfp = undefined;
					delete localStorage.sess;
					delete localStorage.username;
					delete localStorage.pfp;
					throw new Error("Invalid session");
			}
		}
	}
}
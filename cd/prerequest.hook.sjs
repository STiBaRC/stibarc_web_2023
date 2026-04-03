const sjs = require("sprucehttp_sjs");

(async () => {
	const siteConfig = sjs.siteConfig;

	if (
		sjs.path === "/.well-known/openid-configuration" ||
		sjs.path === "/.well-known/oauth-authorization-server"
	) {
		// Throw in some CORS headers
		siteConfig.headers = {
			"Allow": "GET, HEAD, OPTIONS",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
			"Access-Control-Allow-Headers": "*"
		};
		await sjs.updateConfig(siteConfig);
	}
})().catch(err => {
	console.error("Error in prerequest hook:", err);
}).then(() => {
	process.exit(0);
});
import siteConfig from "../../../website.config.json";

type SiteConfigJson = typeof siteConfig & { keywords?: string[] | string };

export function Metadata() {
	const cfg = siteConfig as SiteConfigJson;
	const kw = cfg.keywords;
	const keywordsContent = Array.isArray(kw) ? kw.join(", ") : kw ?? "";

	return (
		<>
			<title>{siteConfig.name}</title>
			<meta name="description" content={siteConfig.description} />
			<meta name="keywords" content={keywordsContent} />

			{/* Open Graph */}
			<meta property="og:title" content={siteConfig.name} />
			<meta property="og:description" content={siteConfig.description} />
			<meta property="og:image" content={siteConfig.ogImage} />
			<meta property="og:url" content={siteConfig.url} />
			<meta property="og:type" content="website" />

			{/* Twitter */}
			<meta name="twitter:card" content={siteConfig.twitter.card} />
			<meta name="twitter:site" content={siteConfig.twitter.site} />
			<meta name="twitter:title" content={siteConfig.name} />
			<meta name="twitter:description" content={siteConfig.description} />
			<meta name="twitter:image" content={siteConfig.ogImage} />

			{/* Theme */}
			<meta name="theme-color" content={siteConfig.themeColor} />
		</>
	);
}

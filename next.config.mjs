/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // GitHub Pages deployment: set the basePath to your repo name.
  // Uncomment and replace with your repo name if deploying to:
  //   https://<username>.github.io/<repo-name>/
  // For local development, comment this out:
  basePath: process.env.NODE_ENV === 'production' ? '/tcgcard' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

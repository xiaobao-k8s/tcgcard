/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // GitHub Pages deployment: set the basePath to your repo name.
  // Uncomment and replace with your repo name if deploying to:
  //   https://<username>.github.io/<repo-name>/
  // basePath: "/tcgcard",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

# ProductVision AI — Marketing Studio

A static, GitHub Pages-ready product marketing mockup app. Upload one product photo, select marketing placements, and generate a sequence of visuals with Google's Gemini image generation models (Nano Banana family).

## Features
- Product photo upload (PNG/JPG/WEBP, max 10 MB) and drag-and-drop
- Coffee mug, T-shirt, billboard, packaging, phone ad and store display scenes
- Sequential consistency workflow: every image receives the canonical original product image; later images also receive the previous generated frame as a continuity reference
- Download individual images or all generated assets
- Responsive layout, dark/light theme, English/Hindi/Odia/Bengali/Spanish UI labels
- PWA manifest, service worker and install prompt
- Static admin demo and local-session asset library
- Node automated tests and GitHub Actions workflow

## Run locally
Requires Node.js 20+ for tests. The app itself is static and can be opened through any local static server.

```bash
npm test
npx http-server . -p 4173
```
Open `http://localhost:4173`.

## Gemini setup
1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Upload your product image in ProductVision AI.
3. Paste the key into the Gemini API key field.
4. Choose a Nano Banana model and generate.

Default model: `gemini-3.1-flash-image` (Nano Banana 2). Other available choices are Nano Banana Pro (`gemini-3-pro-image`) and Nano Banana 2 Lite (`gemini-3.1-flash-lite-image`). Model availability, billing, quotas, and regional access are controlled by Google and can change. See [official image generation documentation](https://ai.google.dev/gemini-api/docs/image-generation).

**Security:** This GitHub Pages demo sends the API request directly from the browser to Google's Gemini API. The key is kept in JavaScript memory and is not written to local storage, but it is visible to the browser session and browser developer tools. Use a dedicated key, restrict it where possible, monitor usage, and do not share the browser/device. A public multi-user production service should proxy requests through a backend with authentication, rate limits, quotas, and server-side secret storage.

## Deploy to GitHub Pages
1. Create a GitHub repository, for example `productvision-ai`.
2. Upload all files and folders from this project to the repository root.
3. In **Settings → Pages**, choose **GitHub Actions** as the build/deployment source.
4. The included `.github/workflows/pages.yml` deploys the static site on every push to `main`.
5. Open the Pages URL shown by GitHub. If your default branch is not `main`, edit the workflow trigger branch.

No build step is needed. All asset paths are relative so the site works under a GitHub project subpath.

## Tests
Run `npm test`. The workflow runs the same test suite before deployment.

## Admin demo limitations
The admin page is a visual static demo. Real login, user management, billing, campaign persistence, analytics, audit trails, and secure API-key proxying require a backend/database and are not implemented in GitHub Pages.

## Product consistency notes
The app explicitly instructs the model to preserve the original product identity and uses the prior generated image as an additional visual reference on subsequent frames. Generative models can still alter small text, logos, geometry, or details; inspect every result before publishing or printing. Exact pixel-perfect consistency cannot be guaranteed.

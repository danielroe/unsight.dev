# unsight.dev browser extension

A browser extension (work in progress) that enhances GitHub issue pages by adding a "Similar Issues" section to the issue header. This feature helps users discover related issues more easily.

## Installation

From the root of the monorepo, run:

```bash
pnpm install
```

### Development

To start the development server, run:

```bash
pnpm -F webext dev
pnpm -F web dev # to run the API locally
```

or

```bash
pnpm dev # to run both the API and the extension
```

When building the project locally copy the .env.example file to .env.local and fill in the required values:

```bash
VITE_UNSIGHT_DOT_DEV_BASE_URL="http://localhost:3000"
```

Then **load extension in browser with the `extension/` folder**.

For Firefox developers, you can run the following command instead:

```bash
pnpm -F web dev
pnpm -F webext dev-firefox
```

`web-ext` auto reload the extension when `extension/` files changed.

> While Vite handles HMR automatically in the most of the case, [Extensions Reloader](https://chrome.google.com/webstore/detail/fimgfedafeadlieiabdeeaodndnlbhid) is still recommended for cleaner hard reloading.

### Build

To build the extension, run

```bash
pnpm -F webext build
```

ensure you have a .env file for the production build or pass the values as environment variables.

And then pack files under `extension`, you can upload `extension.crx` or `extension.xpi` to appropriate extension store.

## Credits

Thanks to [Anthony Fu](https://github.com/antfu) for the web browser extension template [https://antfu-collective/vitesse-webext](https://github.com/antfu-collective/vitesse-webext) that this project is based on.

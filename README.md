# unsight.dev

> Detect duplicate GitHub issues, areas of concern and more across related repositories

<p align="center">
  <a href="https://unsight.dev/" target="_blank">
    <img width="1090" alt="Screenshot of unsight.dev showing a cluster of issues on nuxt/nuxt" src="https://github.com/user-attachments/assets/281b5167-eef6-4e08-be50-a6ff047c613b">
  </a>
</p>

- [👉 &nbsp;Check it out](https://unsight.dev/)

## ✨ Features

- Built on [Nuxt](https://nuxt.com/)
- [Nitro server API routes](https://nuxt.com/docs/guide/concepts/server-engine#server-engine)
- [GitHub API](https://docs.github.com/en/rest) and a [GitHub App](https://docs.github.com/en/apps/creating-github-apps)
- [UnoCSS](https://unocss.dev/)
- Deployed on [Cloudflare](https://cloudflare.com/) with [NuxtHub](https://hub.nuxt.com/), using [Workers AI](https://developers.cloudflare.com/workers-ai/#_top), [Workers KV](https://developers.cloudflare.com/kv/#_top) and [Vectorize](http://developers.cloudflare.com/vectorize/)

## 🛝 Try it out locally

You can try the app out locally (for tweaking the UI) using the deployed API.

```
corepack enable
pnpm i
pnpm dev --ui-only
```

This will fire up a dev server but use the remote API to populate it.

## 🚧 Development environment

Setting up a full development environment takes a little extra effort because `unsight.dev` is implemented as a GitHub App. Here's how to set things up.

### Setup

```sh
corepack enable
pnpm i
```

### Start a local tunnel

```sh
npx ngrok http 3000
```

Note the URL under `Forwarding`. It should look something like `https://<GUID>.ngrok-free.app/`. We'll use this in the next step.

### Create a GitHub App for development

1. Navigate to the [GitHub Apps Settings panel](https://github.com/settings/apps) and click 'New GitHub App'.

1. Fill out the form, not changing any defaults:

  - **GitHub App name**: Pick any name at all. I normally add `[dev]` at the end of any apps I'm using in development only.
  - **Homepage URL**: Doesn't matter; just pick a URL: `https://unsight.dev` would be fine.
  - **Setup URL**: `http://localhost:3000`. Tick the 'Redirect on update' checkbox underneath.
  - **Webhook URL**: Put the URL you got when starting ngrok, plus `/github/webhook`: `https://<GUID>.ngrok-free.app/github/webhook`. For the 'Secret' field underneath the URL, create a random GUID or password and make a note of it.
  - **Repository permissions**: Select 'Issues': 'Read-only'.
  - **Subscribe to events**: Select 'Installation target', 'Issues', 'Meta' and 'Repository'.

1. Note down the `App ID:` in your GitHub App settings.

1. Note the 'slug' of your GitHub App. You should be at a URL that looks something like this `https://github.com/settings/apps/unsight-dev`. This last piece (`unsight-dev`) is your app slug.

1. Scroll down to the bottom of the GitHub App setings and click 'Generate a private key'. It should download. Unfortunately this private key is in PKCS#1 format, but we need PKCS#8 in a Cloudflare environment. Run the following command:

```sh
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in <path to the downloaded file>.pem -out <path to your repo>-unsight-pkcs8.key
```

(This outputs a private key file you'll use in the next step.)

### Configure your secrets

Create a `.env` file with the following content (the private key was generated in the last step and can be multi-line, just add a quote before and after it):

```ini
NUXT_WEBHOOK_GITHUB_SECRET_KEY=<random GUID or password you put in the Webhook Secret field when creating your GitHub App>
NUXT_PUBLIC_GITHUB_APP_SLUG=<your app slug you saw in the URL of your GitHub App settings>
NUXT_GITHUB_APP_ID=<GitHub App ID you saw in your GitHub App settings>
NUXT_GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvcIBADAEBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoABADDbja1oaWVufjdT
...
+qWpvAnlgrGQqvbsuY+XuRnt
-----END PRIVATE KEY-----"
```

### Link your Cloudflare account

We use Workers AI and to do that locally we'll need to hook up to Cloudflare. This project uses [NuxtHub](https://hub.nuxt.com/) to do that. You can get going by creating a free NuxtHub account at https://admin.hub.nuxt.com.

Then run this command in your app directory:

```sh
npx nuxthub link
```

You can select 'Create a new project'. Any storage region should be fine. Your Nuxt dev server should restart, and you'll see a new `NUXT_HUB_PROJECT_KEY` variable in your `.env` file.

You can now visit http://localhost:3000 and click 'Install as a GitHub app'.

You can now directly visit `http://localhost:3000/<your-user-name>/<your-repo>` to view your clusters.

## Preset repo
For local development, you can preset repo(s) using `PRESET_REPOS`.

```ini
PRESET_REPOS=nuxt/nuxt,nitrojs/nitro
```
The preset repo(s) will be indexed at startup.

## License

Made with ❤️

Published under [MIT License](./LICENCE).

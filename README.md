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

## License

Made with ❤️

Published under [MIT License](./LICENCE).

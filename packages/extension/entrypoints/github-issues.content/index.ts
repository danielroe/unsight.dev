import { createApp } from 'vue'
import App from './App.vue'
import 'uno.css'

const watchPattern = new MatchPattern('*://github.com/*/*/issues/*')

export default defineContentScript({
  matches: [
    '*://github.com/*',
  ],
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: '[data-testid=issue-viewer-metadata-container] h2:nth-of-type(2)',
      append: 'after',
      onMount: (container) => {
        const app = createApp(App)
        app.mount(container)
        return app
      },
      onRemove: (app) => {
        app?.unmount()
      },
    })

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      if (watchPattern.includes(newUrl))
        ui.mount()
      else
        ui.remove()
    })

    if (watchPattern.includes(window.location.href)) {
      ui.autoMount()
      window.addEventListener('load', () => ui.mount())
    }
  },
})

import { createApp } from 'vue'
import { setupApp } from '~/logic/common-setup'
import App from './views/App.vue'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // Function to initialize the app when the element is found
  const initializeApp = () => {
    // We can check the path, but a getElementById is a fast check
    // Note that with GitHub, they change the UI occasionally so this might break
    const issueHeader = document.getElementById('partial-discussion-header')
    if (!issueHeader) {
      return
    }

    // mount component to context window
    const container = document.createElement('div')

    // mount the app in the GitHub issue header
    issueHeader.lastChild?.after(container)

    container.id = __NAME__
    const root = document.createElement('div')
    const styleEl = document.createElement('link')
    const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
    styleEl.setAttribute('rel', 'stylesheet')
    styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
    shadowDOM.appendChild(styleEl)
    shadowDOM.appendChild(root)

    const app = createApp(App)
    setupApp(app)
    app.mount(root)

    console.info('unsight.dev browser extension loaded')
  }

  document.addEventListener('turbo:load', () => {
    initializeApp()
  })
})()

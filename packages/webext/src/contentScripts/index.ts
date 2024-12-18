/* eslint-disable no-console */
import { onMessage } from 'webext-bridge/content-script'
import { createApp } from 'vue'
import App from './views/App.vue'
import { setupApp } from '~/logic/common-setup'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  console.info('[vitesse-webext] Hello world from content script')

  // Function to initialize the app when the element is found
  const initializeApp = () => {
    // We can check the path, but a getElementById is a fast check
    // Note that with GitHub, they change the UI occasionally so this might break
    const issueHeader = document.getElementById('partial-discussion-header')
    if (!issueHeader)
      return

    // communication example: send previous tab title from background page
    onMessage('tab-prev', ({ data }) => {
      console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
    })

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
  }

  // Listen for Turbo navigation events
  document.addEventListener('turbo:load', () => {
    console.log('[vitesse-webext] Turbo navigation detected')
    initializeApp()
  })

  // Initial check if we're coming from a full server-side page load
  initializeApp()
})()

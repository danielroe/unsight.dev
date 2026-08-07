export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'fetch-similar-issues' && message.url) {
      fetch(message.url, { signal: AbortSignal.timeout(5000) })
        .then(res => res.ok ? res.json().then(issues => ({ issues })) : { error: `Request failed with status ${res.status}` })
        .catch(error => ({ error: error instanceof Error ? error.message : String(error) }))
        .then(sendResponse)
      return true // keep the message channel open for async response
    }
  })
})

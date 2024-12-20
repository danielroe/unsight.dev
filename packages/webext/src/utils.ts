/**
 * Check if the url is a github issue page
 *
 * @param url
 * @returns true if the url is a github issue page, false otherwise
 */
export function isGithubIssuePage(url: string): boolean {
  const githubIssueRegex = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+$/

  return githubIssueRegex.test(url)
}

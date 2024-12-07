import type { RestEndpointMethodTypes } from '@octokit/rest'

export type Issue = RestEndpointMethodTypes['issues']['get']['response']['data']

export function getLabels(issue: Issue) {
  return issue.labels.map(label => (typeof label === 'string' ? label : label.name!).toLowerCase()).filter(Boolean)
}

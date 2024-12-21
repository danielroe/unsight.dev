import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SimilarIssue from '../../src/components/SimilarIssue.vue'

describe('similar issue component', () => {
  it('should render', () => {
    const wrapper = mount(SimilarIssue, {
      props: {
        issue: {
          owner: 'nuxt',
          repository: 'nuxt',
          number: 26798,
          title: 'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
          url: 'https://github.com/nuxt/nuxt/issues/26798',
          updated_at: '2024-12-12',
          labels: ['bug'],
          score: 0.87,
        },
      },
    })

    expect(wrapper.html()).toMatchInlineSnapshot(`
      "<article class="flex flex-row gap-2 leading-tightest"><span class="flex-shrink-0 inline-block w-5 h-5 i-tabler-circle-dot text-green-500"></span>
        <div class="flex flex-row gap-2 flex-wrap md:flex-nowrap md:pb-6 flex-grow"><a href="https://github.com/nuxt/nuxt/issues/26798" target="_blank" class="issue-link"><span class="sr-only">View issue: </span>FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory</a>
          <div class="text-xs relative md:absolute md:mt-6 text-gray-700"><a aria-current="page" href="https://unsight.dev/nuxt/nuxt" class="no-underline hover:underline color-current">nuxt</a> · updated <relative-time datetime="2024-12-12"></relative-time> · <a href="https://unsight.dev/nuxt/nuxt" class="no-underline hover:underline color-current">87.00% similar </a></div>
        </div>
      </article>"
    `)
  })
})

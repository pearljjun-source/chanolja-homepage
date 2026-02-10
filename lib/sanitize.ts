/**
 * HTML 살균 모듈
 * XSS 공격을 방지하기 위해 사용자 입력 HTML에서 위험한 태그/속성 제거
 */

import sanitizeHtml from 'sanitize-html'

/**
 * HTML 콘텐츠에서 위험한 태그와 속성을 제거
 * - script, iframe, form, input 등 실행 가능한 태그 제거
 * - onclick, onerror 등 이벤트 핸들러 제거
 * - javascript: 프로토콜 차단
 */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 's', 'del',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  })
}

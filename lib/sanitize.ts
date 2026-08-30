import sanitizeHtml from 'sanitize-html'

const ALLOWED_IFRAME_HOSTS = ['www.youtube.com', 'player.vimeo.com']

export const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'iframe', 'pre', 'code',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    '*': ['class', 'id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  exclusiveFilter: (frame) => {
    if (frame.tag !== 'iframe') return false
    const src = frame.attribs.src || ''
    try {
      const host = new URL(src).hostname
      return !ALLOWED_IFRAME_HOSTS.includes(host)
    } catch {
      return true // malformed/relative src on an iframe — drop it
    }
  },
}

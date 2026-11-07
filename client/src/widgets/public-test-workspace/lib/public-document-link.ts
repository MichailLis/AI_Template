export const getPublicDocumentLinkProps = (url: string) =>
  /^https?:\/\//i.test(url) ? ({ target: '_blank', rel: 'noreferrer' } as const) : ({} as const);

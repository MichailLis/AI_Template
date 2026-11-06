interface PublicLinkOption {
  id: number;
}

/** Выбранная ссылка, если она есть в списке, иначе первая; `null` для пустого списка. */
export const resolveEffectivePublicLinkId = (
  selectedPublicLinkId: number | null,
  links: PublicLinkOption[],
) => {
  if (links.length === 0) {
    return null;
  }

  if (selectedPublicLinkId && links.some((link) => link.id === selectedPublicLinkId)) {
    return selectedPublicLinkId;
  }

  return links[0].id;
};

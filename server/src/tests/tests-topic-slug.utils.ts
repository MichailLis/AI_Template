import { PrismaService } from '../prisma.service';
import { normalizeSlug } from './tests-domain.utils';

export const ensureUniqueTopicSlug = async (prisma: PrismaService, baseSlug: string) => {
  const normalized = normalizeSlug(baseSlug) || 'topic';

  const existing = await prisma.testTopic.findMany({
    where: {
      slug: {
        startsWith: normalized,
      },
    },
    select: { slug: true },
  });

  const used = new Set(existing.map((item) => item.slug));

  if (!used.has(normalized)) {
    return normalized;
  }

  let index = 2;
  while (used.has(`${normalized}-${index}`)) {
    index += 1;
  }

  return `${normalized}-${index}`;
};

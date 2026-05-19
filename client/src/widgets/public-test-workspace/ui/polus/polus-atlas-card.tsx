import { ExternalLink } from 'lucide-react';

export function PolusAtlasCard({ url }: { url: string }) {
  return (
    <section className="polus-method-card" aria-label="Атлас профессий">
      <span className="polus-method-label">Дополнительно</span>
      <h2>Атлас профессий</h2>
      <p>Можно отдельно посмотреть описания профессий и спрос на них в подключенном атласе.</p>
      <a
        className="polus-secondary-action polus-atlas-action"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Перейти в атлас профессий
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </section>
  );
}

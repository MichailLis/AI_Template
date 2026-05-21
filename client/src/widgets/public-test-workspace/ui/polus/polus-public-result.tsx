import { Download } from 'lucide-react';

import {
  parseAnalysisResult,
  parseProfOrientationSummary,
  polusAssets,
  ProfOrientationResult,
} from '@/features/tests';

import { PolusAtlasCard } from './polus-atlas-card';
import { PolusPublicLayout } from './polus-public-layout';

import type { AnalysisResult } from '@/features/tests';
import type { PublicSessionResultResponseDto } from '@/shared/api/model';

interface PolusPublicResultProps {
  result: PublicSessionResultResponseDto;
}

const fallbackDirections = [
  { name: 'Конструирование БПЛА', score: 86, description: 'Системное инженерное проектирование' },
  { name: 'Программирование БПЛА', score: 78, description: 'Алгоритмы и управление' },
  { name: '3D-моделирование', score: 72, description: 'Пространственное мышление' },
];

const handleExportPdf = () => {
  window.print();
};

const getTopSkills = (analysis: AnalysisResult | null) => {
  const items =
    analysis?.skillsLevel.items
      .filter((item) => typeof item.score === 'number')
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
      .slice(0, 3)
      .map((item) => ({
        name: item.name,
        score: item.score ?? 0,
        description: item.description,
      })) ?? [];

  return items.length > 0 ? items : fallbackDirections;
};

const getProfileTitle = (analysis: AnalysisResult | null) =>
  analysis?.thinkingType.type
    ? `Ваш профиль: ${analysis.thinkingType.type}`
    : 'Ваш профиль: исследователь решений';

const getProfileDescription = (analysis: AnalysisResult | null) =>
  analysis?.thinkingType.description ??
  analysis?.introduction ??
  'Вы хорошо видите устройство системы целиком и можете связывать идеи, данные и практические шаги в одно решение.';

function PolusResultHero({ analysis }: { analysis: AnalysisResult | null }) {
  return (
    <div className="polus-result-hero" aria-label="Профессор Полюс рассказывает результат">
      <div className="polus-result-message">
        <p className="polus-speaker-label">Профессор Полюс говорит:</p>
        <h1>{getProfileTitle(analysis)}</h1>
        <p>{getProfileDescription(analysis)}</p>
      </div>
      <div className="polus-result-professor" aria-hidden="true">
        <div className="polus-result-speech-bubble">
          <span className="polus-result-speech-dot" />
          <span className="polus-result-speech-dot" />
          <span className="polus-result-speech-dot" />
        </div>
        <div className="polus-result-professor-meta">
          <img className="polus-result-professor-figure" src={polusAssets.professor} alt="" />
          <span className="polus-result-professor-name">Профессор Полюс</span>
        </div>
      </div>
    </div>
  );
}

function PolusResultTiles({ analysis }: { analysis: AnalysisResult | null }) {
  const topSkills = getTopSkills(analysis);

  return (
    <div className="polus-result-grid">
      {topSkills.map((skill) => (
        <div className="polus-result-tile" key={skill.name}>
          <strong>{Math.round(skill.score)}%</strong>
          <span>{skill.name}</span>
        </div>
      ))}
    </div>
  );
}

function PolusProfileCard({ analysis }: { analysis: AnalysisResult | null }) {
  const topSkills = getTopSkills(analysis);
  const topSkill = topSkills[0];
  const strengths = analysis?.thinkingType.strengths ?? [
    'Мыслит системой целиком и замечает связи между подсистемами.',
    'Сильнее раскрывается в задачах с технической логикой и архитектурой решения.',
    'Подходит для проектирования, сборки и проверки сложных инженерных систем.',
  ];

  return (
    <section className="polus-profile-card" aria-label="Расширенный профиль участника">
      <div className="polus-profile-heading">
        <span>Ведущее направление</span>
        <h3>{topSkill.name}</h3>
        <p>{topSkill.description}</p>
      </div>
      <ul className="polus-profile-bullets">
        {strengths.slice(0, 4).map((strength) => (
          <li key={strength}>{strength}</li>
        ))}
      </ul>
    </section>
  );
}

function PolusMatchCard({ analysis }: { analysis: AnalysisResult | null }) {
  const topSkills = getTopSkills(analysis);

  return (
    <section className="polus-method-card" aria-label="Совпадение с направлениями">
      <span className="polus-method-label">Совпадение с направлениями</span>
      <div className="polus-match-list">
        {topSkills.map((skill) => (
          <div className="polus-match-row" key={skill.name}>
            <strong>{skill.name}</strong>
            <span>{Math.round(skill.score)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PolusPublicResult({ result }: PolusPublicResultProps) {
  const profOrientationSummary = parseProfOrientationSummary(result.analysis.summary);
  const parsedAnalysis = parseAnalysisResult(result.analysis.summary);

  return (
    <PolusPublicLayout view="result">
      <section className="polus-test-stage polus-result-stage">
        <div className="polus-state-view">
          <div className="polus-result-layout">
            <p className="polus-section-label">Персональная карта развития</p>
            {profOrientationSummary ? (
              <ProfOrientationResult
                professionAtlasUrl={result.professionAtlasUrl}
                summary={profOrientationSummary}
              />
            ) : (
              <>
                <PolusResultHero analysis={parsedAnalysis} />
                <PolusResultTiles analysis={parsedAnalysis} />
                <PolusProfileCard analysis={parsedAnalysis} />
                <PolusMatchCard analysis={parsedAnalysis} />
              </>
            )}

            {!profOrientationSummary && result.professionAtlasUrl ? (
              <PolusAtlasCard url={result.professionAtlasUrl} />
            ) : null}

            <div className="polus-result-actions">
              <button className="polus-primary-action" type="button" onClick={handleExportPdf}>
                Скачать результат
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PolusPublicLayout>
  );
}

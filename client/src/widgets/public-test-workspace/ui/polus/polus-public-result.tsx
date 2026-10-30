import { Download } from 'lucide-react';

import {
  parseAnalysisResult,
  parseProfOrientationSummary,
  PolusResultHero,
  ProfOrientationResult,
} from '@/entities/public-test';

import { PolusAtlasCard } from './polus-atlas-card';
import { PolusPublicLayout } from './polus-public-layout';

import type { AnalysisResult, ProfOrientationSummary } from '@/entities/public-test';
import type { PublicSessionResultResponseDto } from '@/shared/api/model';

interface PolusPublicResultProps {
  result: PublicSessionResultResponseDto;
}

interface PolusSkill {
  name: string;
  score: number;
  description: string;
}

const handleExportPdf = () => {
  window.print();
};

const getTopSkills = (analysis: AnalysisResult): PolusSkill[] =>
  analysis.skillsLevel.items
    .filter((item) => typeof item.score === 'number')
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
    .slice(0, 3)
    .map((item) => ({
      name: item.name,
      score: item.score ?? 0,
      description: item.description,
    }));

function PolusResultTiles({ skills }: { skills: PolusSkill[] }) {
  return (
    <div className="polus-result-grid">
      {skills.map((skill) => (
        <div className="polus-result-tile" key={skill.name}>
          <strong>{Math.round(skill.score)}%</strong>
          <span>{skill.name}</span>
        </div>
      ))}
    </div>
  );
}

function PolusProfileCard({ skill, strengths }: { skill: PolusSkill; strengths: string[] }) {
  return (
    <section className="polus-profile-card" aria-label="Расширенный профиль участника">
      <div className="polus-profile-heading">
        <span>Ведущее направление</span>
        <h3>{skill.name}</h3>
        <p>{skill.description}</p>
      </div>
      <ul className="polus-profile-bullets">
        {strengths.slice(0, 4).map((strength) => (
          <li key={strength}>{strength}</li>
        ))}
      </ul>
    </section>
  );
}

function PolusMatchCard({ skills }: { skills: PolusSkill[] }) {
  return (
    <section className="polus-method-card" aria-label="Совпадение с направлениями">
      <span className="polus-method-label">Совпадение с направлениями</span>
      <div className="polus-match-list">
        {skills.map((skill) => (
          <div className="polus-match-row" key={skill.name}>
            <strong>{skill.name}</strong>
            <span>{Math.round(skill.score)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PolusLegacyAnalysis({ analysis }: { analysis: AnalysisResult }) {
  const skills = getTopSkills(analysis);

  return (
    <>
      <PolusResultHero
        headline={`Ваш профиль: ${analysis.thinkingType.type}`}
        professorSummary={analysis.thinkingType.description || analysis.introduction}
      />
      {skills.length > 0 ? (
        <>
          <PolusResultTiles skills={skills} />
          <PolusProfileCard skill={skills[0]} strengths={analysis.thinkingType.strengths} />
          <PolusMatchCard skills={skills} />
        </>
      ) : null}
    </>
  );
}

/** Без расчёта и без разбираемого анализа ученик видит правду, а не выдуманный профиль. */
function PolusNoResult({ failed }: { failed: boolean }) {
  return (
    <div className="polus-result-hero" role={failed ? 'alert' : 'status'}>
      <div className="polus-result-message">
        <h1>{failed ? 'Не удалось сформировать анализ' : 'Ответы сохранены'}</h1>
        <p>
          {failed
            ? 'Ваши ответы сохранены. Обратитесь к администратору теста.'
            : 'Результат для этого теста не предусмотрен или его передаст преподаватель.'}
        </p>
      </div>
    </div>
  );
}

function PolusResultBody({
  result,
  profOrientationSummary,
  parsedAnalysis,
}: {
  result: PublicSessionResultResponseDto;
  profOrientationSummary: ProfOrientationSummary | null;
  parsedAnalysis: AnalysisResult | null;
}) {
  if (profOrientationSummary) {
    return (
      <ProfOrientationResult
        professionAtlasUrl={result.professionAtlasUrl}
        summary={profOrientationSummary}
      />
    );
  }

  return parsedAnalysis ? (
    <PolusLegacyAnalysis analysis={parsedAnalysis} />
  ) : (
    <PolusNoResult failed={result.analysis.status === 'FAILED'} />
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
            <PolusResultBody
              result={result}
              profOrientationSummary={profOrientationSummary}
              parsedAnalysis={parsedAnalysis}
            />

            {!profOrientationSummary && result.professionAtlasUrl ? (
              <PolusAtlasCard url={result.professionAtlasUrl} />
            ) : null}

            {profOrientationSummary || parsedAnalysis ? (
              <div className="polus-result-actions">
                <button className="polus-primary-action" type="button" onClick={handleExportPdf}>
                  Скачать результат
                  <Download className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PolusPublicLayout>
  );
}

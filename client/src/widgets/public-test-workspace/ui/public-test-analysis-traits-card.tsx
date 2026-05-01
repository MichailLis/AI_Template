import { useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import type { AnalysisTraitScore } from './public-test-analysis.types';

interface PublicTestAnalysisTraitsCardProps {
  traits: AnalysisTraitScore[];
}

interface RadarGeometry {
  chartSize: number;
  chartCenter: number;
  chartRadius: number;
  labelRadius: number;
  labelFontSize: number;
}

interface RadarTrait {
  key: string;
  label: string;
  axisPoint: { x: number; y: number };
  valuePoint: { x: number; y: number };
  labelPoint: { x: number; y: number };
}

interface RadarSvgProps {
  geometry: RadarGeometry;
  radarTraits: RadarTrait[];
  valuePolygon: string;
}

const defaultChartSize = 360;
const minChartSize = 300;
const maxChartSize = 420;
const minChartRadius = 74;
const maxChartRadius = 144;
const minLabelFontSize = 8;
const labelGap = 14;
const horizontalLabelPadding = 14;
const verticalLabelPadding = 18;
const gridLevels = [0.2, 0.4, 0.6, 0.8, 1] as const;

const clamp = (value: number, min: number, max: number) => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

const estimateLabelWidth = (label: string, fontSize: number) => {
  const safeLength = Math.max(1, label.trim().length);
  return safeLength * fontSize * 0.56;
};

const getPreferredLabelFontSize = (chartSize: number, longestLabelLength: number) => {
  const base = chartSize >= 370 ? 12 : 11;

  if (longestLabelLength >= 17) {
    return base - 2;
  }

  if (longestLabelLength >= 13) {
    return base - 1;
  }

  return base;
};

const toPoint = (center: number, angle: number, radius: number) => ({
  x: center + Math.cos(angle) * radius,
  y: center + Math.sin(angle) * radius,
});

const getTextAnchor = (x: number, center: number) => {
  if (x < center - 6) {
    return 'end';
  }

  if (x > center + 6) {
    return 'start';
  }

  return 'middle';
};

const getLabelBounds = (
  center: number,
  angle: number,
  radius: number,
  label: string,
  labelFontSize: number,
) => {
  const point = toPoint(center, angle, radius + labelGap);
  const textAnchor = getTextAnchor(point.x, center);
  const width = estimateLabelWidth(label, labelFontSize);
  const halfHeight = labelFontSize * 0.58;

  if (textAnchor === 'start') {
    return {
      left: point.x,
      right: point.x + width,
      top: point.y - halfHeight,
      bottom: point.y + halfHeight,
    };
  }

  if (textAnchor === 'end') {
    return {
      left: point.x - width,
      right: point.x,
      top: point.y - halfHeight,
      bottom: point.y + halfHeight,
    };
  }

  return {
    left: point.x - width / 2,
    right: point.x + width / 2,
    top: point.y - halfHeight,
    bottom: point.y + halfHeight,
  };
};

const labelsFitInside = (
  chartSize: number,
  chartCenter: number,
  chartRadius: number,
  labelFontSize: number,
  traits: AnalysisTraitScore[],
) => {
  return traits.slice(0, 6).every((trait, index, array) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / array.length;
    const bounds = getLabelBounds(chartCenter, angle, chartRadius, trait.label, labelFontSize);

    return (
      bounds.left >= horizontalLabelPadding &&
      bounds.right <= chartSize - horizontalLabelPadding &&
      bounds.top >= verticalLabelPadding &&
      bounds.bottom <= chartSize - verticalLabelPadding
    );
  });
};

const resolveGeometry = (chartSize: number, traits: AnalysisTraitScore[]): RadarGeometry => {
  const chartCenter = chartSize / 2;
  const half = chartSize / 2;

  const longestLabelLength = Math.max(
    0,
    ...traits.slice(0, 6).map((trait) => trait.label.trim().length),
  );
  const radiusCap = Math.min(maxChartRadius, half - 24);
  const preferredLabelFontSize = getPreferredLabelFontSize(chartSize, longestLabelLength);

  for (
    let labelFontSize = preferredLabelFontSize;
    labelFontSize >= minLabelFontSize;
    labelFontSize -= 1
  ) {
    for (let chartRadius = radiusCap; chartRadius >= minChartRadius; chartRadius -= 1) {
      if (labelsFitInside(chartSize, chartCenter, chartRadius, labelFontSize, traits)) {
        return {
          chartSize,
          chartCenter,
          chartRadius,
          labelRadius: chartRadius + labelGap,
          labelFontSize,
        };
      }
    }
  }

  return {
    chartSize,
    chartCenter,
    chartRadius: minChartRadius,
    labelRadius: minChartRadius + labelGap,
    labelFontSize: minLabelFontSize,
  };
};

const buildRadarTraits = (traits: AnalysisTraitScore[], geometry: RadarGeometry): RadarTrait[] => {
  return traits.slice(0, 6).map((trait, index, array) => {
    const maxValue = trait.maxValue > 0 ? trait.maxValue : 100;
    const ratio = clamp(trait.value / maxValue, 0, 1);
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / array.length;

    return {
      key: trait.key,
      label: trait.label,
      axisPoint: toPoint(geometry.chartCenter, angle, geometry.chartRadius),
      valuePoint: toPoint(geometry.chartCenter, angle, geometry.chartRadius * ratio),
      labelPoint: toPoint(geometry.chartCenter, angle, geometry.labelRadius),
    };
  });
};

function RadarSvg({ geometry, radarTraits, valuePolygon }: RadarSvgProps) {
  return (
    <svg viewBox={`0 0 ${geometry.chartSize} ${geometry.chartSize}`} className="h-auto w-full">
      {gridLevels.map((level) => {
        const points = radarTraits
          .map((trait) => {
            const point = {
              x: geometry.chartCenter + (trait.axisPoint.x - geometry.chartCenter) * level,
              y: geometry.chartCenter + (trait.axisPoint.y - geometry.chartCenter) * level,
            };

            return `${point.x},${point.y}`;
          })
          .join(' ');

        return (
          <polygon
            key={`grid-${level}`}
            points={points}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.9}
          />
        );
      })}

      {radarTraits.map((trait) => (
        <line
          key={`axis-${trait.key}`}
          x1={geometry.chartCenter}
          y1={geometry.chartCenter}
          x2={trait.axisPoint.x}
          y2={trait.axisPoint.y}
          stroke="hsl(var(--border))"
          strokeWidth={1}
          opacity={0.85}
        />
      ))}

      <polygon
        points={valuePolygon}
        fill="hsl(var(--primary))"
        fillOpacity={0.18}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />

      {radarTraits.map((trait) => (
        <circle
          key={`dot-${trait.key}`}
          cx={trait.valuePoint.x}
          cy={trait.valuePoint.y}
          r={3.2}
          fill="hsl(var(--primary))"
        />
      ))}

      {radarTraits.map((trait) => (
        <text
          key={`label-${trait.key}`}
          x={trait.labelPoint.x}
          y={trait.labelPoint.y}
          textAnchor={getTextAnchor(trait.labelPoint.x, geometry.chartCenter)}
          dominantBaseline="middle"
          fill="hsl(var(--foreground))"
          opacity={0.78}
          fontSize={geometry.labelFontSize}
        >
          {trait.label}
        </text>
      ))}
    </svg>
  );
}

export function PublicTestAnalysisTraitsCard({ traits }: PublicTestAnalysisTraitsCardProps) {
  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(defaultChartSize);

  useEffect(() => {
    const element = chartWrapRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.round(element.clientWidth);
      if (nextWidth > 0) {
        setAvailableWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      }
    };

    const initialFrame = window.requestAnimationFrame(updateWidth);

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => {
        window.requestAnimationFrame(updateWidth);
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.cancelAnimationFrame(initialFrame);
        window.removeEventListener('resize', handleResize);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      observer.disconnect();
    };
  }, []);

  const chartSize = clamp(availableWidth, minChartSize, maxChartSize);
  const geometry = useMemo(() => resolveGeometry(chartSize, traits), [chartSize, traits]);
  const radarTraits = useMemo(() => buildRadarTraits(traits, geometry), [traits, geometry]);
  const valuePolygon = radarTraits
    .map((trait) => `${trait.valuePoint.x},${trait.valuePoint.y}`)
    .join(' ');

  return (
    <Card className="h-full border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-lg">Personality Profile</CardTitle>
        <p className="text-sm text-muted-foreground">Your skill & trait distribution</p>
      </CardHeader>
      <CardContent className="pt-1">
        {radarTraits.length > 2 ? (
          <div ref={chartWrapRef} className="mx-auto w-full">
            <RadarSvg geometry={geometry} radarTraits={radarTraits} valuePolygon={valuePolygon} />
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-4 text-sm text-muted-foreground">
            Недостаточно данных для построения профиля.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

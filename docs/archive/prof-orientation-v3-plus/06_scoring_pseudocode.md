# Псевдокод подсчёта результата v3

```js
const DIRECTIONS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

function scoreTest(answers, sliders) {
  let scores = Object.fromEntries(DIRECTIONS.map((d) => [d, 0]));
  let selectedCounts = Object.fromEntries(DIRECTIONS.map((d) => [d, 0]));
  let overchoiceQuestions = 0;

  for (const question of questions) {
    const selected = answers[question.id] || [];
    if (selected.length === 0) continue;

    if (selected.length > 2) overchoiceQuestions += 1;

    const maxPoints = question.points_per_answer * 2;
    const pointsPerSelected =
      selected.length <= 2 ? question.points_per_answer : maxPoints / selected.length;

    for (const direction of selected) {
      scores[direction] += pointsPerSelected;
      selectedCounts[direction] += 1;
    }
  }

  for (const slider of interestSliders) {
    scores[slider.direction] += sliders[slider.id] * 1.1;
  }

  for (const slider of readinessSliders) {
    for (const [direction, weight] of Object.entries(slider.weights)) {
      scores[direction] += sliders[slider.id] * weight * 0.55;
    }
  }

  for (const direction of DIRECTIONS) {
    const interestValue = sliders[`S_${direction}`];
    if (selectedCounts[direction] >= 3 && interestValue >= 7) scores[direction] += 2;
    else if (selectedCounts[direction] >= 2 && interestValue >= 6) scores[direction] += 1;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top1 = ranked[0][0];
  const top2 = ranked[1][0];
  const gap = ranked[0][1] - ranked[1][1];

  const result = classifyResult({
    scores,
    ranked,
    top1,
    top2,
    gap,
    selectedCounts,
    sliders,
    overchoiceQuestions,
  });
  return result;
}
```

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@6/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.5/+esm";

export async function createHistogram(wikiId) {
  const response = await fetch(
    `https://project-x-back-a4ab947e69c6.herokuapp.com/histogram/co-occurrence?id=${wikiId}`
  );
  const data = await response.json();
  const main_entity = data.main_entity?.sentiments_extended;
  const negatives = main_entity
    .map((d) => -d?.negative)
    .filter((d) => d?.negative != 0);
  const positives = main_entity
    .map((d) => d?.positive)
    .filter((d) => d?.positive != 0);

  const positiveBinGenerator = d3.bin().domain([0.001, 1]).thresholds(20);
  const negativeBinGenerator = d3.bin().domain([-1, -0.001]).thresholds(20);

  const binsPositives = positiveBinGenerator(positives);
  const binsNegatives = negativeBinGenerator(negatives);

  const chart = Plot.plot({
    x: {
      label: "Value Range (0 to 1)",
      domain: [-1, 1],
    },
    y: {
      label: "Occurrence Count",
    },
    marks: [
      Plot.rectY(binsPositives, {
        x1: (d) => d.x0,
        x2: (d) => d.x1,
        y: (d) => d.length,
        fill: "green",
        title: "Positive Values",
      }),
      Plot.rectY(binsNegatives, {
        x1: (d) => d.x0,
        x2: (d) => d.x1,
        y: (d) => d.length,
        fill: "red",
        title: "Negative Values",
      }),
      Plot.ruleY([0]),
    ],
    width: 800,
    height: 400,
  });

  return chart;
}

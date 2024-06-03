---
title: Wiki Page
toc: false
sidebar: false
---

```html
<style>
  #tooltip {
    position: absolute;
    text-align: center;
    width: 120px;
    height: auto;
    padding: 5px;
    font: 12px sans-serif;
    background: lightsteelblue;
    border: 0px;
    border-radius: 8px;
    pointer-events: none;
    display: none;
  }

  #info-box {
    margin-top: 20px;
    border: 1px solid black;
    padding: 10px;
    width: 300px;
  }
</style>
```

<div class="">
  <div id="tableContainer"></div>
  <div class="card">
    <h2>Graph</h2>
    <div id="graph">
      <div id="tooltip"></div>
    </div>
    <div id="info-box">
        <h3>Node Information</h3>
        <p id="node-info"></p>
    </div>
  </div>
  <div class="card">
    <div id="neighbours"></div>
  </div>
  <div class="card">
    <h2>Sentiment Occurrence Count</h2>
    <div id="histogram_2"></div>
  </div>
</div>

```js
function getWikiInfo(wiki_id) {
  return fetch(
    `https://project-x-back-a4ab947e69c6.herokuapp.com/wiki-info?id=${wiki_id}`
  )
    .then((response) => response.json())
    .then((data) => data)
    .catch((error) => {
      console.error("Error fetching wiki info:", error);
      return { description: "Error loading description" };
    });
}

function updateDescriptions(rowsMap) {
  rowsMap.forEach((cell, wiki_id) => {
    getWikiInfo(wiki_id).then((data) => {
      cell.textContent = data.description || "No description available";
    });
  });
}

function updateInstanceOf(rowsMap) {
  rowsMap.forEach((cell, wiki_id) => {
    getWikiInfo(wiki_id).then((data) => {
      cell.textContent = data.instance_of || "No instance of available";
    });
  });
}
```

```js
const base = document.getElementById("base");
const histogram = document.getElementById("histogram");
const histogram_2 = document.getElementById("histogram_2");
const urlParams = new URLSearchParams(window.location.search);
const wiki_id = urlParams.get("id");

async function fetchFeatureExtractionJSON(wikiId) {
  const response = await fetch(
    `https://project-x-back-a4ab947e69c6.herokuapp.com/general-info?id=${wikiId}`
  );
  return response.json();
}

if (!wiki_id) {
  histogram.textContent = "No wiki ID provided, please provide a wiki id";
}

document.title = `Wiki ID: ${wiki_id}`;

function updateTableData(table) {
  const tBody = table.querySelector("tbody");
  const rows = tBody.querySelectorAll("tr");

  Array.from(rows).forEach((row) => {
    const nameCell = row.querySelector("td:last-child");
    const instanceOfCell = row.querySelector("td:nth-last-child(2)");
    const descriptionCell = row.querySelector("td:nth-last-child(3)");

    if (
      nameCell &&
      descriptionCell.textContent == "Loading..." &&
      instanceOfCell.textContent == "Loading..." &&
      !row.hasAttribute("data-loading")
    ) {
      const wiki_id = nameCell.textContent;
      row.setAttribute("data-loading", "true"); // Add data attribute
      getWikiInfo(wiki_id).then((data) => {
        descriptionCell.textContent =
          data.description || "No description available";
        instanceOfCell.textContent =
          data.instance_of || "No instance of available";
        row.removeAttribute("data-loading"); // Remove data attribute
      });
    }
  });
}

fetchFeatureExtractionJSON(wiki_id).then((data) => {
  const most_occurred_entities = data.most_occurred_entities;
  const tableData = most_occurred_entities.map((entity) => {
    return {
      name: entity.name,
      occurrence_count: entity.n,
      description: "Loading...",
      instance_of: "Loading...",
      wiki_id: entity.wiki_id,
    };
  });

  const tableContainer = document.getElementById("tableContainer");
  tableContainer.innerHTML = "";
  const table = Inputs.table(tableData, {
    columns: [
      "occurrence_count",
      "name",
      "description",
      "instance_of",
      "wiki_id",
    ],
    header: {
      occurrence_count: "Count",
      name: "Entity Name",
      description: "Description",
      instance_of: "Instance Of",
      wiki_id: "Wiki ID",
    },
    format: {
      wiki_id: (value) => {
        return value.toString();
      },
    },
    width: {
      occurrence_count: 30,
      name: 100,
      description: 200,
      instance_of: 150,
      wiki_id: 0,
    },
  });

  tableContainer.appendChild(table);
  const descriptionCells = table.querySelectorAll("tbody td:nth-last-child(3)");
  const instanceOfCells = table.querySelectorAll("tbody td:nth-last-child(2)");
  descriptionCells.forEach((cell) => {
    cell.style.whiteSpace = "normal";
    cell.style.overflow = "visible";
  });
  instanceOfCells.forEach((cell) => {
    cell.style.whiteSpace = "normal";
    cell.style.overflow = "visible";
  });

  table.addEventListener("scroll", () => {
    updateTableData(table);
  });

  const rows = table.querySelectorAll("tbody tr td input");
  rows.forEach((row) => {
    row.parentNode.parentNode.style.backgroundColor = "white";
    row.addEventListener("click", () => {
      row.parentNode.parentNode.style.backgroundColor =
        row.parentNode.parentNode.style.backgroundColor == "white"
          ? "aliceblue"
          : "white";
    });
  });

  const allSelect = table.querySelector("thead tr th input");
  allSelect.style.display = "none";

  updateTableData(table);

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
    width: 1200,
    height: 600,
  });
  document.getElementById("histogram_2").appendChild(chart);
});
```

```js
import { createForceGraph } from "./components/graph.js";

function enableZoomAndPanGraph() {
  const svg = d3.select("#graph svg");

  const gElementsInSVG = svg.selectAll("g");
  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 8])
    .on("zoom", (event) => {
      gElementsInSVG.attr("transform", event.transform);
    });

  svg.call(zoom);
}

const graphContainer = document.getElementById("graph");

/*
{
                            nodes: [
                                {
                                    id: int,
                                    name: str,
                                    type: str
                                }
                            ],
                            links: [
                                {
                                    source: int,
                                    target: int,
                                    type: str
                                }
                            ]
                        }
 */

createForceGraph(wiki_id)
  .then((svg) => {
    // First clear the graph container to prevent multiple graphs from being displayed
    graphContainer.innerHTML = "";
    // Append the SVG to the container
    graphContainer.appendChild(svg);
    enableZoomAndPanGraph();
  })
  .catch((error) => {
    console.error("Error fetching graph data:", error);
    graphContainer.textContent = "Error loading graph data";
  });
```

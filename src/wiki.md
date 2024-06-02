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
  <div class="card">
    <h2>Most Occurred Entities Table</h2>
    <div id="tableContainer"></div>
    <div style="display: flex; align-items: center; justify-content: center;">
    <button id="prev-page" style=" border: none; background-color: #f2f2f2;"><</button>
    <span id="current-page" style="color: blue; background-color: #f2f2f2;">1</span>
    <button id="next-page" style=" border: none; background-color: #f2f2f2;">></button>
    </div>
  </div>
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
function createTable(data) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  table.style.maxWidth = "100%";

  const headerRow = document.createElement("tr");
  const headers = ["Occurrence Count", "Name", "Description", "Instance Of"];
  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.textContent = headerText;
    th.style.border = "1px solid black";
    th.style.padding = "10px";
    th.style.backgroundColor = "#f2f2f2";
    th.style.textAlign = "left";
    th.style.fontWeight = "bold";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Map to store row elements by wiki_id for later updating
  const rowsMap = new Map();
  const rowsMapInfo = new Map();

  data.forEach((item) => {
    const row = document.createElement("tr");

    const cellCount = document.createElement("td");
    cellCount.textContent = item.n;
    cellCount.style.border = "1px solid black";
    cellCount.style.padding = "10px";
    row.appendChild(cellCount);

    const cellName = document.createElement("td");
    cellName.textContent = item.name;
    cellName.style.border = "1px solid black";
    cellName.style.padding = "10px";
    row.appendChild(cellName);

    const cellDescription = document.createElement("td");
    cellDescription.textContent = "Loading..."; // Placeholder text
    cellDescription.style.border = "1px solid black";
    cellDescription.style.padding = "10px";
    row.appendChild(cellDescription);

    const cellInstanceOf = document.createElement("td");
    cellInstanceOf.textContent = "Loading..."; // Placeholder text
    cellInstanceOf.style.border = "1px solid black";
    cellInstanceOf.style.padding = "10px";
    row.appendChild(cellInstanceOf);

    tbody.appendChild(row);

    // Store the description cell in the map with wiki_id as the key
    rowsMap.set(item.wiki_id, cellDescription);
    rowsMapInfo.set(item.wiki_id, cellInstanceOf);
  });

  table.appendChild(tbody);
  return { table, rowsMap, rowsMapInfo };
}
```

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

async function fetchHumanOccurrenceHistogramData(wikiId) {
  const response = await fetch(
    `https://project-x-back-a4ab947e69c6.herokuapp.com/histogram/occurrence?id=${wikiId}`
  );
  return response.json();
}

async function fetchMostOccurredEntities(wikiId, page_number = 1) {
  const response = await fetch(
    `https://project-x-back-a4ab947e69c6.herokuapp.com/most-occurred-entities?id=${wikiId}&page_number=${page_number}`
  );
  return response.json();
}

async function fetchFeatureExtractionJSON(wikiId) {
  const response = await fetch(
    `https://project-x-back-a4ab947e69c6.herokuapp.com/histogram/co-occurrence?id=${wikiId}`
  );
  return response.json();
}

function updatePageButtons() {
  const prevPageButton = document.getElementById("prev-page");
  const nextPageButton = document.getElementById("next-page");
  const currentPageSpan = document.getElementById("current-page");

  prevPageButton.disabled = currentPage === 1;
  prevPageButton.style.color = currentPage === 1 ? "black" : "blue";
  nextPageButton.disabled = currentPage === maxPage;
  nextPageButton.style.color = currentPage === maxPage ? "black" : "blue";
  currentPageSpan.textContent = currentPage;
}

if (!wiki_id) {
  histogram.textContent = "No wiki ID provided, please provide a wiki id";
}

let currentPage = 1;
let maxPage = 2;
document.getElementById("prev-page").addEventListener("click", () => {
  currentPage--;
  updatePageButtons();
  upsertTable();
});

document.getElementById("next-page").addEventListener("click", () => {
  currentPage++;
  updatePageButtons();
  upsertTable();
});

document.title = `Wiki ID: ${wiki_id}`;

let rowsMap = new Map();
let rowsMapInfo = new Map();

function upsertTable() {
  fetchMostOccurredEntities(wiki_id, currentPage).then((data) => {
    const most_occurred_entities = data.most_occurred_entities;
    const tableContainer = document.getElementById("tableContainer");
    maxPage = data.max_page;
    let table = tableContainer.querySelector("table");

    if (!table) {
      // Table doesn't exist, create it
      const result = createTable(most_occurred_entities);
      table = result.table;
      rowsMap = result.rowsMap;
      rowsMapInfo = result.rowsMapInfo;
      tableContainer.appendChild(table);
    } else {
      // Table exists, update it

      tableContainer.removeChild(table);
      const result = createTable(most_occurred_entities);
      table = result.table;
      rowsMap = result.rowsMap;
      rowsMapInfo = result.rowsMapInfo;
      tableContainer.appendChild(table);
    }

    updateDescriptions(rowsMap);
    updateInstanceOf(rowsMapInfo);
  });
}

function updateRows(data, rowsMap, rowsMapInfo) {
  data.forEach((item) => {
    const cellDescription = rowsMap.get(item.wiki_id);
    const cellInstanceOf = rowsMapInfo.get(item.wiki_id);

    if (cellDescription && cellInstanceOf) {
      cellDescription.textContent = item.description || "Loading...";
      cellInstanceOf.textContent = item.instanceOf || "Loading...";
    }
  });
}

updatePageButtons();
upsertTable();

fetchFeatureExtractionJSON(wiki_id).then((data) => {
  const most_occurred_entities = data.most_occurred_entities;
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

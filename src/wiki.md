---
title: Wiki
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

  #tableContainer form table thead tr th {
    pointer-events: none;
  }

  not-active {
    display: none;
  }

  .graph-overflow {
    overflow: hidden;
  }
</style>
```

<div id="main-heading" style="display: flex; justify-content: center; align-items: center; flex-direction: column">
  <h1>Wiki: </h1>
</div>

<div class="grid grid-cols-3">
    <div id="infobox" class="card grid-colspan-1 grid-rowspan-2">
        <h2>Infobox</h2>
    </div> 
    <div id="tableContainer" class="card grid-colspan-2 grid-rowspan-2">
        <h2>Co-occurrence Count Table</h2>
    </div>
    <div id="graph" class="card grid-colspan-2 grid-rowspan-3 graph-overflow">
        <h2>Graph</h2>
        <div id="tooltip"></div>
    </div>
    <div id="info-box" class="card grid-colspan-1 grid-rowspan-1">
        <h2>Current Node Info</h2>
        <p id="node-info"></p>
    </div>
    <div id="neighbours" class="card grid-colspan-1 grid-rowspan-2">
        <h2>Neighbours Table</h2>
    </div>
</div>
<div class="grid grid-cols-3">
    <div id="sentiment-histogram" class="card grid-colspan-2 grid-rowspan-1">
        <h2>Sentiment Histogram</h2>
    </div>
    <div class="not-active grid-colspan-1 grid-rowspan-1">
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

async function getFirstParagraph(title, defualt_description) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro&explaintext&titles=${title}`;
    const response = await fetch(url);
    const data = await response.json();

    const page = Object.values(data.query.pages)[0];
    const description = page.extract
        ? page.extract.split("\n")[0]
        : defualt_description;

    return description;
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
import * as Inputs from "@observablehq/inputs";
import * as Plot from "@observablehq/plot";
import * as htl from "htl";

const base = document.getElementById("base");
const histogram = document.getElementById("histogram");
const histogramContainer = document.getElementById("sentiment-histogram");
const urlParams = new URLSearchParams(window.location.search);
const wiki_id = urlParams.get("id");

async function fetchFeatureExtractionJSON(wikiId) {
  const response = await fetch(
    `https://project-x-back-a4ab947e69c6.herokuapp.com/general-info?id=${wikiId}`
  );
  return response.json();
}

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
```

```js
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

  const mainEntity = data.main_entity;
  const mainEntityName = mainEntity?.name;
  if (mainEntityName) {
    document.title = "Wiki: " + mainEntityName;
    const mainHeading = document.getElementById("main-heading");
    mainHeading.innerHTML = `<h1>Wiki: ${mainEntityName}</h1>`;
  }

  const infobox = document.getElementById("infobox");
  infobox.innerHTML = `<h2>Infobox</h2>`;
  getWikiInfo(wiki_id).then((data2) => {
    infobox.innerHTML += `<hr>`;
    infobox.innerHTML += `<h2><strong>${data.main_entity?.name}</strong></h2>`;
    getFirstParagraph(data.main_entity?.name, data2.description).then((description) => {
      infobox.innerHTML += `<p>${description}</p>`;
      infobox.innerHTML += `<p><h2>Instance Of</h2>${data2.instance_of}</p>`;
    });  
  });

  const tableContainer = document.getElementById("tableContainer");

  tableContainer.innerHTML = "<h2>Co-occurrence Count Table</h2>";
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
      wiki_id: "Wiki",
    },
    format: {
      wiki_id: (value) =>
        htl.html`<a href="http://hocamsimdi.com.tr/wiki?id=${value}">${value}</a>`,
    },
    width: {
      occurrence_count: 30,
      name: 100,
      description: 200,
      instance_of: 120,
      wiki_id: 60
    }, 
      rows:20,
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

  const allSelect = table.querySelector("thead tr th input");
  allSelect.style.display = "none";

  updateTableData(table);

  
  let main_entity = data.main_entity?.sentiments_extended;
  if (main_entity.length == 1) {
    console.warn("No sentiment data found");
    main_entity = data.most_occurred_entities[0]?.sentiments_extended;
  }

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
      label: "Value Range (-1 to 1)",
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
    width: 600,
    height: 300,
  });

  const histogramContainer = document.getElementById("sentiment-histogram");
  histogramContainer.appendChild(chart);
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

createForceGraph(wiki_id)
  .then((svg) => {
    graphContainer.innerHTML = "<h2>Graph</h2>";
    graphContainer.appendChild(svg);
    enableZoomAndPanGraph();
  })
  .catch((error) => {
    console.error("Error fetching graph data:", error);
    graphContainer.textContent = "Error loading graph data, please try again";
  });
```

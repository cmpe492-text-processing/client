---
title: Wiki Page
toc: false
sidebar: false
---


<div class="grid grid-cols-12">
  <div class="card">
    <h2>Most Occurred Entities Table</h2>
    <div id="tableContainer"></div>
  </div>
  <div class="card">
    <h2>Sentiment Occurrence Count</h2>
    <div id="histogram_2"></div>
  </div>
  <div class="card">
    <h2>Occurrence Histogram</h2>
    <div id="histogram"></div>
  </div>
  <div class="card">
    <h2>Graph</h2>
    <div id="graph"></div>
  </div>
</div>

```js
    
   function createTable(data) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    table.style.maxWidth = '100%';
    
    const headerRow = document.createElement('tr');
    const headers = ['Occurrence Count', 'Name', 'Description', 'Instance Of'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.border = '1px solid black';
        th.style.padding = '10px';
        th.style.backgroundColor = '#f2f2f2';
        th.style.textAlign = 'left';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Map to store row elements by wiki_id for later updating
    const rowsMap = new Map();
    const rowsMapInfo = new Map();

    data.forEach(item => {
        const row = document.createElement('tr');

        const cellCount = document.createElement('td');
        cellCount.textContent = item.n;
        cellCount.style.border = '1px solid black';
        cellCount.style.padding = '10px';
        row.appendChild(cellCount);

        const cellName = document.createElement('td');
        cellName.textContent = item.name;
        cellName.style.border = '1px solid black';
        cellName.style.padding = '10px';
        row.appendChild(cellName);

        const cellDescription = document.createElement('td');
        cellDescription.textContent = 'Loading...';  // Placeholder text
        cellDescription.style.border = '1px solid black';
        cellDescription.style.padding = '10px';
        row.appendChild(cellDescription);
        
        const cellInstanceOf = document.createElement('td');
        cellInstanceOf.textContent = 'Loading...';  // Placeholder text
        cellInstanceOf.style.border = '1px solid black';
        cellInstanceOf.style.padding = '10px';
        row.appendChild(cellInstanceOf);

        tbody.appendChild(row);

        // Store the description cell in the map with wiki_id as the key
        rowsMap.set(item.wiki_id, cellDescription);
        rowsMapInfo.set(item.wiki_id, cellInstanceOf);
    });

    table.appendChild(tbody);
    return {table, rowsMap, rowsMapInfo};
}

```

```js

function getWikiInfo(wiki_id) {
    return fetch(`http://127.0.0.1:5000/wiki-info?id=${wiki_id}`)
        .then(response => response.json())
        .then(data => data)
        .catch(error => {
            console.error('Error fetching wiki info:', error);
            return {description: 'Error loading description'};
        });
}

function updateDescriptions(rowsMap) {
    rowsMap.forEach((cell, wiki_id) => {
        getWikiInfo(wiki_id).then(data => {
            cell.textContent = data.description || 'No description available';
        });
    });
}

function updateInstanceOf(rowsMap) {
    rowsMap.forEach((cell, wiki_id) => {
        getWikiInfo(wiki_id).then(data => {
            cell.textContent = data.instance_of || 'No instance of available';
        });
    });
}

```

```js
const base = document.getElementById('base');
const histogram = document.getElementById('histogram');
const histogram_2 = document.getElementById('histogram_2');
const urlParams = new URLSearchParams(window.location.search);
const wiki_id = urlParams.get('id');

async function fetchHumanOccurrenceHistogramData(wikiId) {
    const response = await fetch(`http://127.0.0.1:5000/histogram/occurrence?id=${wikiId}`);
    return response.json();
    
}

async function fetchFeatureExtractionJSON(wikiId) {
    const response = await fetch(`http://127.0.0.1:5000/histogram/co-occurrence?id=${wikiId}`);
    return response.json();
    
}

if (!wiki_id) {
    histogram.textContent = 'No wiki ID provided, please provide a wiki id';
}

document.title = `Wiki ID: ${wiki_id}`;
    
fetchFeatureExtractionJSON(wiki_id).then(data => {
const most_occurred_entities = data.most_occurred_entities;
const main_entity = data.main_entity?.sentiments_extended;
const negatives = main_entity.map(d => -d?.negative).filter(d => d?.negative != 0)
const positives = main_entity.map(d => d?.positive).filter(d => d?.positive != 0)
    
const tableContainer = document.getElementById('tableContainer');
const {table, rowsMap, rowsMapInfo} = createTable(most_occurred_entities);
updateDescriptions(rowsMap);
updateInstanceOf(rowsMapInfo);
tableContainer.appendChild(table);

const positiveBinGenerator = d3.bin().domain([0.001, 1]).thresholds(20);
const negativeBinGenerator = d3.bin().domain([-1, -0.001]).thresholds(20);

const binsPositives = positiveBinGenerator(positives);
const binsNegatives = negativeBinGenerator(negatives);

const chart = Plot.plot({
    x: {
        label: "Value Range (0 to 1)",
        domain: [-1, 1]
    },
    y: {
        label: "Occurrence Count"
    },
    marks: [
        Plot.rectY(binsPositives, {
            x1: d => d.x0,
            x2: d => d.x1,
            y: d => d.length,
            fill: "green",
            title: "Positive Values",
        }),
        Plot.rectY(binsNegatives, {
            x1: d => d.x0,
            x2: d => d.x1,
            y: d => d.length,
            fill: "red",
            title: "Negative Values"
        }),
        Plot.ruleY([0])
    ],
    width: 1200,
    height: 600,
});
document.getElementById('histogram_2').appendChild(chart);

most_occurred_entities.forEach(entity => {
    data = getWikiInfo(entity.wiki_id).then(data => {
        
    })
}); });
    
    
```



```js
import { createForceGraph } from "./components/graph.js";

const graphContainer = document.getElementById('graph');

// fetch from /graph?id=wiki_id endpoint, the result is a JSON object
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


createForceGraph(wiki_id, (event, d) => {
    console.log('Node clicked:', d);
}).then(graph => {
    graphContainer.appendChild(graph);
}).catch(error => {
    console.error('Error fetching graph data:', error);
    graphContainer.textContent = 'Error loading graph data';
});

```

---
title: "Project X"
toc: false
sidebar: false
---

<style>
    #part-of-speech {
    }

    .part-of-speech-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .results-sentiment-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .part-of-speech-active {
        max-width: 100%;
        height: 100%;
        padding: 10px;
        overflow: hidden;
        background-color: #0000;
        border-radius: 5px; 
        border: 1px solid #ccc;
    }
    @media (max-width: 768px) {
        .svg-container {
            height: 400px; /* Adjust height for smaller devices */
        }
    }


    .svg-container {
        max-width: 100%;
        height: 600px;    /* Sufficient height to display SVG */
        border: 2px solid #1111; /* Solid green border */
        border-radius: 8px; /* Rounded corners */
        box-shadow: 0 4px 8px rgba(0,0,0,0); /* Subtle shadow for depth */
        background-color: #f9f9f9; /* Light grey background */
        overflow-x: auto; /* Allows horizontal scrolling */
        overflow-y: hidden; /* Disables vertical scrolling */
        padding: 20px; /* Padding inside the container for some spacing around the SVG */
    }
</style>

<script src="https://d3js.org/d3.v7.min.js"></script>

<div style="display: flex; justify-content: center; align-items: center; flex-direction: column">
    <h1>Search any sentence</h1>
    <br>
    <input type="text" id="search-bar" placeholder="Donald Trump called Joe Biden 'Dumb Joe'" style="width: 100%; padding: 10px; font-size: 16px;  box-shadow: 0 5px 2px rgba(0,0,0,0.1);">
    <br>
    <br>
</div>
<div id="results-table" style="font-size: xx-large; display: flex; justify-content: center; align-items: center;" ></div>
<br>
<br/>
<div class="part-of-speech-container">
<div id="part-of-speech" class=`svg-container display-none`></div>
</div>
<br>
<div class="results-sentiment-container">
<div id="results-sentiment"></div>
</div>
<br/>

```js
function sentimentChart(data, { width }) {
  return Plot.plot({
    width: width,
    height: 500,
    marginTop: 20,
    marginLeft: 50,
    y: { domain: [-1, 1], grid: true, label: "Score" },
    x: { domain: data.map((d) => d.sentiment), label: null },
    marks: [
      Plot.barY(data, { x: "sentiment", y: "score", fill: "color", tip: true }),
      Plot.ruleY([0]),
    ],
  });
}

function enableZoomAndPan() {
  const svg = d3.select("#part-of-speech svg");
  const container = d3.select("#part-of-speech");

  // Select both 'g' and 'text' elements
  const elements = svg.selectAll(".displacy-token, .displacy-arrow");

  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 8]) // Limits for zoom scaling (0.5x to 8x)
    .on("zoom", (event) => {
      elements.attr("transform", event.transform); // Apply transformations to both 'g' and 'text' elements
    });

  container.call(zoom);
}

document
  .getElementById("search-bar")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      const query = event.target.value;
      fetch(
        `https://project-x-back-a4ab947e69c6.herokuapp.com/search?q=${encodeURIComponent(
          query
        )}`
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Search results:", data);
          const results_sentiment =
            document.getElementById("results-sentiment");
          const results_table = document.getElementById("results-table");
          results_sentiment.innerHTML = "";
          results_table.innerHTML = "";

          const plotData = [
            {
              sentiment: " Compound",
              score: data.scores.compound,
              color: data.scores.compound >= 0 ? "#4caf50" : "#f44336",
            },
            {
              sentiment: " Positive",
              score: data.scores.pos,
              color: "#2196f3",
            },
            {
              sentiment: " Negative",
              score: -data.scores.neg,
              color: "#f44336",
            },
            { sentiment: " Neutral", score: data.scores.neu, color: "#ffeb3b" },
          ];

          const containerWidth = d3
            .select("#part-of-speech")
            .node()
            .getBoundingClientRect().width;
          const chartWidth = containerWidth * 0.5; // 50% of the container's width

          const chart = sentimentChart(plotData, { width: chartWidth });

          const text = data.text;
          const entities = data.entities;
          const textDiv = document.createElement("div");

          let i = 0;
          entities.forEach((entity) => {
            textDiv.innerHTML += text.slice(i, entity.begin);
            const link = document.createElement("a");
            link.href = `https://hocamsimdi.netlify.app/wiki?id=${entity.wiki_id}`;
            link.textContent = entity.mention;
            textDiv.appendChild(link);
            i = entity.end;
          });
          textDiv.innerHTML += text.slice(i);
          results_table.appendChild(textDiv);
          results_sentiment.appendChild(chart);

          const url = `https://project-x-back-a4ab947e69c6.herokuapp.com/part-of-speech?q=${encodeURIComponent(
            query
          )}`;

          fetch(url)
            .then((response) => {
              if (response.status === 204) {
                console.error("Empty query");
                return;
              }
              if (!response.ok) {
                throw new Error("Network response was not ok");
              }
              return response.text();
            })
            .then((svg) => {
              const container = document.getElementById("part-of-speech");
              container.classList.remove("display-none"); // Remove the 'display-none' class
              container.classList.add("display-block"); // Add the 'display-block' class
              container.classList.add("part-of-speech-active"); // Add the 'part-of-speech-active' class
              const width = svg.match(/width="(\d+)"/)[1] + "px"; // Extract the width from the SVG
              container.style.width = width;

              container.innerHTML = svg; // Insert the SVG directly into the div
              enableZoomAndPan(); // Enable zoom and pan after SVG is loaded
            })
            .catch((error) =>
              console.error(
                "There was a problem with the fetch operation:",
                error
              )
            );
        })
        .catch((error) =>
          console.error("Error fetching search results:", error)
        );
    }
  });
```

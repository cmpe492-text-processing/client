import * as d3 from "https://cdn.jsdelivr.net/npm/d3@6/+esm";

export async function createForceGraph(wikiId) {
  try {
    const response = await fetch(
      `https://project-x-back-a4ab947e69c6.herokuapp.com/graph?id=${wikiId}`
    );
    const data = await response.json();

    console.log("Fetched data:", data); // Debugging line

    if (!data.nodes || !data.links) {
      throw new Error("Data format error: 'nodes' or 'links' is missing");
    }

    const nodes = data.nodes.map((d) => ({
      id: d.id,
      title: d.name,
      sentiment: +d.sentiment,
    }));

    const links = data.links.map((d) => ({
      source: d.source,
      target: d.target,
      thickness: +d.thickness,
      weight: +d.weight,
    }));

    const onClick = (event, d) => {
      const infoBox = document.getElementById("node-info");
      infoBox.innerHTML = `ID: ${d.id}<br>Name: ${d.title}<br>Sentiment: ${d.sentiment}`;
      const neighboursTable = document.getElementById("neighbours");
      const neighbours = links.filter(
        (l) => l.source === d.id || l.target === d.id
      );
      const neighbourNodesWithWeights = neighbours.map((l) => {
        const neighbour = l.source === d.id ? l.target : l.source;
        return { ...nodes.find((n) => n.id === neighbour), weight: l.weight };
      });

      const neighbourNodesWithWeightsSorted = neighbourNodesWithWeights.sort(
        (a, b) => b.weight - a.weight
      );

      // Clear the existing content
      neighboursTable.innerHTML = "";

      // Create and append the heading
      const heading = document.createElement("h2");
      heading.textContent = `Neighbours of the node ${d.title}`;
      neighboursTable.appendChild(heading);

      // Create the table
      const table = document.createElement("table");
      table.style.width = "100%";

      // Create the table header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      ["Name", "Sentiment", "Weight"].forEach((text) => {
        const th = document.createElement("th");
        th.style.border = "1px solid black";
        th.style.padding = "10px";
        th.style.backgroundColor = "#f2f2f2";
        th.style.textAlign = "left";
        th.style.fontWeight = "bold";
        th.textContent = text;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create the table body
      const tbody = document.createElement("tbody");
      tbody.id = "neighbours-table";
      neighbourNodesWithWeightsSorted.forEach((n) => {
        const tr = document.createElement("tr");
        [n.title, n.sentiment, n.weight].forEach((text) => {
          const td = document.createElement("td");
          td.style.border = "1px solid black";
          td.style.padding = "10px";
          td.textContent = text;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      // Append the table to the neighboursTable
      neighboursTable.appendChild(table);
    };

    const graph = ForceGraph(
      {
        nodes,
        links,
      },
      {
        nodeId: (d) => d.id,
        nodeGroup: (d) => (d.sentiment > 0 ? "positive" : "negative"),
        nodeTitle: (d) => `${d.title}\nSentiment: ${d.sentiment}`,
        linkStrokeWidth: (l) => l.thickness,
        width: 800,
        height: 600,
        onClick: onClick, // Pass the click handler
      }
    );

    return graph;
  } catch (error) {
    console.error("Error in createForceGraph:", error);
    throw error; // Rethrow the error after logging it
  }
}

// Define the ForceGraph function
function ForceGraph({ nodes, links }, options = {}) {
  let {
    nodeId = (d) => d.id,
    nodeGroup,
    nodeGroups,
    nodeTitle,
    nodeFill = "currentColor",
    nodeStroke = "#fff",
    nodeStrokeWidth = 1.5,
    nodeStrokeOpacity = 1,
    nodeRadius = 5,
    nodeStrength,
    linkSource = ({ source }) => source,
    linkTarget = ({ target }) => target,
    linkStroke = "#999",
    linkStrokeOpacity = 0.6,
    linkStrokeWidth = 1.5,
    linkStrokeLinecap = "round",
    linkStrength,
    colors = d3.schemeTableau10,
    width = 640,
    height = 400,
    invalidation,
    onClick, // Add onClick option
  } = options;

  const N = d3.map(nodes, nodeId).map(intern);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);
  const W =
    typeof linkStrokeWidth !== "function"
      ? null
      : d3.map(links, linkStrokeWidth);
  const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

  nodes = d3.map(nodes, (_, i) => ({
    id: N[i],
    title: nodes[i].title,
    sentiment: nodes[i].sentiment,
  }));
  links = d3.map(links, (_, i) => ({
    source: LS[i],
    target: LT[i],
    thickness: links[i].thickness,
    weight: links[i].weight,
  }));

  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  const forceNode = d3.forceManyBody();
  const forceLink = d3.forceLink(links).id(({ index: i }) => N[i]);
  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
  if (linkStrength !== undefined) forceLink.strength(linkStrength);

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", forceLink)
    .force("charge", forceNode)
    .force("center", d3.forceCenter())
    .on("tick", ticked);

  const svg = d3
    .create("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  const link = svg
    .append("g")
    .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
    .attr("stroke-opacity", linkStrokeOpacity)
    .attr(
      "stroke-width",
      typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null
    )
    .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg
    .append("g")
    .attr("fill", nodeFill)
    .attr("stroke", nodeStroke)
    .attr("stroke-opacity", nodeStrokeOpacity)
    .attr("stroke-width", nodeStrokeWidth)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", nodeRadius)
    .call(drag(simulation))
    .on("mouseover", handleMouseOver) // Add mouseover event
    .on("mouseout", handleMouseOut) // Add mouseout event
    .on("click", onClick); // Add click event listener

  if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
  if (L) link.attr("stroke", ({ index: i }) => L[i]);
  if (G) node.attr("fill", ({ index: i }) => color(G[i]));
  if (T) node.append("title").text(({ index: i }) => T[i]);
  if (invalidation != null) invalidation.then(() => simulation.stop());

  function intern(value) {
    return value !== null && typeof value === "object"
      ? value.valueOf()
      : value;
  }

  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  }

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // Add mouseover and mouseout event handlers
  function handleMouseOver(event, d) {
    const tooltip = d3.select("#tooltip");
    const neighbours = links.filter((l) => l.source === d || l.target === d);
    const neighbourNodes = neighbours.map((l) =>
      l.source === d ? l.target : l.source
    );
    neighbourNodes.push(d);

    node.attr("fill", (n) =>
      neighbourNodes.includes(n) ? "black" : color(G[n.index])
    );

    tooltip.style("display", "block");
    tooltip
      .html(`ID: ${d.id}<br>Name: ${d.title}<br>Sentiment: ${d.sentiment}`)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 28 + "px");
  }

  function handleMouseOut() {
    d3.select("#tooltip").style("display", "none");
    node.attr("fill", (d) => color(G[d.index]));
  }

  return Object.assign(svg.node(), { scales: { color } });
}

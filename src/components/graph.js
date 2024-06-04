import * as d3 from "https://cdn.jsdelivr.net/npm/d3@6/+esm";
import * as Inputs from "npm:@observablehq/inputs";

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
      size: +d.size,
    }));

    const links = data.links.map((d) => ({
      source: d.source,
      target: d.target,
      thickness: +d.thickness,
      weight: +d.weight,
    }));

    const graph = ForceGraph(
      {
        nodes,
        links,
        wikiId,
      },
      {
        nodeId: (d) => d.id,
        nodeGroup: (d) => (d.sentiment > 0 ? "positive" : "negative"),
        nodeTitle: (d) => `${d.title}\nSentiment: ${d.sentiment}`,
        linkStrokeWidth: (l) => l.thickness,
        width: window.innerWidth - 20,
        height: window.innerHeight - 20,
      }
    );

    return graph;
  } catch (error) {
    console.error("Error in createForceGraph:", error);
    throw error; // Rethrow the error after logging it
  }
}

// Define the ForceGraph function
function ForceGraph({ nodes, links, wikiId }, options = {}) {
  let {
    nodeId = (d) => d.id,
    nodeGroup,
    nodeGroups,
    nodeTitle,
    nodeFill,
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
    width,
    height,
    invalidation,
  } = options;

  const N = d3.map(nodes, nodeId).map(intern);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const SI =
    typeof nodeRadius !== "function" ? null : d3.map(nodes, nodeRadius);
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
    radius: nodes[i].size,
  }));
  links = d3.map(links, (_, i) => ({
    source: LS[i],
    target: LT[i],
    thickness: links[i].thickness,
    weight: links[i].weight,
  }));

  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

  const sentimentColorScale = d3
    .scaleLinear()
    .domain([-1, 1])
    .interpolate(d3.interpolateRgb)
    .range(["red", "green"]);

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

  console.log(width, height); // Debugging line

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("min-width", 800)
    .attr("min-height", 800)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;")
    .on("click", svgClickHandler);

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
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => sentimentColorScale(d.sentiment))
    .call(drag(simulation))
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .on("click", handleOnClick);

  if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
  if (L) link.attr("stroke", ({ index: i }) => L[i]);
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

    const centerNode = nodes.find((n) => n.id === wikiId);
    if (centerNode) {
      centerNode.fx = width / 2;
      centerNode.fy = height / 2;
    }
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

    tooltip.style("display", "block");
    tooltip
      .html(`ID: ${d.id}<br>Name: ${d.title}<br>Sentiment: ${d.sentiment}`)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 28 + "px");
  }

  function handleMouseOut() {
    d3.select("#tooltip").style("display", "none");
  }

  function svgClickHandler(event) {
    if (event.target === this) {
      node.attr("fill", (d) => sentimentColorScale(d.sentiment));
    }
  }

  function handleOnClick(event, d) {
    const infoBox = document.getElementById("node-info");
    infoBox.innerHTML = `ID: ${d.id}<br>Name: ${d.title}<br>Sentiment: ${d.sentiment}`;
    const neighboursTable = document.getElementById("neighbours");

    neighboursTable.parentNode.classList.remove("not-active");
    const neighbours = links.filter((l) => l.source === d || l.target === d);
    const neighbourNodes = neighbours.map((l) =>
      l.source === d ? l.target : l.source
    );

    node.attr("fill", (n) =>
      n === d
        ? "white"
        : neighbourNodes.includes(n)
        ? "black"
        : sentimentColorScale(n.sentiment)
    );

    const neighbourNodesWithWeights = neighbourNodes.map((n) => ({
      title: n.title,
      sentiment: n.sentiment,
      thickness: links.find(
        (l) =>
          (l.source === d && l.target === n) ||
          (l.source === n && l.target === d)
      ).thickness,
      weight: links.find(
        (l) =>
          (l.source === d && l.target === n) ||
          (l.source === n && l.target === d)
      ).weight,
    }));

    const neighbourNodesWithWeightsSorted = neighbourNodesWithWeights.sort(
      (a, b) => b.thickness - a.thickness || b.weight - a.weight
    );

    // Clear the existing content
    neighboursTable.innerHTML = "";

    // Create and append the heading
    const heading = document.createElement("h2");
    heading.textContent = `Neighbours of the node ${d.title}`;
    neighboursTable.appendChild(heading);

    const tableData = neighbourNodesWithWeightsSorted.map((node) => {
      return {
        name: node.title,
        sentiment: node.sentiment,
        relatedness: node.weight,
      };
    });

    const table = Inputs.table(tableData, {
      columns: ["name", "sentiment", "relatedness"],
      header: {
        name: "Name",
        sentiment: "Sentiment",
        relatedness: "Relatedness",
      },
      rows: 20,
      search: true,
    });

    neighboursTable.appendChild(table);
  }

  return Object.assign(svg.node(), { scales: { color } });
}

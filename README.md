# Client

### Overview

The client repository showcases an interactive graph visualization using d3.js. The nodes in the graph represent entities that are linked through Named Entity Linking (NEL), allowing users to explore the connections and relationships between various entities dynamically. Each node corresponds to a recognized entity (topics of discourse) from processed datasets, offering a visual way to navigate complex relationships in online discourse.

### Key Features

* Built with d3.js, the graph enables full interaction with nodes and edges, allowing users to hover, click, and drag to explore relationships in real time and uncover deeper connections between entities in a clear and engaging way.
* A dynamic data fetch pipeline and pagination were created using Wikidata APIs to retrieve information about the most frequently occurring entities. This helps avoid unnecessary requests and allows us to display key features of entities directly to the user.
* Each node represents an entity identified through NEL, connecting related entities based on real-time or historical data.

### Tools & Technologies Used 
* **d3.js**: For creating the interactive and dynamic graph visualizations.
* **JavaScript**: For implementing frontend logic and interactions.
* **Observable Framework**: Used to enhance reactivity and data flow within the visualization.

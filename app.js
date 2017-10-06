/* var myTextarea = document.getElementById("myTextarea");
 * var editor = CodeMirror.fromTextArea(myTextarea, {
 *   lineNumbers: true
 * });*/

var s = `
# Red and Orange

- Richmond
- El Cerrito del Norte
- El Cerrito Plaza
- North Berkeley
- Downtown Berkeley
- Ashby

# Yellow

- Pittsburg/Bay Point
- North Concord/Martinez
- Concord
- Pleasant Hill/Contra Costa Centre
- Walnut Creek
- Lafayette
- Orinda
- Rockridge

# Red, Orange, and Yellow

- MacArthur
- 19th St/Oakland
- 12th St/Oakland City Center

# Red, Yellow, Blue, and Green

- West Oakland
- Embarcadero
- Montgomery St
- Powell St
- Civic Center/UN Plaza
- 16th St Mission
- 24th St Mission
- Glen Park
- Balboa Park
- Daly City [Blue and Green terminal]

# Red and Yellow

- Colma
- South San Francisco
- San Bruno

# Yellow

- San Francisco International Airport (SFO)

# Red

- Millbrae

# Blue, Orange, and Green

- Lake Merritt
- Fruitvale
- Coliseum
- San Leandro
- Bay Fair

# Blue

- Castro Valley
- West Dublin/Pleasanton
- Dublin/Pleasanton

# Orange and Green

- Hayward
- South Hayward
- Union City
- Fremont
- Warm Springs/South Fremont
`;

var routes = (function(s) {
  const routes = {};

  let activeRoutes = [];
  for (let line of s.split("\n")) {
    if (line.trim() === "") continue;

    if (line.startsWith("#")) {
      activeRoutes = line
        .substr(1)
        .trim()
        .split(/\s*(?:,|\s+and\s+)+\s*/);
    } else if (line.startsWith("-")) {
      line = line.substr(1).trim();
      const terminalMatch = line.match(/\[([^\]]+)\s+terminal\]/);

      let terminates = [];
      if (terminalMatch) {
        terminates = terminalMatch
          ? terminalMatch[1].split(/\s*(?:,|\s+and\s+)+\s*/)
          : [];
        line = line.replace(terminalMatch[0], "").trim();
      }
      const stop = {
        name: line,
        terminates
      };
      for (let route of activeRoutes) {
        if (!(route in routes)) routes[route] = [];
        const routeStops = routes[route];
        if (
          routeStops.length > 0 &&
          routeStops[routeStops.length - 1].terminates.includes(route)
        ) {
          routes[route].unshift(stop);
        } else {
          routes[route].push(stop);
        }
      }
    }
  }
  return routes;
})(s);

console.log(routes);

var graph = {
  nodes: [...new Set([].concat.apply([], Object.values(routes)))].map(stop => ({
    id: stop.name,
    group: 1
  })),
  links: [].concat.apply(
    [],
    Object.values(routes).map(function(route) {
      const routeLinks = [];
      for (let i = 0; i < route.length; i++) {
        if (!route[i + 1]) continue;
        routeLinks.push({
          source: route[i].name,
          target: route[i + 1].name,
          value: 1
        });
      }
      return routeLinks;
    })
  )
};
console.log(graph);

var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3.forceLink().id(function(d) {
      return d.id;
    })
  )
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2));

var link = svg
  .append("g")
  .attr("class", "links")
  .selectAll("line")
  .data(graph.links)
  .enter()
  .append("line")
  .attr("stroke-width", function(d) {
    return Math.sqrt(d.value);
  });

var node = svg
  .append("g")
  .attr("class", "nodes")
  .selectAll("circle")
  .data(graph.nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  .call(
    d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  );

node
  .append("circle")
  .attr("r", 5)
  .attr("fill", function(d) {
    return color(d.group);
  });

node
  .append("text")
  .attr("dx", 12)
  .attr("dy", ".35em")
  .text(function(d) {
    return d.id;
  });

node.append("title").text(function(d) {
  return d.id;
});

simulation.nodes(graph.nodes).on("tick", ticked);

simulation.force("link").links(graph.links);

function ticked() {
  link
    .attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      return d.target.x;
    })
    .attr("y2", function(d) {
      return d.target.y;
    });

  node.attr("transform", function(d) {
    d.x = Math.max(0, Math.min(width, d.x));
    d.y = Math.max(0, Math.min(height, d.y));
    return "translate(" + d.x + "," + d.y + ")";
  });
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

var d3 = require('d3');

function assignChildren(block, state) {
  const assigned = Object.assign(block, {
    components: block.components.map(compId => Object.assign({}, state.blocks[compId])),
  });

  if (assigned.components.length > 0) {
    assigned.components.forEach(function (comp) { return assignChildren(comp, state) });
  }

  return assigned;
}

function drawSunburst(container, state, layout) {
  const constructId = state.focus.constructId;
  const construct = state.blocks[constructId];
  const tree = assignChildren(Object.assign({}, construct), state);

  const partition = d3.layout.partition()
    .size([2 * Math.PI, layout.radius * layout.radius])
    .children(d => d.components)
    .value(d => d.sequence.length || 0);

  const arc = d3.svg.arc()
    .startAngle(d => d.x)
    .endAngle(d => d.x + d.dx)
    .innerRadius(d => Math.sqrt(d.y))
    .outerRadius(d => Math.sqrt(d.y + d.dy));

  function isFocused(el) {
    console.log(el.id);
    return state.focus.blockIds.indexOf(el.id) >= 0;
  }

  // For efficiency, filter nodes to keep only those large enough to see.
  // 0.005 radians = 0.29 degrees
  //.filter(d => d.dx > 0.005);
  const nodes = partition.nodes(tree);

  const path = d3.select(container)
    .data([tree])
    .selectAll('path')
    .data(nodes);

  path.enter()
    .append('svg:path')
  //.attr('display', d => d.id !== constructId ? null : 'none') //hide root node
    .attr('d', arc)
    .style('fill', d => d.metadata.color || '#cccccc')
    .style('stroke', 'transparent')
    .style('opacity', 1)
    .style('strokeWidth', '3px')
    .on('click', d => (d.id !== constructId) && window.constructor.api.focus.focusBlocks([d.id]));

  path.transition(500)
    .attr('d', arc)
    .style('fill', d => d.metadata.color || '#cccccc')
    .style('opacity', d => isFocused(d) ? 0.75 : 1)
    .style('stroke', d => isFocused(d) ? 'white' : 'transparent');

  path.exit();
}

function render(container, options) {
  //todo - resizing
  const width = options.boundingBox.width;
  const height = options.boundingBox.height;
  const radius = Math.min(width, height) / 2;
  const layout = { radius: radius, width: width, height: height };

  //initial element setup
  const svg = d3.select(container)
    .append('svg');
  svg.attr({
    width: width,
    height: height,
  });

  const cont = svg.append("g");
  cont.attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

  const subscriber = window.constructor.store.subscribe(function onSubscribe(state, lastAction) {
    console.log('subscribe');
    drawSunburst(cont[0][0], state, layout);
  }, true);

  return function unsubscribe() {
    console.log('unrendering');
    subscriber();
  };
}

window.constructor.extensions.register('construct-burst', 'projectDetail', render);

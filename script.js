const datasets = {
  kickstarter: 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json',
  movies: 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json',
  videogames: 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json',
};

let currentDataset = 'movies'; // Default dataset

document.querySelectorAll('#navbar a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    currentDataset = link.getAttribute('data-dataset');
    fetchDataAndRender();
    console.log('Clicked:', currentDataset);
  });
});

// Initial render
fetchDataAndRender();

async function fetchDataAndRender() {
  const url = datasets[currentDataset];
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract unique categories dynamically
    const categories = [...new Set(data.children.map(d => d.name))];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(categories);
    
    // Update title and description
    document.getElementById('title').textContent = `Top 100 ${currentDataset.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`;
    document.getElementById('description').textContent = `Visualizing the top 100 ${currentDataset.replace(/-/g, ' ')} by category and value.`;
    
    // Render treemap and legend
    renderTreemap(data, colorScale);
    renderLegend(categories, colorScale);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
  console.log('Fetching:', url);
  console.log('Data:', data); 
  //console.log(response);
}

// Render the treemap
function renderTreemap(data, colorScale) {
  const width = 960;
  const height = 600;
  
  // Clear previous treemap
  d3.select('#treemap').selectAll('*').remove();
  
  const svg = d3.select('#treemap')
    .attr("width", width)
    .attr("height", height);
  
  const treemap = d3.treemap()
    .size([width, height])
    .padding(1);
  
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);
  
  treemap(root);
  
  const cell = svg.selectAll('g')
    .data(root.leaves())
    .enter()
    .append('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);
  
  cell.append('rect')
    .attr('class', 'tile')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => colorScale(d.parent.data.name))
    .attr('data-name', d => d.data.name)
    .attr('data-category', d => d.parent.data.name)
    .attr('data-value', d => d.data.value)
    .on('mouseover', showTooltip)
    .on('mouseout', hideTooltip)
  
  cell.append('text')
    .attr('x', 5)
    .attr('y', 15)
    .text(d => d.data.name)
    .attr('font-size', '12px')
    .attr('fill', '#fff')
    .each(function(d) {
      const self = d3.select(this);
      const textLength = self.node().getComputedTextLength();
      const textWidth = d.x1 - d.x0 - 10;
      if (textLength > textWidth && textWidth > 0) {
        self.text(d.data.name.slice(0, Math.floor(textWidth / 6)) + '...');
      }
    });
}

// Render the legend
function renderLegend(categories, colorScale) {
  const legendWidth = 960;
  const itemWidth = 100;
  
  d3.select('#legend').selectAll('*').remove();
  
  const legend = d3.select('#legend')
    .attr('width', legendWidth)
    .attr('height', 50);
  
  const legendItems = legend.selectAll('.legend-item')
    .data(categories)
    .enter()
    .append('div')
    .attr('class', 'legend-item');
  
  legendItems.append('div')
    .style('width', '20px')
    .style('height', '20px')
    .style('background-color', d => colorScale(d))
    .style('display', 'inline-block');
  
  legendItems.append('span')
    .attr('x', 25)
    .attr('y', 15)
    .text(d => d)
    .style('font-size', '14px')
    .style('display', 'flex');
 
}

// Implement the tooltip
function showTooltip(event, d) {
  const tooltip = d3.select('#tooltip');
  tooltip
    .style('display', 'block')
    .style('left', `${event.pageX + 10}px`)
    .style('top', `${event.pageY - 10}px`)
    .attr('data-value', d.data.value)
    .html(`Name: ${d.data.name}<br>Category: ${d.parent.data.name}<br>Value: ${d.data.value}`);
}

function hideTooltip() {
  d3.select('#tooltip').style('display', 'none');
}

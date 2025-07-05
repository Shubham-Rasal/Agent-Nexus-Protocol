import { writeFileSync } from 'fs';

const categories = ['Zettels', 'References', 'Articles', 'Books', 'Slipbox'];
const colors = ['#f44336', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'];

const nodes = [];
const edges = [];

let nodeId = 0;

categories.forEach((cat, idx) => {
  for (let i = 0; i < 100; i++) {
    const id = `${cat}_${i}`;
    nodes.push({
      id,
      label: id,
      group: cat,
      color: colors[idx],
    });

    // Connect to a few random others in same group
    for (let j = 0; j < 3; j++) {
      const targetIdx = Math.floor(Math.random() * i);
      if (targetIdx >= 0 && targetIdx !== i) {
        edges.push({
          from: id,
          to: `${cat}_${targetIdx}`,
        });
      }
    }

    // Random cross-group edge
    if (Math.random() < 0.2) {
      const otherCat = categories[Math.floor(Math.random() * categories.length)];
      const otherIdx = Math.floor(Math.random() * 100);
      if (otherCat !== cat) {
        edges.push({
          from: id,
          to: `${otherCat}_${otherIdx}`,
        });
      }
    }
  }
});

writeFileSync('graph-data.json', JSON.stringify({ nodes, edges }, null, 2));

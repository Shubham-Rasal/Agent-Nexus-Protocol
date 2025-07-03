import express from 'express';
import bodyParser from 'body-parser';
import { addNode, addEdge } from '../lib/graph-crdt.js';

const app = express();
app.use(bodyParser.json());

// POST /create_entities
app.post('/create_entities', (req, res) => {
  const { entities } = req.body;
  if (!Array.isArray(entities)) {
    return res.status(400).json({ error: 'entities must be an array' });
  }
  try {
    entities.forEach((entity) => addNode(entity));
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

// POST /create_relations
app.post('/create_relations', (req, res) => {
  const relations = req.body.relations;
  if (!Array.isArray(relations)) return res.status(400).json({ error: 'relations must be an array' });
  try {
    relations.forEach(addEdge);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
}); 
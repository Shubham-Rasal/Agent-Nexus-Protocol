import { createGraphDB } from './lib/graph-api.js';
import type { Entity, Relation } from './lib/graph-model.js';

async function runDemo() {
  try {
    // Initialize GraphDB with IPFS support
    const graphDB = createGraphDB({
      ipfs: {
        // Optional: provide custom IPFS config
        // privateKey: "8f3092541ef889aa7c0c6c3f81f0c607a63dc75204003b57c1ce2c51570b490c",
        rpcURL:  'https://api.calibration.node.glif.io/rpc/v1',
      }
    });

    await graphDB.initialize();
    console.log('✅ GraphDB initialized');

    // Create some test entities
    const entities: Entity[] = [
      {
        id: 'person1',
        entityType: 'Person',
        name: 'Alice',
        properties: { age: 30, occupation: 'Engineer' },
        observations: ['First observation about Alice']
      },
      {
        id: 'person2',
        entityType: 'Person',
        name: 'Bob',
        properties: { age: 25, occupation: 'Designer' },
        observations: ['First observation about Bob']
      }
    ];

    const entityIds = await graphDB.createEntities(entities);
    console.log('✅ Created entities:', entityIds);

    // Create a relation between entities
    const relations: Relation[] = [{
      id: 'relation1',
      from: 'person1',
      to: 'person2',
      relationType: 'KNOWS',
      properties: { since: '2023' }
    }];

    const relationIds = await graphDB.createRelations(relations);
    console.log('✅ Created relations:', relationIds);

    // Add more observations to an entity
    await graphDB.addObservations('person1', [
      'Second observation about Alice',
      'Third observation about Alice'
    ]);
    console.log('✅ Added observations to person1');

    // Create a snapshot and store it on IPFS
    const cid = await graphDB.snapshotGraph();
    console.log('✅ Created IPFS snapshot:', cid);

    // Simulate clearing and reloading the graph
    await graphDB.deleteEntities(['person1', 'person2']);
    console.log('✅ Cleared graph');

    // Load the graph from IPFS
    await graphDB.loadGraphByCID(cid);
    console.log('✅ Loaded graph from IPFS');

    //check if the graph is loaded
    console.log('✅ Graph loaded:', graphDB.getGraph());

    // Get provenance information
    const provenance = graphDB.getProvenance();
    console.log('📜 Provenance log:', provenance);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the demo
runDemo().catch(console.error); 
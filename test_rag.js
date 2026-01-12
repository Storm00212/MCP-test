import { config } from 'dotenv';
config();

import ragRoute from './src/routes/rag.js';

// Mock server object
const mockServer = {
  tool: (name, schema, handler) => {
    console.log(`Registered tool: ${name}`);
    // Store handlers for testing
    mockServer.tools = mockServer.tools || {};
    mockServer.tools[name] = handler;
  }
};

// Initialize the RAG route
ragRoute(mockServer);

async function testRAG() {
  try {
    console.log('Testing RAG pipeline...');

    // First load the vector store
    console.log('Loading vector store...');
    const loadResult = await mockServer.tools.load_vector_store();
    console.log('Load result:', loadResult);

    // Then query
    console.log('Querying: "what is negative feedback"');
    const queryResult = await mockServer.tools.query_class_notes({ query: 'what is negative feedback' });
    console.log('Query result:', queryResult);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRAG();
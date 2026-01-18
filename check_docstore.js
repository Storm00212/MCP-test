import { readFileSync } from 'fs';

try {
  const content = readFileSync('faiss_index/docstore.json', 'utf8');
  console.log('First 1000 characters:');
  console.log(content.substring(0, 1000));
  console.log('\n...');

  // Try to parse it
  const parsed = JSON.parse(content);
  console.log('Parsed successfully. Keys:', Object.keys(parsed));
  if (parsed.docs) {
    console.log('Has docs array with length:', parsed.docs.length);
  }
} catch (error) {
  console.error('Error:', error.message);
}
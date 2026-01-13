import { config } from 'dotenv';
config();

import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";

async function recreateFaissIndex() {
  try {
    console.log('Recreating FAISS index from data folder...');

    // Load documents
    const loader = new DirectoryLoader("data", {
      ".pdf": (path) => new PDFLoader(path),
    });
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} documents`);

    // Split documents
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Split into ${splitDocs.length} chunks`);

    // Create embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002",
    });

    // Create FAISS vector store
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

    // Save with all components
    const FAISS_INDEX_PATH = './faiss_index';
    await mkdir(FAISS_INDEX_PATH, { recursive: true });
    await vectorStore.save(FAISS_INDEX_PATH);

    console.log('FAISS index recreated and saved successfully');
    console.log('Files created: index.faiss, index.pkl, docstore.json');

  } catch (error) {
    console.error('Error recreating FAISS index:', error);
  }
}

recreateFaissIndex();
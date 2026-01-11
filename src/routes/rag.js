import { z } from "zod";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import chokidar from "chokidar";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";

let splitDocs = [];
let vectorStore = null;
let chain = null;
const VECTOR_STORE_PATH = './vector_store';

async function loadDocuments() {
  try {
    console.error('Loading documents from data folder...');
    const loader = new DirectoryLoader("data", {
      ".pdf": (path) => new PDFLoader(path),
    });
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    splitDocs = await textSplitter.splitDocuments(docs);
    console.error(`Loaded and split ${splitDocs.length} document chunks.`);
    return splitDocs;
  } catch (error) {
    console.error('Error loading documents:', error);
    throw error;
  }
}

async function createEmbeddingsAndVectorStore() {
  try {
    console.error('Creating embeddings and vector store...');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002",
    });

    // Try to load existing vector store
    if (existsSync(VECTOR_STORE_PATH)) {
      vectorStore = await FaissStore.load(VECTOR_STORE_PATH, embeddings);
      console.error('Loaded existing vector store.');
    } else {
      if (splitDocs.length === 0) {
        await loadDocuments();
      }
      vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
      await mkdir(VECTOR_STORE_PATH, { recursive: true });
      await vectorStore.save(VECTOR_STORE_PATH);
      console.error('Created and saved new vector store.');
    }

    // Create chain
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0,
    });
    chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
    console.error('Vector store and chain ready.');
  } catch (error) {
    console.error('Error creating embeddings/vector store:', error);
    throw error;
  }
}

async function updateVectorStore() {
  try {
    console.error('Updating vector store due to file changes...');
    await loadDocuments();
    await createEmbeddingsAndVectorStore();
    console.error('Vector store updated.');
  } catch (error) {
    console.error('Error updating vector store:', error);
  }
}

export default (server) => {
  // Start file watcher
  const watcher = chokidar.watch('data', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  });

  watcher.on('add', updateVectorStore);
  watcher.on('change', updateVectorStore);
  watcher.on('unlink', updateVectorStore);

  server.tool(
    "load_documents",
    {},
    async () => {
      try {
        await loadDocuments();
        return {
          content: [
            {
              type: "text",
              text: `Loaded and split ${splitDocs.length} document chunks from data folder.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error loading documents: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_vector_store",
    {},
    async () => {
      try {
        await createEmbeddingsAndVectorStore();
        return {
          content: [
            {
              type: "text",
              text: "Embeddings and vector store created/loaded successfully.",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating vector store: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "query_class_notes",
    {
      query: z.string().describe("The question to ask about the class notes"),
    },
    async ({ query }) => {
      try {
        if (!chain) {
          await createEmbeddingsAndVectorStore();
        }
        if (!chain) {
          return {
            content: [
              {
                type: "text",
                text: "RAG system not ready. Please ensure documents are loaded and vector store is created.",
              },
            ],
            isError: true,
          };
        }

        console.error(`Querying RAG with: ${query}`);
        const result = await chain.call({ query });
        console.error('RAG query completed.');

        return {
          content: [
            {
              type: "text",
              text: result.text,
            },
          ],
        };
      } catch (error) {
        console.error('Error querying RAG:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error querying class notes: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
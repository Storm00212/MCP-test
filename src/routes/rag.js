import { z } from "zod";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import https from "https";
import { createWriteStream } from "fs";

let vectorStore = null;
let chain = null;
const FAISS_INDEX_PATH = './faiss_index';
const FAISS_INDEX_URL = 'https://drive.google.com/uc?export=download&id=1DLn9sEwbfmuAVsQBQ31hCrOTdyfY0_PX';
const FAISS_PICKLE_URL = 'https://drive.google.com/uc?export=download&id=1t0pUILql00jqQ8CRzHwyjHQBQjiO-6kg';
const FAISS_DOCSTORE_URL = 'https://drive.google.com/uc?export=download&id=1gvLuel8zjv4GMpSfLb5OrDKruvxbFZpl';

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadFaissIndices() {
  try {
    console.error('Downloading FAISS index files...');
    await mkdir(FAISS_INDEX_PATH, { recursive: true });
    await downloadFile(FAISS_INDEX_URL, `${FAISS_INDEX_PATH}/index.faiss`);
    await downloadFile(FAISS_PICKLE_URL, `${FAISS_INDEX_PATH}/index.pkl`);
    await downloadFile(FAISS_DOCSTORE_URL, `${FAISS_INDEX_PATH}/docstore.json`);
    console.error('FAISS index files downloaded successfully.');
  } catch (error) {
    console.error('Error downloading FAISS indices:', error);
    throw error;
  }
}

async function createEmbeddingsAndVectorStore() {
  try {
    console.error('Loading pre-built FAISS vector store...');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002",
    });

    // Check if FAISS index files exist, if not download them
    if (!existsSync(`${FAISS_INDEX_PATH}/index.faiss`) || !existsSync(`${FAISS_INDEX_PATH}/index.pkl`) || !existsSync(`${FAISS_INDEX_PATH}/docstore.json`)) {
      await downloadFaissIndices();
    }

    // Load the pre-built FAISS vector store
    vectorStore = await FaissStore.load(FAISS_INDEX_PATH, embeddings);
    console.error('Loaded pre-built FAISS vector store.');

    // Create chain
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0,
    });
    chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
    console.error('Vector store and chain ready.');
  } catch (error) {
    console.error('Error loading FAISS vector store:', error);
    throw error;
  }
}

export default (server) => {

  server.tool(
    "load_vector_store",
    {},
    async () => {
      try {
        await createEmbeddingsAndVectorStore();
        return {
          content: [
            {
              type: "text",
              text: "Pre-built FAISS vector store loaded successfully.",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error loading vector store: ${error.message}`,
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
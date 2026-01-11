import { z } from "zod";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";

let vectorStore = null;
let chain = null;

async function initializeRAG() {
  if (vectorStore) return; // Already initialized

  try {
    console.error('Initializing RAG system...');

    // Load documents from data folder
    const loader = new DirectoryLoader("data", {
      ".pdf": (path) => new PDFLoader(path),
    });
    const docs = await loader.load();

    // Split documents
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Create embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002",
    });

    // Create vector store
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

    // Create chain
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0,
    });

    chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    console.error('RAG system initialized successfully.');
  } catch (error) {
    console.error('Error initializing RAG:', error);
    throw error;
  }
}

export default (server) => {
  server.tool(
    "query_class_notes",
    {
      query: z.string().describe("The question to ask about the class notes"),
    },
    async ({ query }) => {
      try {
        if (!chain) {
          await initializeRAG();
        }
        if (!chain) {
          return {
            content: [
              {
                type: "text",
                text: "RAG system not initialized. Please check OpenAI API key and data folder.",
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
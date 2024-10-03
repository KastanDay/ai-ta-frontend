import fs from 'fs';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import path from 'path';

export let encoding: Tiktoken | null = null;

export const initializeWasm = async (): Promise<void> => {
  if (!encoding) {
    try {
      // Resolve the path to the WASM file
      const wasmPath = path.join(process.cwd(), 'node_modules', '@dqbd', 'tiktoken', 'lite', 'tiktoken_bg.wasm');

      // Read the WASM file asynchronously
      const wasm = await fs.promises.readFile(wasmPath);

      // Initialize Tiktoken with the instantiated WASM module
      await init((imports) => WebAssembly.instantiate(wasm, imports));

      // Create a new encoding instance
      encoding = new Tiktoken(
        tiktokenModel.bpe_ranks,
        tiktokenModel.special_tokens,
        tiktokenModel.pat_str
      );
    } catch (error) {
      console.error('Failed to initialize WASM module:', error);
      throw error;
    }
  }
};

// Export Tiktoken type for use in other modules
export { Tiktoken };

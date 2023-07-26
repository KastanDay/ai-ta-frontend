import { ContextWithMetadata } from '~/types/chat';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'

export async function getStuffedPrompt(searchQuery: string, contexts: ContextWithMetadata[], tokenLimit = 8000) {
  try {
    if (contexts.length === 0) {
      return searchQuery;
    }

    tokenLimit = tokenLimit - 2001; // for the completion. We always reserve 1k + some for the system prompt I think...

    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    )

    const prePrompt = "Please answer the following question. Use the context below, called your documents, only if it's helpful and don't use parts that are very irrelevant. It's good to quote from your documents directly, when you do always use Markdown footnotes for citations. Use react-markdown superscript to number the sources at the end of sentences (1, 2, 3...) and use react-markdown Footnotes to list the full document names for each number. Use ReactMarkdown aka 'react-markdown' formatting for super script citations, use semi-formal style. Feel free to say you don't know. \nHere's a few passages of the high quality documents:\n";

    let tokenCounter = encoding.encode(prePrompt + '\n\nNow please respond to my query: ' + searchQuery).length;
    const validDocs = [];
    for (const d of contexts) {
      const docString = `---\nDocument: ${d.readable_filename}${d.pagenumber_or_timestamp ? ', page: ' + d.pagenumber_or_timestamp : ''}\n${d.text}\n`;
      const numTokens = encoding.encode(docString).length;
      console.log(`token_counter: ${tokenCounter}, num_tokens: ${numTokens}, token_limit: ${tokenLimit}`);
      if (tokenCounter + numTokens <= tokenLimit) {
        tokenCounter += numTokens;
        validDocs.push(d);
      } else {
        continue;
      }
    }

    const separator = '---\n'; // between each context
    const contextText = validDocs.map(d =>
      `Document: ${d.readable_filename}${d.pagenumber_or_timestamp ? ', page: ' + d.pagenumber_or_timestamp : ''}\n${d.text}\n`
    ).join(separator);

    const stuffedPrompt = prePrompt + contextText + '\n\nNow please respond to my query: ' + searchQuery;
    const totalNumTokens = encoding.encode(stuffedPrompt).length;
    console.log('Stuffed prompt', stuffedPrompt.substring(0, 3700));
    console.log(`Total number of tokens: ${totalNumTokens}. Number of docs: ${contexts.length}, number of valid docs: ${validDocs.length}`);

    return stuffedPrompt;
  } catch (e) {
    console.error(`Error in getStuffedPrompt: ${e}`);
    throw e;
  }
}
import { ContextWithMetadata } from '~/types/chat'

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'

export async function getStuffedPrompt(
  course_name: string,
  searchQuery: string,
  contexts: ContextWithMetadata[],
  tokenLimit = 8000,
) {
  try {
    if (contexts.length === 0) {
      return searchQuery
    }

    tokenLimit = tokenLimit - 2001 // for the completion. We always reserve 1k + some for the system prompt I think...

    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    )

    let prePrompt = ''
    if (course_name == 'Law794-TransactionalDraftingAlam') {
      prePrompt =
        "Please answer the following question. Use the documents below, and ONLY the documents below, to answer the question. This is for the law domain and we train law students to stick to facts that are in the record. Do not improvise or use your world knowledge, stick to only the information provided and make heavy use of direct quotes instead of paraphrasing or summarizing. When citing the documents, always use Markdown footnotes in the react-markdown format. Use react-markdown superscript to number the sources at the end of sentences (1, 2, 3...) and use react-markdown Footnotes to list the full document names for each number. Use ReactMarkdown aka 'react-markdown' formatting for super script citations, use semi-formal style. Say that 'the topic is not discussed in these documents' when the answer is not directly available in the documents. If there are related documents, tell the user that they might be able to learn more in that document.\nHere's a few passages of the documents:\n"
    } else {
      prePrompt = `Please answer the following question. Utilize the context provided below, 
      termed 'your documents', and integrate information from them as appropriate. Avoid irrelevant parts. 
      When quoting directly from your documents, use Markdown footnotes for citations. 
      Apply ReactMarkdown formatting for superscript citations and clickable links. 
      Insert citations at the end of sentences in square brackets, like [1], [2], etc.
      At the end of the response, list the document names(with extensions) with corresponding numbers as clickable links ONLY for relevant documents.
      The response style should be semi-formal. If the answer is not found in the provided documents, feel free to state that you don't know.
      Structure your response to include relevant information from these documents, 
      following the inline citations format with clickable links. 
      For each statement or fact drawn from a document, add a numerical citation in square brackets 
      immediately after the sentence. End your response with a list of the document titles as clickable links, 
      corresponding to each numerical citation.
      Here are excerpts from the high-quality documents provided:\n"`
      // "Please answer the following question. Use the context below, called your documents, only if it's helpful and don't use parts that are very irrelevant. It's good to quote from your documents directly, when you do always use Markdown footnotes for citations. Use react-markdown superscript to number the sources at the end of sentences (1, 2, 3...) and use react-markdown Footnotes to list the full document names for each number. Use ReactMarkdown aka 'react-markdown' formatting for super script citations, use semi-formal style. Feel free to say you don't know. \nHere's a few passages of the high quality documents:\n"
    }

    let tokenCounter = encoding.encode(
      prePrompt + '\n\nNow please respond to my query: ' + searchQuery,
    ).length
    const validDocs = []
    for (const d of contexts) {
      const docString = `---\nDocument: ${d.readable_filename}${
        d.pagenumber ? ', page: ' + d.pagenumber : ''
      }\n${d.text}\n`
      const numTokens = encoding.encode(docString).length
      console.log(
        `token_counter: ${tokenCounter}, num_tokens: ${numTokens}, token_limit: ${tokenLimit}`,
      )
      if (tokenCounter + numTokens <= tokenLimit) {
        tokenCounter += numTokens
        validDocs.push(d)
      } else {
        continue
      }
    }

    const separator = '---\n' // between each context
    const contextText = validDocs
      .map(
        (d) =>
          `Document: ${d.readable_filename}${
            d.pagenumber ? ', page: ' + d.pagenumber : ''
          }\n${d.text}\n`,
      )
      .join(separator)

    const stuffedPrompt =
      prePrompt +
      contextText +
      '\n\nNow please respond to my query: ' +
      searchQuery
    const totalNumTokens = encoding.encode(stuffedPrompt).length
    console.log('Stuffed prompt', stuffedPrompt.substring(0, 3700))
    console.log(
      `Total number of tokens: ${totalNumTokens}. Number of docs: ${contexts.length}, number of valid docs: ${validDocs.length}`,
    )

    return stuffedPrompt
  } catch (e) {
    console.error(`Error in getStuffedPrompt: ${e}`)
    throw e
  }
}

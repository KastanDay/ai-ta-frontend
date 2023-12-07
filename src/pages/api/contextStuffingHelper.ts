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
      prePrompt = `Please analyze and respond to the following question using the excerpts from the provided documents. These documents can be pdf files or web pages.
      Integrate relevant information from these documents, ensuring each reference is linked to the document's number.
      Use Markdown to format citations as clickable links. Your response should be semi-formal. 
      When quoting directly, cite with footnotes linked to the document number. 
      Summarize or paraphrase other relevant information with inline citations, again referencing the document number. 
      If the answer is not in the provided documents, state so. 
      Conclude your response with a LIST of the document titles as clickable links, each linked to its respective document number.
      ALWAYS follow the examples below:
      If you're referencing the first document, insert a citation like this in your response: "[1]" 
      At the end of your response, list the document title with a clickable link, like this: "[1]:[document_name]"
      Nothing else should prefixxed or suffixed to the citation or document name. 
      
      Suppose a document name is shared with you along with the number below like "27: www.pdf, page: 2" where 27 is the number and www.pdf is the document_name, then cite it in the response as follows:
      """
      The sky is blue. [27] The grass is green. [28]
      Relevant Sources:

      [27]: [document_name](#)
      [28]: [document_name](#)
      """
      Here are excerpts from the high-quality documents provided:
      \n"`
      // "Please answer the following question. Use the context below, called your documents, only if it's helpful and don't use parts that are very irrelevant. It's good to quote from your documents directly, when you do always use Markdown footnotes for citations. Use react-markdown superscript to number the sources at the end of sentences (1, 2, 3...) and use react-markdown Footnotes to list the full document names for each number. Use ReactMarkdown aka 'react-markdown' formatting for super script citations, use semi-formal style. Feel free to say you don't know. \nHere's a few passages of the high quality documents:\n"
    }

    let tokenCounter = encoding.encode(
      prePrompt + '\n\nNow please respond to my query: ' + searchQuery,
    ).length
    const validDocs = []
    for (const [index, d] of contexts.entries()) {
      const docString = `---\n${index + 1}: ${d.readable_filename}${
        d.pagenumber ? ', page: ' + d.pagenumber : ''
      }\n${d.text}\n`
      const numTokens = encoding.encode(docString).length
      console.log(
        `token_counter: ${tokenCounter}, num_tokens: ${numTokens}, token_limit: ${tokenLimit}`,
      )
      if (tokenCounter + numTokens <= tokenLimit) {
        tokenCounter += numTokens
        validDocs.push({ index, d })
      } else {
        continue
      }
    }

    const separator = '---\n' // between each context
    const contextText = validDocs
      .map(
        ({ index, d }) =>
          `${index + 1}: ${d.readable_filename}${
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

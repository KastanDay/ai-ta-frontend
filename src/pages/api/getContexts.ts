import { ContextWithMetadata } from '~/types/chat'

const flask_url = process.env.FLASK_URL

export const config = {
  runtime: 'edge',
}

export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
): Promise<ContextWithMetadata[]> => {
  console.log('fetchContexts search query:', search_query, token_limit)
  const queryParams = new URLSearchParams({
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit.toString(),
    doc_groups: JSON.stringify(doc_groups),
  }).toString()

  const url = `${flask_url}/getTopContexts?${queryParams}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch contexts. Err status:' + response.status)
    }
    const data: ContextWithMetadata[] = await response.json()
    return data
  } catch (error) {
    console.error(error)
    return []
  }
}

export default fetchContexts

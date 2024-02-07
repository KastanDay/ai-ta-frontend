import { ContextWithMetadata } from '~/types/chat'

export const config = {
  runtime: 'edge',
}

export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
): Promise<ContextWithMetadata[]> => {
  console.log('fetchContexts search query:', search_query, token_limit)
  const queryParams = new URLSearchParams({
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit.toString(),
  }).toString()

  const url = `${process.env.RAILWAY_URL}/getTopContexts?${queryParams}`

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

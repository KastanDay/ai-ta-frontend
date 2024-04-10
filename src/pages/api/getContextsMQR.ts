import axios, { AxiosResponse } from 'axios'
import { ContextWithMetadata } from '~/types/chat'

const flask_url = process.env.FLASK_URL

export const fetchMQRContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 6000,
  doc_groups: string[] = [],
) => {
  try {
    const response: AxiosResponse<ContextWithMetadata[]> = await axios.get(
      `${flask_url}/getTopContextsWithMQR`,
      {
        params: {
          course_name: course_name,
          search_query: search_query,
          token_limit: token_limit,
          doc_groups: doc_groups,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error(error)
    return []
  }
}

export default fetchMQRContexts

import axios, { AxiosResponse } from 'axios'
import { ContextWithMetadata } from '~/types/chat'

export const fetchMQRContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 6000,
) => {
  try {
    const response: AxiosResponse<ContextWithMetadata[]> = await axios.get(
      `https://flask-production-751b.up.railway.app/getTopContextsWithMQR`,
      {
        params: {
          course_name: course_name,
          search_query: search_query,
          token_limit: token_limit,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error(error)
    return []
  }
}

export default fetchMQRContexts;
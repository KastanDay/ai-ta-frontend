import axios, { AxiosResponse } from 'axios'
import { ContextWithMetadata } from '~/types/chat'

export const config = {
  runtime: 'edge',
}

export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
) => {
  try {
    const response: AxiosResponse<ContextWithMetadata[]> = await axios.get(
      `https://flask-production-751b.up.railway.app/getTopContexts`,
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

export default fetchContexts;
// Axios doesn't work in Next.js Edge runtime, so using standard fetch instead.
// export async function fetchContextsNOAXIOS(
//   course_name: string,
//   search_query: string,
//   top_n = 4,
// ) {
//   const res = await fetch(
//     `${API_URL}/getTopContexts?course_name=${course_name}&search_query=${search_query}&top_n=${top_n}`,
//     {
//       // const res = await fetch(`${API_URL}/getTopContexts?search_query=${search_query}`, {
//       method: 'GET',
//     },
//   )

//   if (!res.ok) {
//     throw new Error('Failed to fetch contexts. Err status:' + res.status)
//   }

//   const data: ContextWithMetadata[] = await res.json()
//   console.log('fetchContextsNOAXIOS things', data)
//   return data
// }

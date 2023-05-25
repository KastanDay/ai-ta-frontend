import axios, { AxiosResponse } from 'axios'

export const config = {
  runtime: 'edge',
}
export interface getTopContextsResponse {
  id: number
  text: string
  readable_filename: string
  course_name: string
  s3_path: string
  pagenumber_or_timestamp: string
}


export const fetchContexts = async (currentPageName : string, search_query: string) => {
  // axios.defaults.baseURL = 'https://flask-production-751b.up.railway.app'; TODO: could use multiple axios instances for each api service
  try {
    const response: AxiosResponse<getTopContextsResponse[]> = await axios.get('https://flask-production-751b.up.railway.app/getTopContexts', {
      params: {
        course_name: currentPageName,
        search_query: search_query, // 'finite state machines?', // TODO: fix HARD CODED query
      },
    });
    console.log('fetchContexts things', response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
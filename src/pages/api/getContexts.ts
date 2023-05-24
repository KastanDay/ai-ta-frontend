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


export const fetchContexts = async () => {
  axios.defaults.baseURL = 'https://flask-production-751b.up.railway.app';
  try {
    const response: AxiosResponse<getTopContextsResponse[]> = await axios.get('/getTopContexts', {
      params: {
        // course_name: currentPageName,
        search_query: 'finite state machines?', // TODO: fix HARD CODED query
      },
    });
    console.log('fetchContexts things', response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
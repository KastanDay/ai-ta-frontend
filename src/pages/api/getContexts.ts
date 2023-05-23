import axios, { AxiosResponse } from 'axios'

export const config = {
  runtime: 'edge',
}
export interface getTopContextsResponse {
  id: number
  source_name: string
  source_location: string
  text: string
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
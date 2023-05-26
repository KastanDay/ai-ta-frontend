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

export const fetchContexts = async (course_name : string, search_query: string, top_n: number = 4) => {
  const API_URL = 'https://flask-production-751b.up.railway.app';
  try {
    const response: AxiosResponse<getTopContextsResponse[]> = await axios.get(`${API_URL}/getTopContexts`, {
      params: {
        course_name: course_name,
        search_query: search_query,
        top_n: top_n,
      },
    });
    // console.log('fetchContexts things', response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Axios doesn't work in Next.js Edge runtime, so using standard fetch instead. 
export async function fetchContextsNOAXIOS(course_name: string, search_query: string, top_n: number = 4) {
  const API_URL = 'https://flask-production-751b.up.railway.app';
  const res = await fetch(`${API_URL}/getTopContexts?course_name=${course_name}&search_query=${search_query}&top_n=${top_n}`, {
  // const res = await fetch(`${API_URL}/getTopContexts?search_query=${search_query}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch contexts. Err status:' + res.status);
  }

  const data: getTopContextsResponse[] = await res.json();
  console.log('fetchContextsNOAXIOS things', data);
  return data;
}
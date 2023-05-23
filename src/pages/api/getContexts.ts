import axios, { AxiosResponse } from 'axios'
interface getTopContextsResponse {
  id: number
  source_name: string
  source_location: string
  text: string
}

interface contextsResponse {
  contexts: getTopContextsResponse[]
}

// mine
// export const fetchContexts = () => {
//     axios.defaults.baseURL = 'https://flask-production-751b.up.railway.app'
//     axios
//     .get('/getTopContexts', {
//       params: {
//         // course_name: currentPageName,
//         search_query: 'finite state machines?', // TODO: fix HARD CODED query
//       },
//     })
//     .then((response: AxiosResponse<contextsResponse>) => {
//       // setContexts(response.data.contexts)
//       console.log("Response:")
//       console.log(response)
//       console.log("CONTEXTS:")
//       console.log(response.data)
//       return response.data
//     })
//     .catch((error) => {
//       console.error(error)
//     })
//   }

// GPT
export const fetchContexts = async () => {
  axios.defaults.baseURL = 'https://flask-production-751b.up.railway.app';
  try {
    const response: AxiosResponse<contextsResponse> = await axios.get('/getTopContexts', {
      params: {
        // course_name: currentPageName,
        search_query: 'finite state machines?', // TODO: fix HARD CODED query
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return { contexts: [] };
  }
};
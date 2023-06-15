export const config = {
  runtime: 'edge',
}

export async function getExtremePrompt(
  course_name: string,
  search_query: string,
  top_n = 20, // get 20 contexts
  top_k_to_search = 100,
) {
  console.log("getExtremePrompt called")
  const API_URL = 'https://flask-production-751b.up.railway.app'
  const res = await fetch(
    `${API_URL}/getExtremePrompt?course_name=${course_name}&search_query=${search_query}&top_n=${top_n}&top_k_to_search=${top_k_to_search}`,
    {
      method: 'GET',
    },
  )
  if (!res.ok) {
    throw new Error('Failed to fetch contexts. Err status:' + res.status)
  }

  const extremePrompt: string = await res.json()
  console.log('ExtremePrompt:\n', extremePrompt)
  return extremePrompt
}

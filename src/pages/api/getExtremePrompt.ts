export const config = {
  runtime: 'edge',
}

export async function getExtremePrompt(
  course_name: string,
  search_query: string,
  top_n = 15, // get 20 contexts. Batch size is 20, so this is the minimum & max for a single call.
  top_k_to_search = 100,
) {
  console.log('getExtremePrompt called')
  const res = await fetch(
    `https://flask-production-751b.up.railway.app/getContextStuffedPrompt?course_name=${course_name}&search_query=${search_query}&top_n=${top_n}&top_k_to_search=${top_k_to_search}`,
    {
      method: 'GET',
    },
  )
  if (!res.ok) {
    throw new Error('Failed to fetch contexts. Err status:' + res.status)
  }

  const extremePrompt = await res.json()
  const finalPromptStr: string = extremePrompt.prompt
  // console.log('finalPromptStr:\n', finalPromptStr)
  return finalPromptStr
}

export default getExtremePrompt

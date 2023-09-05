import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

// const API_URL = 'https://flask-production-751b.up.railway.app'
const API_URL_PREVIEW = 'https://flask-ai-ta-backend-pr-72.up.railway.app'


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { course_name, conversation } = req.body

  try {
    const response: AxiosResponse = await axios.put(`${API_URL_PREVIEW}/onResponseCompletion`, {
      course_name: course_name,
      conversation: conversation,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging conversation:', error)
    return NextResponse.json({ success: false })
  }
}

export default handler

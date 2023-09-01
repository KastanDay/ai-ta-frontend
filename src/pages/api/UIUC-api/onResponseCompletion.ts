import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'

// const API_URL = 'https://flask-production-751b.up.railway.app'
const API_URL_PREVIEW = 'https://flask-ai-ta-backend-pr-72.up.railway.app/'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { course_name, conversation } = req.body

  try {
    const response: AxiosResponse = await axios.put(`${API_URL_PREVIEW}/onResponseCompletion`, {
      course_name: course_name,
      conversation: conversation,
    })
    // console.log('Response from Flask API:', response.data)
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error logging conversation:', error)
    return res.status(500).json({ success: false })
  }
}

export default handler

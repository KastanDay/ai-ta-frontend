import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  try {
    const { method } = req

    switch (method) {
      case 'GET':
        const { course_name, from_date, to_date } = req.query

        const url = `https://flask-production-751b.up.railway.app/exportDocuments?course_name=${course_name}&from_date=${from_date}&to_date=${to_date}`

        const response = await fetch(url)
        const data = await response.json()
        console.log(data)
        res.status(200).json(data)

    }

  } catch (error) {
    console.error(error)


  }
}
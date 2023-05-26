import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { courseName } = req.query as {
      courseName: string
    }
  console.log('INSIDE VERCEL SO SAD: course: ' + courseName);
  try {
    const  updateEdgeConfig = await fetch(
      `https://api.vercel.com/v1/edge-config/ecfg_4shiqee2lzc3kvt1o5eqmo9toqgp/items?teamId=${process.env.VERCEL_TEAM_ID}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + process.env.VERCEL_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: courseName,
              value: true,
            }
          ],
        }),
      },
    );
    const result = await updateEdgeConfig.json();
    console.log(result);
  } catch (error) {
    console.log("ERROR IN vercelsosad:", error);
  }
}

export default handler

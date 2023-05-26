// // sosad.ts
// import { NextApiRequest, NextApiResponse } from 'next'
// import axios, { AxiosResponse } from "axios";

// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//   console.log('INSIDE SO SAD');
//   try {
//     const { courseName } = req.query as {
//       courseName: string
//     }    
//     console.log('courseName INSIDE SO SAD', courseName);
//     console.log('process.env.EDGE_CONFIG_ID', process.env.VERCEL_API_TOKEN);
    
//     const response: AxiosResponse = await axios.patch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`, {
//     // const response: AxiosResponse = await axios.patch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items?teamId=${process.env.VERCEL_TEAM_ID}`, {
//       headers: {
//           Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, // token is built into EDGE_CONFIG
//           'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         items: [
//           {
//             operation: 'upsert',
//             key: courseName,
//             value: true,
//           },
//         ],
//       }),
//     });
//     // const data = await 
//     return res.status(200).json(response.data)
//     // console.log('Getting to our /ingest endpoint', data);
//     // return data;
//   } catch (error) {
//     console.error(error);
//     return [];
//   }
// }

// export default handler

// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('INSIDE SO SAD');
  try {
    const { courseName } = req.query as {
      courseName: string
    }    
    console.log('courseName INSIDE SO SAD', courseName);
    console.log('process.env.EDGE_CONFIG_ID', process.env.VERCEL_API_TOKEN);
    
    const response: AxiosResponse = await axios.patch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`, {
      headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, // token is built into EDGE_CONFIG
          'Content-Type': 'application/json',
      },
      data: {
        items: [
          {
            operation: 'upsert',
            key: courseName,
            value: true,
          },
        ],
      },
    });
    // const data = await 
    return res.status(200).json(response.data)
    // console.log('Getting to our /ingest endpoint', data);
    // return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default handler

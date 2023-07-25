// Return webScrapeConfig from Edge

import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

export const config = {
    runtime: 'edge',
};

// https://vercel.com/docs/storage/edge-config/edge-config-sdk#use-connection-strings
export const fetchWebScrapeConfig = async () => {
  const exampleValue1 = await get('web_scrape_config') as any;
  console.log("-------------- CONFIG", exampleValue1)
  return exampleValue1.json();
  return NextResponse.json({
    exampleValue1,
  });
};

// export async function fetchWebScrapeConfig(): Promise<{ num_sites: number; recursive_depth: number; timeout_sec: number }> {
//     try {
//         const edgeConfigVar = process.env.EDGE_CONFIG;
//         const vercelTeamID = process.env.VERCEL_TEAM_ID;
//         console.log('edgeConfigVar', edgeConfigVar);
//         console.log('vercelTeamID', vercelTeamID);
//         const readSingleWithAuth = await fetch(
//             `${edgeConfigVar}/item/web_scrape_config`,
//             {
//                 method: 'GET',
//                 headers: {
//                     Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
//                 },
//             }
//         );
//         const result = await readSingleWithAuth.json();
//         console.log(result);
//         return result
//     } catch (error) {
//         console.log(error);
//         return { num_sites: 100, recursive_depth: 1, timeout_sec: 1 }
//     }
// }

// export const fetchWebScrapeConfig(request: NextRequest) => {
//   const exampleValue1 = await get('web_scrape_config');
//   return NextResponse.json({
//     example: `This is the value of "example_key_1" in my Edge Config: ${exampleValue1}!`,
//   });
// };

export async function upsertWebScrapeConfig(
    webScrapeConfig: { num_sites: number; recursive_depth: number; timeout_sec: number }
): Promise<void> {
    try {
        const edgeConfigVar = process.env.EDGE_CONFIG;
        const vercelTeamID = process.env.VERCEL_TEAM_ID;
        console.log('edgeConfigVar', edgeConfigVar);
        console.log('vercelTeamID', vercelTeamID);
        const updateEdgeConfig = await fetch(`${edgeConfigVar}/items`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [
                    {
                        operation: 'upsert',
                        key: 'web_scrape_config',
                        value: webScrapeConfig,
                    },
                ],
            }),
        });
        const result = await updateEdgeConfig.json();
        console.log(result);
    } catch (error) {
        console.log(error);
    }
}

export const config = {
  runtime: 'edge',
};

export async function addEdgeConfigItem(course_name: string): Promise<void> {
  // Docs: https://vercel.com/docs/storage/edge-config/vercel-api#update-your-edge-config-items
  try {
    const edgeConfigVar = process.env.EDGE_CONFIG;
    const vercelTeamID = process.env.VERCEL_TEAM_ID;
    console.log('edgeConfigVar', edgeConfigVar);
    console.log('vercelTeamID', vercelTeamID);
    
    const updateEdgeConfig = await fetch(
      `${edgeConfigVar}/items?teamId=${vercelTeamID}`,
      {
        method: 'PATCH',
        headers: {
          // Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, // token is built into EDGE_CONFIG
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: course_name,
              value: true,
            },
          ],
        }),
      },
    );
    const result = await updateEdgeConfig.json();
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}


// export async function addEdgeConfigItem(options: AddEdgeConfigItemOptions): Promise<void> {
//   const { value } = options;

//   const edgeConfigId = "ecfg_oz1kwxi1tuz7w6tdxmqkawkmcmil"

//   const apiUrl = `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items?`;
//   const headers = {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
//   };

//   try {
//     const response = await fetch(apiUrl, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({ value }),
//     });

//     if (!response.ok) {
//       throw new Error(`Error adding value to edge config: ${response.statusText}`);
//     }

//     console.log('Value added to edge config');
//   } catch (error) {
//     console.error('Error adding value to edge config:', error);
//   }
// }
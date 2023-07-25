// Return webScrapeConfig from Edge

export async function fetchWebScrapeConfig(): Promise<{ num_sites: number; recursive_depth: number; timeout_sec: number }> {
    try {
        const edgeConfigVar = process.env.EDGE_CONFIG;
        const vercelTeamID = process.env.VERCEL_TEAM_ID;
        console.log('edgeConfigVar', edgeConfigVar);
        console.log('vercelTeamID', vercelTeamID);
        const readSingleWithAuth = await fetch(
            `${edgeConfigVar}/item/web_scrape_config`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                },
            }
        );
        const result = await readSingleWithAuth.json();
        console.log(result);
        return result
    } catch (error) {
        console.log(error);
        return { num_sites: 100, recursive_depth: 1, timeout_sec: 1 }
    }
}

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

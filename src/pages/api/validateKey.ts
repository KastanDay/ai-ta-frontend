// src/pages/api/validateKey.ts
import {
    OPENAI_API_HOST,
    OPENAI_API_TYPE,
    OPENAI_API_VERSION,
    OPENAI_ORGANIZATION,
} from '@/utils/app/const'
import { NextResponse } from 'next/server'

import { decrypt } from '~/utils/crypto'
import { OpenAIError } from '~/utils/server'

export const config = {
    runtime: 'edge',
}

const handler = async (req: Request): Promise<Response> => {
    let apiKey = ''
    try {
        const { key } = (await req.json()) as {
            key: string
        }
        apiKey = key ? key : (process.env.OPENAI_API_KEY as string)

        if (key && !key.startsWith('sk-')) {
            const decryptedText = await decrypt(
                key,
                process.env.NEXT_PUBLIC_SIGNING_KEY as string,
            )
            apiKey = decryptedText as string
        }

        if (!apiKey) {
            return new Response('Warning: OpenAI Key was not found', { status: 400 })
        }

        let url = `${OPENAI_API_HOST}/v1/chat/completions`
        if (OPENAI_API_TYPE === 'azure') {
            url = `${OPENAI_API_HOST}/openai/deployments?api-version=${OPENAI_API_VERSION}`
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(OPENAI_API_TYPE === 'openai' && {
                    Authorization: `Bearer ${apiKey}`,
                }),
                ...(OPENAI_API_TYPE === 'azure' && {
                    'api-key': `${apiKey}`,
                }),
                ...(OPENAI_API_TYPE === 'openai' &&
                    OPENAI_ORGANIZATION && {
                    'OpenAI-Organization': OPENAI_ORGANIZATION,
                }),
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ "role": "user", "content": "Testing, say hi" }],
                max_tokens: 1,
            }),
        })

        const decoder = new TextDecoder()

        if (response.status !== 200) {
            const result = await response.json()
            if (result.error) {
                throw new OpenAIError(
                    result.error.message,
                    result.error.type,
                    result.error.param,
                    result.error.code,
                )
            } else {
                throw new Error(
                    `OpenAI API returned an error: ${decoder.decode(result?.value) || result.statusText
                    }`,
                )
            }
        }

        const json = await response.json()

        return new Response(JSON.stringify(json), { status: 200 })
    } catch (error) {
        if (error instanceof OpenAIError) {
            const { name, message } = error;
            console.log("Printing message here", message)
            const resp = NextResponse.json({
                statusCode: 400,
                name: name,
                message: message
            }, { status: 400 });
            console.log('Final OpenAIError resp: ', resp)
            return resp
        } else {
            const resp = NextResponse.json({ name: 'Error' }, { status: 500 });
            console.log('Final Error resp: ', resp)
            return resp
        }
    }
}

export default handler
export interface LLMProviders {
    providers: LLMProvider[]
}

// export interface Providers ['Ollama', 'OpenAI']

export interface LLMProvider {
    provider: string
    enabled: boolean
    baseUrl: string
}
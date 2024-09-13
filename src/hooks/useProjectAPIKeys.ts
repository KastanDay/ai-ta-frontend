import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { showConfirmationToast } from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'
import { AllLLMProviders } from '~/types/LLMProvider'

export function useGetProjectLLMProviders({
  projectName,
  hideApiKeys,
}: {
  projectName: string
  hideApiKeys: boolean
}) {
  // USAGE:
  // const {
  //   data: projectLLMProviders,
  //   isLoading: isLoadingprojectLLMProviders,
  //   isError: isErrorprojectLLMProviders,
  //   refetch: refetchprojectLLMProviders,
  // } = useGetProjectLLMProviders(course_name)

  return useQuery({
    queryKey: ['projectLLMProviders', projectName, hideApiKeys],
    queryFn: async () => {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName,
          hideApiKeys: hideApiKeys,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch LLM providers')
      }

      const data = await response.json()
      return data as AllLLMProviders
    },
    retry: 1, // Limit retries to 1
  })
}

export function useSetProjectLLMProviders(queryClient: QueryClient) {
  return useMutation({
    mutationFn: async ({
      projectName,
      llmProviders,
      defaultModelID,
      defaultTemperature,
    }: {
      projectName: string
      queryClient: QueryClient
      llmProviders: AllLLMProviders
      defaultModelID: string
      defaultTemperature: string
    }) => {
      const response = await fetch('/api/UIUC-api/upsertLLMProviders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName,
          llmProviders: llmProviders,
          defaultModelID: defaultModelID,
          defaultTemperature: defaultTemperature,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to set LLM providers')
      }
      return response.json()
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ['projectLLMProviders', variables.projectName],
      })
      const previousLLMProviders = queryClient.getQueryData([
        'projectLLMProviders',
        variables.projectName,
      ])
      queryClient.setQueryData(['projectLLMProviders', variables.projectName], {
        providers: variables.llmProviders,
        defaultModel: variables.defaultModelID,
        defaultTemp: parseFloat(variables.defaultTemperature),
      })
      return { previousLLMProviders }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['projectLLMProviders'],
        context?.previousLLMProviders,
      )
      showConfirmationToast({
        title: 'Failed to set LLM providers',
        message: `The database request failed with error error: ${err.name} -- ${err.message}`,
        isError: true,
      })
    },
    onSuccess: (data, variables, context) => {
      // Boom baby!
      showConfirmationToast({
        title: 'Updated LLM providers',
        message: `Now your project's users can use the supplied LLMs!`,
        isError: false,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['projectLLMProviders'],
      })
    },
  })
}

export function useGetProjectDefaultModel(course_name: string) {
  return useQuery({
    queryKey: ['projectLLMProviders', course_name],
    queryFn: async () => {
      // const response = await fetch('/api/models', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     projectName: course_name,
      //   }),
      // })

      // if (!response.ok) {
      //   throw new Error('Failed to fetch LLM providers')
      // }

      // const data = await response.json()
      // return data as AllLLMProviders
      return {
        defaultModel: 'gpt-4o-mini',
        defaultTemp: 0.1,
      }
    },
  })
}

export function useSetProjectDefaultModel(queryClient: QueryClient) {
  return useMutation({
    mutationFn: async ({
      course_name,
      defaultModelID,
      defaultTemperature,
    }: {
      course_name: string
      defaultModelID: string
      defaultTemperature: number
    }) => {
      // TODO: Write this endpoint... doesn't exist yet.
      const response = await fetch('/api/defaultModel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setDefaultModel',
          courseName: course_name,
          defaultModelID: defaultModelID,
          defaultTemperature: defaultTemperature,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to set default model')
      }
      return response.json()
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ['projectLLMProviders', variables.course_name],
      })
      const previousDefaultModel = queryClient.getQueryData([
        'projectLLMProviders',
        variables.course_name,
      ])
      queryClient.setQueryData(['projectLLMProviders', variables.course_name], {
        defaultModel: variables.defaultModelID,
        defaultTemp: variables.defaultTemperature,
      })
      return { previousDefaultModel }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['projectLLMProviders', variables.course_name],
        context?.previousDefaultModel,
      )
      showConfirmationToast({
        title: 'Failed to set default model',
        message: `The database request failed with error: ${err.name} -- ${err.message}`,
        isError: true,
      })
    },
    onSuccess: (data, variables, context) => {
      showConfirmationToast({
        title: 'Updated default model',
        message: `The default model has been successfully updated!`,
        isError: false,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['projectLLMProviders'],
      })
    },
  })
}

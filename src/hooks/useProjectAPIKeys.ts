import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { kv } from '@vercel/kv'
import { showConfirmationToast } from '~/components/UIUC-Components/api-inputs/APIKeyInputForm'
import { CourseMetadata } from '~/types/courseMetadata'
import { AllLLMProviders, LLMProvider } from '~/types/LLMProvider'

export function useGetProjectLLMProviders({
  course_name,
  filterGiesBizSchoolKeys,
}: {
  course_name: string
  filterGiesBizSchoolKeys: boolean
}) {
  // USAGE:
  // const {
  //   data: projectLLMProviders,
  //   isLoading: isLoadingprojectLLMProviders,
  //   isError: isErrorprojectLLMProviders,
  //   refetch: refetchprojectLLMProviders,
  // } = useGetProjectLLMProviders(course_name)

  return useQuery({
    queryKey: ['projectLLMProviders', course_name, filterGiesBizSchoolKeys],
    queryFn: async () => {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: course_name,
          filterGiesBizSchoolKeys: filterGiesBizSchoolKeys,
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
      course_name,
      llmProviders,
      defaultModelID,
      defaultTemperature,
    }: {
      course_name: string
      queryClient: QueryClient
      llmProviders: AllLLMProviders
      defaultModelID: string
      defaultTemperature: string
    }) => {
      // TODO: update llmProviders to upsertCourseMetadata
      const response = await fetch('/api/UIUC-api/llmProviders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setLLMProviders',
          courseName: course_name,
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
        queryKey: ['projectLLMProviders', variables.course_name],
      })
      const previousLLMProviders = queryClient.getQueryData([
        'projectLLMProviders',
        variables.course_name,
      ])
      queryClient.setQueryData(['projectLLMProviders', variables.course_name], {
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

import { useCallback } from 'react'

import { useFetch } from '@/hooks/useFetch'

export interface GetModelsRequestProps {
  projectName: string
}

const useApiService = () => {
  const fetchService = useFetch()

  // const getModels = useCallback(
  // 	(
  // 		params: GetManagementRoutineInstanceDetailedParams,
  // 		signal?: AbortSignal
  // 	) => {
  // 		return fetchService.get<GetManagementRoutineInstanceDetailed>(
  // 			`/v1/ManagementRoutines/${params.managementRoutineId}/instances/${params.instanceId
  // 			}?sensorGroupIds=${params.sensorGroupId ?? ''}`,
  // 			{
  // 				signal,
  // 			}
  // 		);
  // 	},
  // 	[fetchService]
  // );

  const getModels = useCallback(
    (params: GetModelsRequestProps, signal?: AbortSignal) => {
      return fetchService.post<GetModelsRequestProps>(`/api/models`, {
        body: { projectName: params.projectName },
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      })
    },
    [fetchService],
  )

  return {
    getModels,
  }
}

export default useApiService

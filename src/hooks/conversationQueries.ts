import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { Conversation } from '~/types/chat'
import {
  deleteConversationFromServer,
  fetchConversationHistory,
  saveConversationToServer,
} from '~/utils/app/conversation'

// import query client
// import { useQueryClient } from 'react-query'
// const queryClient = useQueryClient()

export function useFetchConversationHistory(user_email: string) {
  // console.log('useFetchConversationHistory with user_email: ', user_email)
  return useQuery({
    queryKey: ['conversationHistory', user_email],
    queryFn: () => (user_email ? fetchConversationHistory(user_email) : []),
    // enabled: !!user_email,
    // refetchInterval: 200_000,
  })
}

// export function useCreateConversation(queryClient: QueryClient) {
//     console.log('useCreateConversation with queryClient: ', queryClient)
//   return useMutation({
//     // mutationKey: ['createConversation'],
//     mutationFn: async (newConversation: Conversation) =>
//       saveConversationToServer(newConversation),
//     onMutate: async (newConversation: Conversation) => {
//       console.log('Mutation from useCreateConversation: ', newConversation)
//       // A mutation is about to happen!
//       // Optimistically update the conversation
//       // Steps:
//       // 1. Cancel the query to prevent it from refetching
//       // 2. Use the queryClient to update the conversationHistory query result
//       // 3. Return the new conversation to the success handler

//       // Step 1: Cancel the query to prevent it from refetching
//     //   await queryClient.cancelQueries({
//     //     queryKey: ['conversationHistory', newConversation.userEmail],
//     //   })
//     const queryKey = ['conversationHistory', newConversation.userEmail]
//     const checkingOldData = await queryClient.getQueryData(queryKey)
//     console.log('checkingOldData: ', checkingOldData)
//       // Step 2: Perform the optimistic update
//       console.log('newConversation to be updated: ', newConversation)
//     //   queryClient.setQueryData(
//     //     ['conversationHistory', newConversation.userEmail],
//     //     (oldData: Conversation[] | []) => {
//     //         console.log('oldData in usecreate mut: ', oldData)
//     //       return [newConversation, ...oldData]
//     //     },
//     //   )

//       // Step 3: Return the new conversation
//       return newConversation
//     },
//     onError: (error, variables, context) => {
//       // An error happened!
//       // Rollback the optimistic update
//     //   queryClient.setQueryData(
//     //     ['conversationHistory', variables.userEmail],
//     //     context,
//     //   )
//       console.error(
//         'Error saving updated conversation to server:',
//         error,
//         context,
//       )
//     },
//     onSuccess: (data, variables, context) => {
//       // The mutation was successful!
//       // Do something with the updated conversation
//       // updateConversation(data)
//       // No need to do anything here because the conversationHistory query will be invalidated
//     },
//     onSettled: (data, error, variables, context) => {
//       // The mutation is done!
//       // Do something here, like closing a modal
//       console.log('Invalidating query: ', variables)
//       queryClient.invalidateQueries({
//         queryKey: ['conversationHistory', variables.userEmail],
//       })
//     },
//   })
// }

// export function useUpdateConversation(
//   user_email: string,
//   queryClient: QueryClient,
// ) {
//     console.log('useUpdateConversation with user_email: ', user_email)
//   return useMutation({
//     mutationKey: ['updateConversation', user_email],
//     mutationFn: async (conversation: Conversation) =>
//       saveConversationToServer(conversation),
//     onMutate: async (updatedConversation: Conversation) => {
//       console.log('Mutation from useUpdateConversation: ', updatedConversation)
//       // A mutation is about to happen!
//       // Optimistically update the conversation
//       // Steps:
//       // 1. Cancel the query to prevent it from refetching
//       // 2. Use the queryClient to update the conversationHistory query result
//       // 3. Add the old conversation to the context
//       // 4. Return the updated conversation and old conversation to the success handler
//       let oldConversation = null
//       if (user_email !== undefined) {
//         console.log('user_email in update mutation: ', user_email)
//         // Step 1: Cancel the query to prevent it from refetching
//         // await queryClient.cancelQueries({
//         //   queryKey: ['conversationHistory', user_email],
//         // })

//         // Step 2: Perform the optimistic update
//         // queryClient.setQueryData(
//         //   ['conversationHistory', user_email],
//         //   (oldData: Conversation[]) => {
//         //     console.log('oldData: ', oldData)
//         //     return oldData.map((c: Conversation) => {
//         //       if (c.id === updatedConversation.id) {
//         //         return updatedConversation
//         //       }
//         //       return c
//         //     })
//         //   },
//         // )

//         // Step 3: Add old conversation to react query context
//         // oldConversation = (
//         //   queryClient.getQueryData([
//         //     'conversationHistory',
//         //     user_email,
//         //   ]) as Conversation[]
//         // ).find((c: Conversation) => c.id === updatedConversation.id)
//         // Step 4: Return the updated conversation
//       } else {
//         console.log('user_email is undefined in update mutation')
//       }
//     //   return { oldConversation, updatedConversation }
//     },
//     // onError: (error, variables, context) => {
//     //   // An error happened!
//     //   // Rollback the optimistic update
//     // //   queryClient.setQueryData(
//     // //     ['conversationHistory', user_email],
//     // //     context?.oldConversation,
//     // //   )
//     //   console.error(
//     //     'Error saving updated conversation to server:',
//     //     error,
//     //     context,
//     //   )
//     // },
//     // onSuccess: (data, variables, context) => {
//     //   // The mutation was successful!
//     //   // Do something with the updated conversation
//     //   // updateConversation(data)
//     //   // No need to do anything here because the conversationHistory query will be invalidated
//     // },
//     // onSettled: (data, error, variables, context) => {
//     //   // The mutation is done!
//     //   // Do something here, like closing a modal
//     //   console.log('Invalidating query: ', variables)
//     //   queryClient.invalidateQueries({
//     //     queryKey: ['conversationHistory', user_email],
//     //   })
//     // },
//   })
// }

// export function useDeleteConversation(
//   user_email: string,
//   queryClient: QueryClient,
// ) {
//     console.log('useDeleteConversation')
//   return useMutation({
//     mutationKey: ['deleteConversation', user_email],
//     mutationFn: async (deleteConversation: Conversation) =>
//       deleteConversationFromServer(deleteConversation.id),
//     onMutate: async (deletedConversation: Conversation) => {
//       // Step 1: Cancel the query to prevent it from refetching
//     //   await queryClient.cancelQueries({
//     //     queryKey: ['conversationHistory', deletedConversation.userEmail],
//     //   })
//       // Step 2: Perform the optimistic update
//     //   queryClient.setQueryData(
//     //     ['conversationHistory', deletedConversation.userEmail],
//     //     (oldData: Conversation[]) => {
//     //       return oldData.filter(
//     //         (c: Conversation) => c.id !== deletedConversation.id,
//     //       )
//     //     },
//     //   )
//       // Step 3: Create a context object with the deleted conversation
//     //   const oldConversation = queryClient.getQueryData([
//     //     'conversationHistory',
//     //     deletedConversation.userEmail,
//     //   ])
//       // Step 4: Return the deleted and old conversation to the success handler
//     //   return { oldConversation, deletedConversation }
//     },
//     onError: (error, variables, context) => {
//       // An error happened!
//       // Rollback the optimistic update
//     //   queryClient.setQueryData(
//     //     ['conversationHistory', user_email],
//     //     context?.oldConversation,
//     //   )
//       console.error(
//         'Error saving updated conversation to server:',
//         error,
//         context,
//       )
//     },
//     onSuccess: (data, variables, context) => {
//       // The mutation was successful!
//       // Do something with the updated conversation
//       // updateConversation(data)
//     },
//     onSettled: (data, error, variables, context) => {
//       // The mutation is done!
//       // Do something here, like closing a modal
//       console.log('Invalidating query: ', variables)
//       queryClient.invalidateQueries({
//         queryKey: ['conversationHistory', user_email],
//       })
//     },
//   })
// }

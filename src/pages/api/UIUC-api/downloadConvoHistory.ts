import axios from 'axios'

interface DownloadResult {
  message: string
}

export const downloadConversationHistory = async (
  courseName: string,
): Promise<DownloadResult> => {
  try {
    const response = await axios.get(
      `https://flask-pr-327-vyriad-custom.up.railway.app/export-convo-history?course_name=${courseName}`,
      { responseType: 'blob' },
    )

    if (response.headers['content-type'] === 'application/json') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function () {
          const jsonData = JSON.parse(reader.result as string)
          if (jsonData.response === 'Download from S3') {
            resolve({
              message:
                "We are gathering your large conversation history, you'll receive an email with a download link shortly.",
            })
          } else {
            resolve({
              message: 'Your conversation history is ready for download.',
            })
          }
        }
        reader.onerror = reject
        reader.readAsText(new Blob([response.data]))
      })
    } else if (response.headers['content-type'] === 'application/zip') {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', courseName.substring(0, 10) + '-convos.zip')
      document.body.appendChild(link)
      link.click()
      return { message: 'Downloading now, check your downloads.' }
    }
  } catch (error) {
    console.error('Error exporting documents:', error)
    return { message: 'Error exporting documents.' }
  }
  return { message: 'Unexpected error occurred.' }
}
//   }
//     } else {
//       const url = window.URL.createObjectURL(new Blob([response.data]))
//       const link = document.createElement('a')
//       link.href = url
//       link.setAttribute('download', courseName + '_conversation_history.csv')
//       document.body.appendChild(link)
//       link.click()
//       return { message: "Your download will start shortly." };
//     }
//   } catch (error) {
//     console.error('Error fetching conversation history:', error)
//     return { message: 'Error fetching conversation history.' };
//   }
// }

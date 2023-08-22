import { NextPage } from 'next'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
// import { Card, Image, Text, Title, Badge, Button, Group } from '@mantine/core'

const DisclaimerPage: NextPage = () => {
  return (
    <MainPageBackground>
      <p style={{ whiteSpace: 'pre-line' }}>{disclaimer_string}</p>
    </MainPageBackground>
  )
}

const disclaimer_string = `IMPORTANT: PLEASE READ THIS DISCLAIMER CAREFULLY BEFORE UTILIZING THIS AI-POWERED CHATBOT ("Chatbot") DEVELOPED BY THE CENTER FOR AI INNOVATION AT NCSA ("we," "us," or "our"). YOUR ACCESS AND USE OF THE CHATBOT CONSTITUTES YOUR ACKNOWLEDGEMENT AND ACCEPTANCE OF THE TERMS OF THIS DISCLAIMER.
1.	FOR GENERAL INFORMATION PURPOSES ONLY: The Chatbot is designed to provide general information based on the materials available at the time of its creation. The information provided by the Chatbot is not intended to replace or substitute for any professional, academic, or student analysis.
2.	NO GUARANTEE OF ACCURACY: We endeavor to ensure that the information provided by the Chatbot is accurate. However, we cannot guarantee the accuracy, completeness, or current relevance of the information provided. The information may not reflect the most recent updates or changes.
3.	INFORMATION GATHERING AND POTENTIAL INACCURACY: The Chatbot uses the provided materials to offer general guidance on course-related matters. Despite our efforts to ensure accuracy, we cannot guarantee the precision, completeness, or current relevance of the information derived from these materials. The Chatbot may occasionally provide information that is inaccurate or outdated due to changes in course materials or website content. We strongly recommend that you cross-verify any information provided by the Chatbot with the actual course material sources before making any decisions or taking any actions based on the information received.
4.	REPORTING INACCURACIES: If you identify any inaccuracies in the information provided by the Chatbot, we encourage you to notify us so that we can rectify the issue.
5.	LIMITATION OF LIABILITY: Under no circumstances shall we be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses resulting from the use of or inability to use the Chatbot.
6.	INDEMNIFICATION: You agree to indemnify and hold us harmless from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of your use of the Chatbot, your violation of this disclaimer, or your violation of any rights of another.
7.	NO WARRANTIES: The Chatbot is provided on an "as is" and "as available" basis. We expressly disclaim all warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
8.	THIRD-PARTY LINKS: The Chatbot may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
9.	GOVERNING LAW: This disclaimer shall be governed by and construed in accordance with the laws of the jurisdiction in which we are located, without regard to its conflict of law provisions.
BY USING THE CHATBOT, YOU ACKNOWLEDGE AND AGREE TO THIS DISCLAIMER AND ITS TERMS. IF YOU DO NOT AGREE WITH ANY PART OF THIS DISCLAIMER, YOU ARE ADVISED NOT TO USE THE CHATBOT. WE RESERVE THE RIGHT TO MODIFY OR UPDATE THIS DISCLAIMER AT ANY TIME WITHOUT PRIOR NOTICE. YOUR CONTINUED USE OF THE CHATBOT FOLLOWING ANY CHANGES CONSTITUTES YOUR ACCEPTANCE OF THE REVISED DISCLAIMER.`

const depricated_disclaimer_string = `Disclaimer: uiuc.chat's Chatbot is Imperfect
Please read this disclaimer carefully before using this website or Chatbot ("Chatbot") provided by https://uiuc.chat ("we," "us," or "our"). By accessing and using the Chatbot on our website, you acknowledge and agree to the terms of this disclaimer.
1.	General Information Purposes Only: The Chatbot is designed to provide general information only with respect to this course's materials. The information provided by the Chatbot should not be considered a replacement for student work or analysis.
2.	No Guarantee of Accuracy: While we strive to provide accurate information through the Chatbot, we cannot guarantee the accuracy, completeness, or up-to-date nature of the information provided. The information provided may not reflect the most recent changes.
3.	Information Gathering and Potential Inaccuracy: The Chatbot gathers information from the course materials only to provide general guidance on course-related matters. While we make every effort to ensure that the information provided is accurate, we cannot guarantee the accuracy, completeness, or up-to-date nature of the information obtained from these material sources. The Chatbot may, at times, provide information that is inaccurate or outdated due to changes in laws, regulations, or website content. We encourage you to verify any information provided by the Chatbot with a the course material sources before taking any action or making any decisions based on the information received.
4.	Reporting Inaccuracies: If you discover any inaccuracies in the information provided by the Chatbot, we kindly ask you to notify us so that we may address the issue. 
By using the Chatbot, you acknowledge and agree to this disclaimer and its terms. If you do not agree with any part of this disclaimer, please refrain from using the Chatbot. We reserve the right to modify or update this disclaimer at any time without prior notice. Your continued use of the Chatbot after any changes signifies your acceptance of the revised disclaimer.
`

export default DisclaimerPage

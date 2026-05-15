// Mock utility for Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNs)

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<boolean> {
  // In a real system, you would look up the user's registered device tokens
  // from the database and send the payload via an FCM SDK.

  console.log(`[PUSH NOTIFICATION] To: User ${userId}`)
  console.log(`Title: ${title}`)
  console.log(`Body: ${body}`)
  console.log(`Data: ${JSON.stringify(data)}`)

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  return true
}

import { S3 } from 'aws-sdk'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('generateUploadUrl')
const s3 = new S3({ signatureVersion: 'v4' })
const bucketName = process.env.ATTACHMENTS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export async function handler(event) {
  logger.info('Processing GenerateUploadUrl event', { event })
  const todoId = event.pathParameters.todoId

  // Generate the presigned URL for S3
  const uploadUrl = s3.getSignedUrl('putObject', {
                                      Bucket: bucketName,
                                      Key: `${todoId}.png`,  // You can choose a different file extension if needed
                                      Expires: parseInt(urlExpiration)
                                    })

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl
    })
  }
}

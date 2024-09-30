import { DynamoDB } from 'aws-sdk'
import { decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('getTodos')
const docClient = new DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  // TODO: Get all TODO items for a current user
  logger.info('Processing GetTodos event', { event })
  
  const authorization = event.headers.Authorization || event.headers.authorization
  if (!authorization) {
    throw new Error('No authorization header')
  }
  const jwtToken = authorization.split(' ')[1]
  const userId = decode(jwtToken).sub

  const params = {
    TableName: todosTable,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValue: {
      ':userId': userId
    }
  }

  try {
    const result = await docClient.query(params).promise()
    logger.info('Query successful', { result })
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items: result.Items
      })
    }
  } catch (e) {
    logger.error('Query failed', { e })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }, 
      body: JSON.stringify({
        error: 'Could not retrieve TODO items'
      })
    }
  }
}

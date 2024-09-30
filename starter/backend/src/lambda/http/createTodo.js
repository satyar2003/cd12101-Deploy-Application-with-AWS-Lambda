import { DynamoDB } from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('createTodo')
const docClient = new DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  logger.info('Processing CreateTodo event', { event })
  const newTodo = JSON.parse(event.body)

  // Get authorization header
  const authorization = event.headers.Authorization || event.headers.authorization
  if (!authorization) {
    throw new Error('No authorization header')
  }
  const jwtToken = authorization.split(' ')[1]
  const userId = decode(jwtToken).sub

  const todoId = uuidv4()
  const createdAt = new Date().toISOString()
  const newItem = {
    todoId,
    userId,
    createdAt,
    ...newTodo,
    done: false
  }

  const params = {
    TableName: todosTable,
    Item: newItem
  }

  try {
    await docClient.put(params).promise()
    logger.info('TODO item created', { newItem })
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',  
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        item: newItem
      })
    }
  } catch (e) {
    logger.error('Error creating TODO item', { e })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',  
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Could not create TODO item'
      })
    }
  }
}

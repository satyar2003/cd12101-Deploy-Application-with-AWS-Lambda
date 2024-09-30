import { DynamoDB } from 'aws-sdk'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('deleteTodo')
const docClient = new DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  logger.info('Processing DeleteTodo event', { event })
  const todoId = event.pathParameters.todoId
  
  const authorization = event.headers.Authorization || event.headers.authorization
  if (!authorization) {
    throw new Error('No authorization header')
  }
  const jwtToken = authorization.split(' ')[1]
  const userId = decode(jwtToken).sub

  const params = {
    TableName: todosTable,
    Key: {
      userId: userId,   
      todoId: todoId    
    },
    ConditionExpression: "attribute_exists(todoId) AND userId = :userId",  
    ExpressionAttributeValues: {
      ":userId": userId
    }
  }

  try {
    await docClient.delete(params).promise()
    logger.info('Todo item deleted', { todoId })

    return {
      statusCode: 204,  
      headers: {
        'Access-Control-Allow-Origin': '*',  // CORS header
        'Access-Control-Allow-Credentials': true  // CORS header
      },
      body: null  
    }
  } catch (error) {
    logger.error('Error deleting TODO item', { error })

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',  // CORS header
        'Access-Control-Allow-Credentials': true  // CORS header
      },
      body: JSON.stringify({
        error: 'Could not delete TODO item'
      })
    }
  }
}

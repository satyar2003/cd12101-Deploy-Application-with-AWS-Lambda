import { DynamoDB } from 'aws-sdk'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('updateTodo')
const docClient = new DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  logger.info('Processing UpdateTodo event', { event })
  const todoId = event.pathParameters.todoId
  const updatedTodo = JSON.parse(event.body)

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
    UpdateExpression: "set #name = :name, dueDate = :dueDate, done = :done",
    ExpressionAttributeNames: {
      "#name": "name"  
    },
    ExpressionAttributeValues: {
      ":name": updatedTodo.name,
      ":dueDate": updatedTodo.dueDate,
      ":done": updatedTodo.done
    },
    ConditionExpression: "attribute_exists(todoId) AND userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":name": updatedTodo.name,
      ":dueDate": updatedTodo.dueDate,
      ":done": updatedTodo.done
    },
    ReturnValues: "UPDATED_NEW"
  }
  
  try {
    await docClient.update(params).promise()
    logger.info('TODO item updated', { todoId, updatedTodo })

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },  
      body: null  
    }
  } catch (error) {
    logger.error('Error updating TODO item', { error })

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Could not update TODO item'
      })
    }
  }
}

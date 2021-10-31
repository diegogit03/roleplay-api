import { Exception } from '@adonisjs/core/build/standalone'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class BadRequestException extends Exception {
  public code = 'BAD_REQUEST'

  public async handle (error: this, { response }: HttpContextContract) {
    return response.status(error.status)
      .send({
        code: error.code,
        message: error.message,
        status: error.status
      })
  }
}

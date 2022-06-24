import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Mail from '@ioc:Adonis/Addons/Mail'
import User from 'App/Models/User'
import { randomBytes } from 'crypto'
import { promisify } from 'util';
import ForgotPasswordValidator from 'App/Validators/ForgotPasswordValidator';
import ResetPasswordValidator from 'App/Validators/ResetPasswordValidator';
import TokenExpiredException from 'App/Exceptions/TokenExpiredException';

export default class PasswordsController {
  public async forgotPassword ({ request, response }: HttpContextContract) {
    const { email, resetPasswordUrl } = await request.validate(ForgotPasswordValidator)
    const user = await User.findByOrFail('email', email)

    const random = await promisify(randomBytes)(24)
    const token = random.toString('hex')
    await user.related('tokens').updateOrCreate(
      { userId: user.id },
      {
        token
      }
    )

    await Mail.send(message => {
      message
        .from('no-reply@roleplay.com')
        .to(email)
        .subject('Roleplay: recuperação de senha')
        .text('Clique no link abaixo parar recuperar a senha')
        .htmlView('emails/forgotPassword', {
          productName: 'Roleplay',
          name: user.username,
          resetPasswordUrl: `${resetPasswordUrl}?token=${token}`
        })
    })

    return response.noContent()
  }

  public async resetPassword ({  request, response }: HttpContextContract) {
    const { token, password } = await request.validate(ResetPasswordValidator)

    const userByToken = await User.query().whereHas('tokens', query => {
        query.where('token', token)
      })
      .preload('tokens')
      .firstOrFail()

    const tokenAge = Math.abs(userByToken.tokens[0].createdAt.diffNow('hours').hours)

    if (tokenAge > 2) throw new TokenExpiredException()

    userByToken.password = password
    await userByToken.save()
    await userByToken.tokens[0].delete()

    return response.noContent()
  }
}

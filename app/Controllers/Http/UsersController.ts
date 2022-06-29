import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import User from 'App/Models/User'
import CreateUserValidator from 'App/Validators/CreateUserValidator';
import UpdateUserValidator from 'App/Validators/UpdateUserValidator';

export default class UsersController {

  public async store ({ request, response }: HttpContextContract) {
    const userPayload = await request.validate(CreateUserValidator)

    const userByEmail = await User.findBy('email', userPayload.email)

    if (userByEmail)
      throw new BadRequestException('email already in use', 409);

    const userByUsername = await User.findBy('username', userPayload.username)

    if (userByUsername)
      throw new BadRequestException('username already in use', 409);

    const user = await User.create(userPayload)

    return response.created(user)
  }

  public async update ({ params: { id }, request, response, bouncer }: HttpContextContract) {
    const userPayload = await request.validate(UpdateUserValidator)
    const user = await User.findOrFail(id)

    await bouncer.authorize('updateUser', user)

    user.merge(userPayload)
    await user.save()

    return response.ok(user)
  }

}

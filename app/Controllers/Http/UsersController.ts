import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import User from 'App/Models/User'
import CreateUserValidator from 'App/Validators/CreateUserValidator';

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

  public async update ({ params: { id }, request, response }: HttpContextContract) {
    const userPayload = request.only(['email', 'avatar', 'password'])
    const user = await User.findOrFail(id)

    user.merge(userPayload)
    await user.save()

    return response.ok(user)
  }

}

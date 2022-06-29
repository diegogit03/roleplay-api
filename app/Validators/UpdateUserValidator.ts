import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UpdateUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    username: schema.string.optional(),
    password: schema.string.optional({}, [rules.minLength(4)]),
    email: schema.string.optional({}, [rules.email()]),
    avatar: schema.string.optional()
  })

  public messages: CustomMessages = {}
}

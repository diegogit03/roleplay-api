import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateGroupValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string(),
    description: schema.string(),
    chronic: schema.string(),
    location: schema.string(),
    schedule: schema.string(),
    master: schema.number()
  })

  public messages: CustomMessages = {}
}

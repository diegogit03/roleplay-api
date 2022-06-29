import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import { test } from '@japa/runner'

test.group('Sessions', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('It should create an session', async ({ client, assert }) => {
    const plainPassword = 'test'
    const user = await UserFactory.merge({ password: plainPassword }).create()

    const response = await client.post('/sessions')
      .json({
        email: user.email,
        password: plainPassword
      })

    response.assertStatus(201)
    assert.isDefined(response.body().user, 'User Undefined')
    assert.equal(response.body().user.id, user.id)
  })

  test('It should returrn an api token when session is created', async ({ client, assert }) => {
    const plainPassword = 'test'
    const user = await UserFactory.merge({ password: plainPassword }).create()

    const response = await client.post('/sessions')
      .json({
        email: user.email,
        password: plainPassword
      })

    response.assertStatus(201)
    assert.isDefined(response.body().token, 'Token Undefined')
    assert.equal(response.body().user.id, user.id)
  })

  test('It should return 400 when credentials are invalid', async ({ client }) => {
    const response = await client.post('/sessions')

    response.assertStatus(400)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 400 })
  })

  test('It should return 400 when credentials are not provided', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.post('/sessions')
      .json({
        email: user.email,
        password: 'test'
      })

    response.assertStatus(400)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 400 })
  })

  test('It should return 200 when user signs out', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.delete('/sessions')
      .loginAs(user)

    response.assertStatus(200)
  })

  test('It should revoke token when user signs out', async ({ client, assert }) => {
    const plainPassword = 'test'
    const user = await UserFactory.merge({ password: plainPassword }).create()

    const response = await client.post('/sessions')
      .json({
        email: user.email,
        password: plainPassword
      })

    const apiToken = response.body().token

    await client.delete('/sessions')
      .header('Authorization', `Bearer ${apiToken.token}`)

    const token = await Database.query()
      .select('*')
      .from('api_tokens')
      .where('token', apiToken.token)

    assert.isEmpty(token)
  })
})

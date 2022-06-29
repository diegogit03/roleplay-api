import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import { test } from '@japa/runner'

test.group('Users', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

	test('it should create an user', async ({ assert, client }) => {
		const userPayload = {
			email: 'test@test.com',
			username: 'test',
			password: 'test'
		}

		const response = await client
			.post('/users')
			.json(userPayload)

    assert.exists(response.body().id, 'Id undefined')
    assert.equal(response.body().email, userPayload.email)
    assert.equal(response.body().username, userPayload.username)
    assert.notExists(response.body().password, 'Password defined')
	})

  test('it should return 409 when email is already in use', async ({ assert, client }) => {
    const { email } = await UserFactory.create()
    const response = await client
      .post('/users')
      .json({
        email,
        username: 'test',
        password: 'test'
      })

    assert.include(response.body().message, 'email')
    assert.equal(response.body().code, 'BAD_REQUEST')
    assert.equal(response.body().status, 409)
  })

  test('it should return 409 when username is already in use', async ({ assert, client }) => {
    const { username } = await UserFactory.create()
    const response = await client
      .post('/users')
      .json({
        email: 'test@test.com',
        username,
        password: 'test'
      })

    assert.include(response.body().message, 'username')
    assert.equal(response.body().code, 'BAD_REQUEST')
    assert.equal(response.body().status, 409)
  })

  test('it should return 422 when required data is not provided', async ({ client }) => {
    const response = await client
      .post('/users')
      .json({})

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 422 })
  })

  test('it should return 422 when providing an invalid email', async ({ client }) => {
    const response = await client
      .post('/users')
      .json({
        email: 'test@',
        username: 'test',
        password: 'test'
      })

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 422 })
  })

  test('it should return 422 when providing an invalid password', async ({ client }) => {
    const response = await client
      .post('/users')
      .json({
        email: 'test@test.com',
        username: 'test',
        password: 'tes'
      })

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 422 })
  })

  test('it should update an user', async ({ client }) => {
    const user = await UserFactory.create()
    const email = 'test@test.com'
    const avatar = 'https://github.com/diegogit03'

    const response = await client
      .put('/users/' + user.id)
      .loginAs(user)
      .loginAs(user)
      .json({
        email,
        avatar,
        password: user.password
      })

    response.assertBodyContains({
      id: user.id,
      email,
      avatar
    })
  })

  test('it should return 422 when providing an invalid email', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .put('/users/' + user.id)
      .loginAs(user)
      .json({
        email: 'test@',
        username: 'test',
        password: 'test'
      })

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 422 })
  })

  test('it should return 422 when providing an invalid password', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .put('/users/' + user.id)
      .loginAs(user)
      .json({
        email: 'test@test.com',
        username: 'test',
        password: 'tes'
      })

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 422 })
  })
})

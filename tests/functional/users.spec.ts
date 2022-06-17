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

  test('it should return 422 when required data is not provided', async ({ assert, client }) => {
    const response = await client
      .post('/users')
      .json({})

    assert.equal(response.body().code, 'BAD_REQUEST')
    assert.equal(response.body().status, 422)
  })

  test('it should return 422 when providing an invalid email', async ({ assert, client }) => {
    const response = await client
      .post('/users')
      .json({
        email: 'test@',
        username: 'test',
        password: 'test'
      })

    assert.equal(response.body().code, 'BAD_REQUEST')
    assert.equal(response.body().status, 422)
  })

  test('it should return 422 when providing an invalid password', async ({ assert, client }) => {
    const response = await client
      .post('/users')
      .json({
        email: 'test@test.com',
        username: 'test',
        password: 'tes'
      })

    assert.equal(response.body().code, 'BAD_REQUEST')
    assert.equal(response.body().status, 422)
  })

  test('it should update an user', async ({ assert, client }) => {
    const { id, password } = await UserFactory.create()
    const email = 'test@test.com'
    const avatar = 'https://github.com/diegogit03'

    const response = await client
      .put('/users/' + id)
      .json({
        email,
        avatar,
        password
      })

    assert.equal(response.body().id, id)
    assert.equal(response.body().email, email)
    assert.equal(response.body().avatar, avatar)
  })
})

import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Users', group => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })

	test('it should create an user', async assert => {
		const userPayload = {
			email: 'test@test.com',
			username: 'test',
			password: 'test'
		}

		const { body } = await supertest(BASE_URL)
			.post('/users')
			.send(userPayload)
			.expect(201)

    assert.exists(body.id, 'Id undefined')
    assert.equal(body.email, userPayload.email)
    assert.equal(body.username, userPayload.username)
    assert.notExists(body.password, 'Password defined')
	})

  test('it should return 409 when email is already in use', async assert => {
    const { email } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email,
        username: 'test',
        password: 'test'
      })
      .expect(409)

    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 409 when username is already in use', async assert => {
    const { username } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'test@test.com',
        username,
        password: 'test'
      })
      .expect(409)

    assert.include(body.message, 'username')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 422 when required data is not provided', async assert => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({})
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid email', async assert => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'test@',
        username: 'test',
        password: 'test'
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid password', async assert => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'test@test.com',
        username: 'test',
        password: 'tes'
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })
})

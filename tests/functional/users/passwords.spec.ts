import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import { test } from '@japa/runner'
import Mail, { MessageNode } from '@ioc:Adonis/Addons/Mail'
import Hash from '@ioc:Adonis/Core/Hash'
import { DateTime, Duration } from 'luxon'

test.group('Password', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('It should send an email with forgot password instructions', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const mailer = Mail.fake()

    const response = await client
      .post('/forgot-password')
      .json({
        email: user.email,
        resetPasswordUrl: 'url'
      })

    response.assertStatus(204)

    const message = mailer.find(mail => {
      return mail.to![0].address === user.email
    }) as MessageNode

    assert.equal(message.to![0].address, user.email)
    assert.equal(message.subject, 'Roleplay: recuperação de senha')
    assert.include(message.html, user.username)

    Mail.restore()
  })

  test('It should create a reset token', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/forgot-password')
      .json({
        email: user.email,
        resetPasswordUrl: 'url'
      })

    response.assertStatus(204)
    const tokens = await user.related('tokens').query()
    assert.isNotEmpty(tokens)
  })

  test('It should return 422 when required data is not provided or data is invalid', async ({ client }) => {
    const response = await client
      .post('/forgot-password')
      .json({
        email: '',
        resetPasswordUrl: ''
      })

    response.assertStatus(422)
    response.assertBodyContains({ status: 422, code: 'BAD_REQUEST' })
  })

  test('It should be able to reset password', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const { token } = await user.related('tokens').create({ token: 'token' })

    const response = await client
      .post('reset-password')
      .json({
        token,
        password: '123456'
      })

    response.assertStatus(204)
    await user.refresh()
    const checkPassword = await Hash.verify(user.password, '123456')
    assert.isTrue(checkPassword)
  })

  test('It should return 422 when required data is not provided or data is invalid', async ({ client }) => {
    const response = await client
      .post('/reset-password')
      .json({
        token: '',
        password: ''
      })

    response.assertStatus(422)
    response.assertBodyContains({ status: 422, code: 'BAD_REQUEST' })
  })

  test('It should return 404 when using the same token twice', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const { token } = await user.related('tokens').create({ token: 'token' })

    await client
      .post('reset-password')
      .json({
        token,
        password: '123456'
      })

    const secondResponse = await client
      .post('reset-password')
      .json({
        token,
        password: '12345'
      })

    secondResponse.assertStatus(404)
    secondResponse.assertBodyContains({ status: 404, code: 'BAD_REQUEST' })

    await user.refresh()
    const checkPassword = await Hash.verify(user.password, '12345')
    assert.isFalse(checkPassword)
  })

  test('It cannot reset password when token is expired after 2 hours', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const date = DateTime.now().minus(Duration.fromISOTime('02:01'))
    const { token } = await user.related('tokens').create({ token: 'token', createdAt: date })

    const firstResponse = await client
      .post('reset-password')
      .json({
        token,
        password: '123456'
      })

    firstResponse.assertStatus(410)
    firstResponse.assertBodyContains({ code: 'TOKEN_EXPIRED', status: 410 })
  })
})

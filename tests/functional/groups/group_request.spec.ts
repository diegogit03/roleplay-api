import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'
import GroupRequest from 'App/Models/GroupRequest'
import { GroupFactory, UserFactory } from 'Database/factories'

test.group('Group Request', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('It should create a group request', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.with('masterUser').create()

    const response = await client.post(`/groups/${group.id}/requests`).loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({
      groupRequest: {
        userId: user.id,
        groupId: group.id,
        status: 'PENDING'
      }
    })
  })

  test('It should return 409 when group request already exists', async ({ client }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.with('masterUser').create()

    await client.post(`/groups/${group.id}/requests`).loginAs(user)

    const response = await client.post(`/groups/${group.id}/requests`).loginAs(user)

    response.assertStatus(409)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 409 })
  })

  test('It should return 422 when user is already in the group', async ({ client }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.with('masterUser').create()

    group.related('players').attach([user.id])

    const response = await client.post(`/groups/${group.id}/requests`).loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 422 })
  })

  test('It should list group requests by master', async ({ client }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: user.id }).create()
    const groupRequest = await GroupRequest.create({ groupId: group.id, userId: user.id })

    await group.load('masterUser')

    const response = await client.get(`/groups/${group.id}/requests`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      groupRequests: [{
        id: groupRequest.id,
        groupId: groupRequest.groupId,
        userId: groupRequest.userId,
        status: 'PENDING',
        group: {
          name: group.name
        },
        user: {
          username: group.masterUser.username
        }
      }]
    })
  })

  test('It should return an empty list when master has no group request', async ({ client }) => {
    const master = await UserFactory.create()
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: master.id }).create()

    await GroupRequest.create({ groupId: group.id, userId: master.id })

    const response = await client.get(`/groups/${group.id}/requests`).loginAs(user)

    response.assertStatus(200)
    response.assertBody({ groupRequests: [] })
  })

  test('It should accept a group request', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: user.id }).create()
    const groupRequest = await GroupRequest.create({ groupId: group.id, userId: user.id })

    const response = await client.post(`/groups/${group.id}/requests/${groupRequest.id}/accept`)
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ groupRequest: { userId: user.id, groupId: group.id, status: 'ACCEPTED' } })

    await group.load('players')

    assert.isNotEmpty(group.players)
    assert.equal(group.players.length, 1)
    assert.equal(group.players[0].id, user.id)
  })

  test('It should return 404 when providing an unexisting group', async ({ client }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: user.id }).create()
    const groupRequest = await GroupRequest.create({ groupId: group.id, userId: user.id })

    const response = await client.post(`/groups/${Math.random()}/requests/${groupRequest.id}/accept`)
      .loginAs(user)

    response.assertStatus(404)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 404 })
  })

  test('It should return 404 when providing an unexisting request group', async ({ client }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: user.id }).create()

    const response = await client.post(`/groups/${group.id}/requests/${Math.random()}/accept`)
      .loginAs(user)

    response.assertStatus(404)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 404 })
  })

  test('It should reject a group request', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: user.id }).create()
    const groupRequest = await GroupRequest.create({ groupId: group.id, userId: user.id })

    const response = await client.delete(`/groups/${group.id}/requests/${groupRequest.id}`)
      .loginAs(user)

    response.assertStatus(204)
  })

  test('It should return 404 when providing an unexisting group', async ({ client }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: user.id }).create()
    const groupRequest = await GroupRequest.create({ groupId: group.id, userId: user.id })

    const response = await client.delete(`/groups/${Math.random()}/requests/${groupRequest.id}/`)
      .loginAs(user)

    response.assertStatus(404)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 404 })
  })

  test('It should return 404 when providing an unexisting request group', async ({ client }) => {
    const user = await UserFactory.create()
    const group = await GroupFactory.merge({ master: user.id }).create()

    const response = await client.delete(`/groups/${group.id}/requests/${Math.random()}/`)
      .loginAs(user)

    response.assertStatus(404)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 404 })
  })
})

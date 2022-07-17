import Database from '@ioc:Adonis/Lucid/Database'
import { test } from '@japa/runner'
import Group from 'App/Models/Group'
import { GroupFactory, UserFactory } from 'Database/factories'

test.group('Groups', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('It should create create a group', async  ({ client }) => {
    const user = await UserFactory.create()
    const groupPayload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: user.id
    }

    const response = await client.post('/groups')
      .loginAs(user)
      .json(groupPayload)

    response.assertStatus(201)
    response.assertBodyContains({ group: {
      ...groupPayload,
      players: [
        {
          id: user.id
        }
      ]
    }})
  })

  test('It should return 422 when required data is not provided', async  ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.post('/groups')
      .loginAs(user)
      .json({})

    response.assertStatus(422)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 422 })
  })

  test('It should update a group', async ({ client }) => {
    const master = await UserFactory.create()
    const group = await GroupFactory.merge({ master: master.id }).create()
    const payload = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test'
    }

    const response = await client.put(`/groups/${group.id}`)
      .loginAs(master)
      .json(payload)

    response.assertStatus(200)
    response.assertBodyContains({ group: payload })
  })

  test('It should return 404 when providing an unexisting group for update', async ({ client }) => {
    const master = await UserFactory.create()

    const response = await client.put(`/groups/${Math.random()}}`).loginAs(master)

    response.assertStatus(404)
    response.assertBodyContains({ code: 'BAD_REQUEST', status: 404 })
  })

  test('It should remove user from group', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const player = await UserFactory.create()

    const group = await GroupFactory.merge({ master: master.id }).create()
    group.related('players').attach([player.id])

    const response = await client.delete(`/groups/${group.id}/players/${player.id}`).loginAs(master)

    response.assertStatus(200)

    await group.load('players')
    assert.isEmpty(group.players)
  })

  test('It should not remove the master of the group', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const group = await GroupFactory.merge({ master: master.id }).create()

    group.related('players').attach([master.id])

    const response = await client.delete(`/groups/${group.id}/players/${master.id}`).loginAs(master)

    response.assertStatus(400)

    await group.load('players')
    assert.isNotEmpty(group.players)
  })

  test('It should remove a group', async ({ client, assert }) => {
    const master = await UserFactory.create()
    const group = await GroupFactory.with('players', 5).merge({ master: master.id }).create()

    const response = await client.delete(`/groups/${group.id}`).loginAs(master)

    response.assertStatus(200)

    const emptyGroup = await Group.find(group.id)
    assert.isNull(emptyGroup)

    const players = await Database.from('groups_users')
    assert.isEmpty(players)
  })

  test('It should return all groups when no query is provided to list groups', async ({ client }) => {
    const user = await UserFactory.create()

    const group = await await GroupFactory.merge({ master: user.id }).create()
    await group.load('masterUser')

    const expectedGroup = group.serialize({
      fields: {
        omit: ['updated_at', 'created_at']
      },
      relations: {
        masterUser: {
          fields: ['id', 'username']
        }
      }
    })

    const response = await client.get('/groups').loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      groups: [expectedGroup]
    })
  })
})

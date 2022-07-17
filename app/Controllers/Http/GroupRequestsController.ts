import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import BadRequestException from 'App/Exceptions/BadRequestException'
import Group from 'App/Models/Group'
import GroupRequest from 'App/Models/GroupRequest'

export default class GroupRequestsController {
  public async index ({ auth, response }: HttpContextContract) {
    const master = auth.user!.id

    const groupRequests = await GroupRequest.query()
      .select('id', 'groupId', 'userId', 'status')
      .preload('group', (query) => {
        query.select('name', 'master')
      })
      .preload('user', (query) => {
        query.select('username')
      })
      .whereHas('group', (query) => {
        query.where('master', master)
      })
      .andWhere('status', 'PENDING')

    return response.ok({ groupRequests })
  }

  public async store ({ auth, request, response }: HttpContextContract) {
    const groupId = request.param('groupId') as number
    const userId = auth.user!.id

    const existsingGroupRequest = await GroupRequest.query()
      .where('groupId', groupId)
      .andWhere('userId', userId)
      .first()

    if (existsingGroupRequest) throw new BadRequestException('group request already exists', 409)

    const userAlreadyInGroup = await Group.query()
      .whereHas('players', (query) => {
        query.where('id', userId)
      })
      .andWhere('id', groupId)
      .first()

    if (userAlreadyInGroup) throw new BadRequestException('user is already in the group', 422)

    const groupRequest = await GroupRequest.create({ groupId, userId })
    await groupRequest.refresh()

    return response.created({ groupRequest })
  }

  public async accept ({ request, response, bouncer }: HttpContextContract) {
    const trx = await Database.transaction()

    try {
      const groupId = request.param('groupId') as number
      const requestId = request.param('requestId') as number

      const groupRequest = await GroupRequest.findOrFail(requestId)
      const group = await Group.findOrFail(groupId)

      await groupRequest.load('group')
      await bouncer.authorize('updateGroupRequestStatus', groupRequest)

      groupRequest.merge({ status: 'ACCEPTED' })
      groupRequest.useTransaction(trx)
      await groupRequest.save()

      await group.related('players').attach([groupRequest.userId], trx)

      await trx.commit()

      return response.ok({ groupRequest })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  public async destroy ({ request, response, bouncer }: HttpContextContract) {
    const groupId = request.param('groupId') as number
    const requestId = request.param('requestId') as number

    const groupRequest = await GroupRequest.query()
      .where('id', requestId)
      .andWhere('groupId', groupId)
      .firstOrFail()

    await groupRequest.load('group')
    await bouncer.authorize('updateGroupRequestStatus', groupRequest)

    await groupRequest.delete()

    return response.noContent()
  }
}

import type { RequestHandler } from 'express'

import { DEMO_USER_EMAIL } from '../db/demo.js'
import type { UsersRepository } from '../modules/users/users.repository.js'

export const createDemoUserMiddleware = (
  usersRepository: UsersRepository,
): RequestHandler => {
  return async (req, _res, next) => {
    const user = await usersRepository.findByEmail(DEMO_USER_EMAIL)
    if (!user) throw new Error('Demo user not found: run npm run db:seed')

    req.userId = user.id
    next()
  }
}

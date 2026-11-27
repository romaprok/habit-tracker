import { Router } from 'express'

import type { GitHubController } from './github.controller.js'

export function createGitHubRouter(controller: GitHubController) {
  const router = Router()

  router.get('/auth/github', controller.start)

  return router
}

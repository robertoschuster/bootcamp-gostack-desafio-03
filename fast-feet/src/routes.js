import { Router } from 'express';

import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();

/**
 * Rotas não autenticadas
 */
routes.post('/sessions', SessionController.store);

/**
 * As rotas abaixo passarão pelo middleware de autenticação,
 * portanto o usuário precisa estar autenticado através do token JWT.
 */
routes.use(authMiddleware);

routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);

export default routes;

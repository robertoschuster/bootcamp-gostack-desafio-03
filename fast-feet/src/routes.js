import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymanController from './app/controllers/DeliverymanController';
import DeliveryController from './app/controllers/DeliveryController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';
import CollectionController from './app/controllers/CollectionController';
import MyDeliveryController from './app/controllers/MyDeliveryController';
import FileController from './app/controllers/FileController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

/**
 * Unauthenticated routes
 */
routes.post('/sessions', SessionController.store);

// Deliveryman's deliveries
routes.get(
  '/deliveryman/:deliveryman_id/deliveries',
  MyDeliveryController.index
);

// Collection
routes.post('/collection/:id', CollectionController.store);
routes.put(
  '/collection/:id',
  upload.single('file'),
  CollectionController.update
);

// Delivery problems
routes.post('/delivery/:delivery_id/problems', DeliveryProblemController.store);

// Check authentication
routes.use(authMiddleware);

/**
 * Authenticated routes
 */
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);

routes.post('/files', upload.single('file'), FileController.store);

// Deliverymen
routes.get('/deliverymen', DeliverymanController.index);
routes.post('/deliverymen', DeliverymanController.store);
routes.put('/deliverymen/:id', DeliverymanController.update);
routes.delete('/deliverymen/:id', DeliverymanController.delete);

// Deliveries
routes.get('/deliveries', DeliveryController.index);
routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:id', DeliveryController.update);
routes.delete('/deliveries/:id', DeliveryController.delete);

// Delivery problems
routes.get('/delivery/:id/problems', DeliveryProblemController.index);
routes.get('/delivery/problems', DeliveryProblemController.index);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

export default routes;

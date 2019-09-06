import { Router } from 'express';

import multer from 'multer';
import multerConfig from './config/multer';

import authMiddleware from './app/middlewares/auth';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';

const routes = Router();

const upload = multer(multerConfig);

// Session routes
routes.post('/sessions', SessionController.store);

// User routes
routes.post('/users', UserController.store);

routes.use(authMiddleware);

// User routes
routes.put('/users', UserController.update);

// Files routes
routes.post('/files', upload.single('file'), FileController.store);

// Meetups
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.get('/meetups', MeetupController.index);
routes.delete('/meetups/:id', MeetupController.delete);

// Subscription
routes.post('/meetups/:meetupId/subscriptions', SubscriptionController.store);
routes.get('/meetups/subscriptions', SubscriptionController.index);

export default routes;

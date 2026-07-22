import { Router } from 'express';
import authRoutes from './auth';
import projectRoutes from './projects';
import moduleRoutes from './modules';
import approvalRoutes from './approvals';
import notificationRoutes from './notifications';
import adminRoutes from './admin';
import feedbackRoutes from './feedbacks';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/', moduleRoutes);
router.use('/modification-requests', approvalRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/feedbacks', feedbackRoutes);

export default router;

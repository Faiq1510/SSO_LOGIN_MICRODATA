import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getNotifications, getUnreadCount, patchMarkAsRead, patchMarkAllAsRead, removeNotification } from "../controllers/notification.controller";

const router = Router();

/**
 * @swagger
 * /admin/notifications:
 *   get:
 *     summary: Get all notifications (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get("/", authenticate, getNotifications);

/**
 * @swagger
 * /admin/notifications/count:
 *   get:
 *     summary: Get unread notification count (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get("/count", authenticate, getUnreadCount);

/**
 * @swagger
 * /admin/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.patch("/read-all", authenticate, patchMarkAllAsRead);

/**
 * @swagger
 * /admin/notifications/{id}/read:
 *   patch:
 *     summary: Mark one notification as read (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.patch("/:id/read", authenticate, patchMarkAsRead);

/**
 * @swagger
 * /admin/notifications/{id}:
 *   delete:
 *     summary: Delete a notification (Admin only)
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete("/:id", authenticate, removeNotification);

export default router;

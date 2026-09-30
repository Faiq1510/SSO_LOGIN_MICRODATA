import { db } from "../config/database";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  related_id: string | null;
  target_date: string | null;
  is_read: boolean;
  created_at: Date;
}

export const createNotification = async (data: { type: string; title: string; body: string; related_id?: string | null; target_date?: string | null }): Promise<Notification> => {
  const result = await db.query(
    `INSERT INTO notifications (type, title, body, related_id, target_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.type, data.title, data.body, data.related_id ?? null, data.target_date ?? null]
  );
  return result.rows[0];
};

export const findAllNotifications = async (): Promise<Notification[]> => {
  const result = await db.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`);
  return result.rows;
};

export const countUnreadNotifications = async (): Promise<number> => {
  const result = await db.query(`SELECT COUNT(*) AS count FROM notifications WHERE is_read = FALSE`);
  return parseInt(result.rows[0].count, 10);
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = $1`, [id]);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await db.query(`UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE`);
};

export const deleteNotificationById = async (id: string): Promise<boolean> => {
  const result = await db.query(`DELETE FROM notifications WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};

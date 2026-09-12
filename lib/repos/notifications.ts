import { query, safeRead } from '../db'
import type { MessageWithSender, NotificationRow } from '../types'

export async function notify(input: {
  userId: string
  title: string
  body?: string
  link?: string
  kind?: string
}): Promise<void> {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, body, link, kind) VALUES ($1,$2,$3,$4,$5)`,
      [input.userId, input.title, input.body ?? null, input.link ?? null, input.kind ?? 'general']
    )
  } catch (error) {
    console.error('[notify] failed', error)
  }
}

export async function listNotifications(userId: string, limit = 20): Promise<NotificationRow[]> {
  return safeRead(
    () =>
      query<NotificationRow>(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      ),
    []
  )
}

export async function unreadCount(userId: string): Promise<number> {
  const rows = await safeRead(
    () =>
      query<{ n: number }>(
        'SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND NOT is_read',
        [userId]
      ),
    []
  )
  return Number(rows[0]?.n ?? 0)
}

export async function markAllRead(userId: string): Promise<void> {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId])
}

export async function messagesForJob(jobId: string): Promise<MessageWithSender[]> {
  return safeRead(
    () =>
      query<MessageWithSender>(
        `SELECT m.*, u.name AS sender_name, u.role AS sender_role
           FROM messages m JOIN users u ON u.id = m.sender_id
          WHERE m.job_id = $1 ORDER BY m.created_at ASC`,
        [jobId]
      ),
    []
  )
}

export async function sendMessage(input: {
  jobId: string
  senderId: string
  recipientId: string
  body: string
}): Promise<void> {
  await query(
    'INSERT INTO messages (job_id, sender_id, recipient_id, body) VALUES ($1,$2,$3,$4)',
    [input.jobId, input.senderId, input.recipientId, input.body]
  )
}

export async function markMessagesRead(jobId: string, recipientId: string): Promise<void> {
  await query(
    'UPDATE messages SET is_read = TRUE, read_at = now() WHERE job_id = $1 AND recipient_id = $2 AND NOT is_read',
    [jobId, recipientId]
  )
}

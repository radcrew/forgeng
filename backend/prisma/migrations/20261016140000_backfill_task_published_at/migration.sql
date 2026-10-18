-- The previous migration only marked tasks that are published right now. A
-- task that was published, announced, and then moved back to draft stayed
-- unmarked, so publishing it again would notify students a second time.
-- Mark those tasks too, using the first "new task" notice sent for them.
UPDATE "tasks" AS t
SET "published_at" = n."first_sent_at"
FROM (
  SELECT "link", MIN("created_at") AS "first_sent_at"
  FROM "notifications"
  WHERE "type" = 'task_published'
  GROUP BY "link"
) AS n
WHERE t."published_at" IS NULL
  AND n."link" = '/student/tasks/' || t."id";

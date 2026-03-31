-- IMPORTANT: Run the `clean-duplicates` task before applying this migration
-- to remove any existing duplicate (repo_id, number) rows.
DROP INDEX `idx_repo_id_number`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_repo_id_number` ON `issues` (`repo_id`,`number`);
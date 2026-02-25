CREATE INDEX `idx_repo_id_number` ON `issues` (`repo_id`,`number`);--> statement-breakpoint
CREATE INDEX `idx_state` ON `issues` (`state`);--> statement-breakpoint
CREATE UNIQUE INDEX `repos_full_name_unique` ON `repos` (`full_name`);
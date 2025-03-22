PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_issues` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`repository` text NOT NULL,
	`repo_id` integer NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`updated_at` text NOT NULL,
	`labels` text,
	`state` text NOT NULL,
	`mtime` integer NOT NULL,
	`hash` text NOT NULL,
	`metadata` text NOT NULL,
	`embeddings` text NOT NULL,
	FOREIGN KEY (`repo_id`) REFERENCES `repos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_issues`("id", "owner", "repository", "repo_id", "number", "title", "url", "updated_at", "labels", "state", "mtime", "hash", "metadata", "embeddings") SELECT "id", "owner", "repository", "repo_id", "number", "title", "url", "updated_at", "labels", "state", "mtime", "hash", "metadata", "embeddings" FROM `issues`;--> statement-breakpoint
DROP TABLE `issues`;--> statement-breakpoint
ALTER TABLE `__new_issues` RENAME TO `issues`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
CREATE TABLE `issues` (
	`owner` text NOT NULL,
	`repository` text NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`updated_at` text NOT NULL,
	`labels` text,
	`state` text NOT NULL,
	`mtime` integer NOT NULL,
	`hash` text NOT NULL,
	`metadata` text NOT NULL,
	`embeddings` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `repos` (
	`id` integer PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`private` integer NOT NULL,
	`indexed` integer DEFAULT 0 NOT NULL
);

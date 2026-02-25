CREATE TABLE `issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repo_id` integer NOT NULL,
	`title` text NOT NULL,
	`state` text NOT NULL,
	`number` integer NOT NULL,
	`metadata` text NOT NULL,
	`embeddings` text NOT NULL,
	`hash` text NOT NULL,
	`mtime` integer NOT NULL,
	FOREIGN KEY (`repo_id`) REFERENCES `repos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `repos` (
	`id` integer PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`full_name` text NOT NULL,
	`private` integer NOT NULL,
	`indexed` integer DEFAULT 0 NOT NULL
);

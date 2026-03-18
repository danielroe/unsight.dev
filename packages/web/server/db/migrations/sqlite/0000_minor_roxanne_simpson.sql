CREATE TABLE IF NOT EXISTS `dashboard_repos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dashboard_id` text NOT NULL,
	`repo_id` integer NOT NULL,
	FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repo_id`) REFERENCES `repos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_dashboard_repos_dashboard` ON `dashboard_repos` (`dashboard_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_dashboard_repos_unique` ON `dashboard_repos` (`dashboard_id`,`repo_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `dashboards` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`github_id` integer NOT NULL,
	`github_login` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_dashboards_github_slug` ON `dashboards` (`github_id`,`slug`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `issues` (
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
CREATE INDEX IF NOT EXISTS `idx_repo_id_number` ON `issues` (`repo_id`,`number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_state` ON `issues` (`state`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `repos` (
	`id` integer PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`full_name` text NOT NULL,
	`private` integer NOT NULL,
	`indexed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `repos_full_name_unique` ON `repos` (`full_name`);

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
CREATE TABLE IF NOT EXISTS `dashboard_repos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dashboard_id` text NOT NULL,
	`repo_id` integer NOT NULL,
	FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`repo_id`) REFERENCES `repos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_dashboard_repos_dashboard` ON `dashboard_repos` (`dashboard_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_dashboard_repos_unique` ON `dashboard_repos` (`dashboard_id`,`repo_id`);

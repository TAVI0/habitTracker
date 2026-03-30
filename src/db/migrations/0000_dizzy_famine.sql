CREATE TABLE `completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habit_id` integer NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `completions_habit_id_date_unique` ON `completions` (`habit_id`,`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6366F1' NOT NULL,
	`reminder_time` text,
	`config` text DEFAULT '{"freeDays":[],"streakRule":{"type":"daily","requiredCount":1}}' NOT NULL,
	`created_at` text NOT NULL
);

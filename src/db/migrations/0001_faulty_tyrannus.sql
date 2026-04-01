PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6366F1' NOT NULL,
	`reminder_time` text,
	`config` text DEFAULT '{"freeDays":[]}' NOT NULL,
	`created_at` text NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
INSERT INTO `__new_habits`("id", "name", "description", "color", "reminder_time", "config", "created_at", "archived_at") SELECT "id", "name", "description", "color", "reminder_time", "config", "created_at", "archived_at" FROM `habits`;--> statement-breakpoint
DROP TABLE `habits`;--> statement-breakpoint
ALTER TABLE `__new_habits` RENAME TO `habits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
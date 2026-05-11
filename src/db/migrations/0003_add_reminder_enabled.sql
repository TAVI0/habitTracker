ALTER TABLE `habits` ADD COLUMN `reminder_enabled` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `habits` SET `reminder_enabled` = 1 WHERE `reminder_time` IS NOT NULL;

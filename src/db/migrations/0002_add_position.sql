ALTER TABLE `habits` ADD COLUMN `position` integer;
--> statement-breakpoint
UPDATE `habits` SET `position` = (rowid - 1);

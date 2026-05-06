ALTER TABLE `lab_reports` MODIFY COLUMN `fileUrl` TEXT NULL;
--> statement-breakpoint
SET @add_ext = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='lab_reports' AND COLUMN_NAME='externalUrl')=0,'ALTER TABLE `lab_reports` ADD COLUMN `externalUrl` TEXT','SELECT 1');
--> statement-breakpoint
PREPARE s1 FROM @add_ext;
--> statement-breakpoint
EXECUTE s1;
--> statement-breakpoint
DEALLOCATE PREPARE s1;

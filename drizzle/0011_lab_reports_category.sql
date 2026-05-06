ALTER TABLE `lab_reports` MODIFY COLUMN `productId` INT NULL;
--> statement-breakpoint
SET @add_cat = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='lab_reports' AND COLUMN_NAME='category')=0,'ALTER TABLE `lab_reports` ADD COLUMN `category` VARCHAR(128)','SELECT 1');
--> statement-breakpoint
PREPARE s1 FROM @add_cat;
--> statement-breakpoint
EXECUTE s1;
--> statement-breakpoint
DEALLOCATE PREPARE s1;
--> statement-breakpoint
SET @add_title = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='lab_reports' AND COLUMN_NAME='title')=0,'ALTER TABLE `lab_reports` ADD COLUMN `title` VARCHAR(255)','SELECT 1');
--> statement-breakpoint
PREPARE s2 FROM @add_title;
--> statement-breakpoint
EXECUTE s2;
--> statement-breakpoint
DEALLOCATE PREPARE s2;

ALTER TABLE `lab_reports` MODIFY COLUMN `fileUrl` TEXT NULL;
ALTER TABLE `lab_reports` ADD COLUMN `externalUrl` TEXT;

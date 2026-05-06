ALTER TABLE `lab_reports` MODIFY COLUMN `productId` INT NULL;
ALTER TABLE `lab_reports` ADD COLUMN `category` VARCHAR(128);

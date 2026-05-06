CREATE TABLE `lab_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`variantName` varchar(256),
	`reportName` varchar(256) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512),
	`batchNumber` varchar(128),
	`testedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lab_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_attributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` varchar(512) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_attributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`sku` varchar(128),
	`price` decimal(10,2) NOT NULL,
	`compareAtPrice` decimal(10,2),
	`inventory` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`)
);

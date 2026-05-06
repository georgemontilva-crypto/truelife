CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256),
	`subtitle` text,
	`imageUrl` text NOT NULL,
	`imageKey` text,
	`linkUrl` varchar(512),
	`linkText` varchar(128),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `imageKey` text;
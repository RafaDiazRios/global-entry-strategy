CREATE TABLE `strategyCaseDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(260) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`storageKey` varchar(500),
	`textContent` mediumtext,
	`bytes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategyCaseDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategyCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`decisionQuestion` text,
	`companyName` varchar(180),
	`homeCountry` varchar(120),
	`industry` varchar(180),
	`subIndustry` varchar(180),
	`caseYear` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategyEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('document','public_data','interview','assumption','ai_extraction') NOT NULL,
	`claim` text NOT NULL,
	`sourceLabel` varchar(300) NOT NULL,
	`documentId` int,
	`locator` varchar(160),
	`quote` text,
	`url` varchar(1000),
	`retrievedAt` varchar(80),
	`reliability` int NOT NULL DEFAULT 3,
	`targetPath` varchar(160),
	`countryCode` varchar(3),
	`createdBy` enum('user','ai') NOT NULL DEFAULT 'user',
	`status` enum('accepted','suggested','rejected') NOT NULL DEFAULT 'accepted',
	`quoteVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `strategyScenarios` ADD `caseId` int;
CREATE TABLE `strategyApprovalMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`approvalId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`responsible` varchar(160),
	`dueAt` timestamp,
	`status` enum('pending','in_progress','blocked','complete','not_applicable') NOT NULL DEFAULT 'pending',
	`evidence` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyApprovalMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategyApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`userId` int NOT NULL,
	`countryCode` varchar(3) NOT NULL,
	`countryName` varchar(120) NOT NULL,
	`recommendation` enum('advance','test') NOT NULL,
	`status` enum('not_started','in_review','approved','changes_requested','on_hold','closed') NOT NULL DEFAULT 'not_started',
	`responsible` varchar(160) NOT NULL,
	`reviewer` varchar(160),
	`reviewAt` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyApprovals_id` PRIMARY KEY(`id`)
);

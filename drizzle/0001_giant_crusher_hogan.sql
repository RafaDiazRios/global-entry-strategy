CREATE TABLE `strategyScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`companyName` varchar(180) NOT NULL,
	`homeCountry` varchar(120) NOT NULL,
	`industry` varchar(180) NOT NULL,
	`businessModel` varchar(120) NOT NULL,
	`objective` enum('market','resources','learning','coordination') NOT NULL,
	`horizonYears` int NOT NULL,
	`inputJson` json NOT NULL,
	`resultJson` json NOT NULL,
	`sourceRefreshAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyScenarios_id` PRIMARY KEY(`id`)
);

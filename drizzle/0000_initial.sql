CREATE TABLE `activity` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_player_sequence_idx` ON `activity` (`player_id`,`sequence`);--> statement-breakpoint
CREATE UNIQUE INDEX `activity_player_id_id_unique` ON `activity` (`player_id`,`id`);--> statement-breakpoint
CREATE TABLE `areas` (
	`player_id` text NOT NULL,
	`id` text NOT NULL,
	`position` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`player_id`, `id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`player_id` text NOT NULL,
	`id` text NOT NULL,
	`position` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`player_id`, `id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `buildings` (
	`player_id` text NOT NULL,
	`area_id` text NOT NULL,
	`id` text NOT NULL,
	`position` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`player_id`, `area_id`, `id`),
	FOREIGN KEY (`player_id`,`area_id`) REFERENCES `areas`(`player_id`,`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `player_presence` (
	`player_id` text NOT NULL,
	`id` text NOT NULL,
	`position` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`player_id`, `id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`handle` text NOT NULL,
	`initials` text NOT NULL,
	`level` integer NOT NULL,
	`title` text NOT NULL,
	`budget` text NOT NULL,
	`routing_rules` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_handle_unique` ON `players` (`handle`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`player_id` text NOT NULL,
	`area_id` text NOT NULL,
	`building_id` text NOT NULL,
	`id` text NOT NULL,
	`position` integer NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`player_id`, `area_id`, `building_id`, `id`),
	FOREIGN KEY (`player_id`,`area_id`,`building_id`) REFERENCES `buildings`(`player_id`,`area_id`,`id`) ON UPDATE no action ON DELETE cascade
);

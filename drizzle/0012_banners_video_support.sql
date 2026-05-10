ALTER TABLE `banners`
  ADD COLUMN `mediaType` varchar(16) NOT NULL DEFAULT 'image',
  ADD COLUMN `videoUrl` text,
  ADD COLUMN `videoKey` varchar(512),
  MODIFY COLUMN `imageUrl` text;

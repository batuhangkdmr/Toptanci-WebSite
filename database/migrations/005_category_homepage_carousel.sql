/*
  005: Category homepage images + AUTO_CATEGORY_CAROUSEL section type
*/

IF COL_LENGTH('Categories', 'ImageCloudinaryPublicId') IS NULL
  ALTER TABLE Categories ADD ImageCloudinaryPublicId NVARCHAR(500) NULL;
GO

IF COL_LENGTH('Categories', 'ImageSecureUrl') IS NULL
  ALTER TABLE Categories ADD ImageSecureUrl NVARCHAR(1000) NULL;
GO

IF COL_LENGTH('Categories', 'ImageAltText') IS NULL
  ALTER TABLE Categories ADD ImageAltText NVARCHAR(250) NULL;
GO

IF COL_LENGTH('Categories', 'HomepageSortOrder') IS NULL
  ALTER TABLE Categories ADD HomepageSortOrder INT NOT NULL CONSTRAINT DF_Categories_HomepageSortOrder DEFAULT 0;
GO

IF COL_LENGTH('Categories', 'ShowOnHomepage') IS NULL
  ALTER TABLE Categories ADD ShowOnHomepage BIT NOT NULL CONSTRAINT DF_Categories_ShowOnHomepage DEFAULT 1;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_Categories_Homepage'
    AND object_id = OBJECT_ID('Categories')
)
BEGIN
  CREATE INDEX IX_Categories_Homepage
    ON Categories (ShowOnHomepage, IsActive, HomepageSortOrder, Name);
END
GO

/* Expand HomepageSections.SectionType check constraint */
IF EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = 'CK_HomepageSections_Type'
    AND parent_object_id = OBJECT_ID('HomepageSections')
)
BEGIN
  ALTER TABLE HomepageSections DROP CONSTRAINT CK_HomepageSections_Type;
END
GO

ALTER TABLE HomepageSections WITH NOCHECK
  ADD CONSTRAINT CK_HomepageSections_Type CHECK (SectionType IN (
    'CATEGORY_STRIP',
    'HERO_BANNER',
    'SIDE_BANNER',
    'PRODUCT_RAIL',
    'AUTO_CATEGORY_CAROUSEL'
  ));
GO

/* Seed auto category section once */
IF NOT EXISTS (
  SELECT 1 FROM HomepageSections WHERE SectionType = N'AUTO_CATEGORY_CAROUSEL'
)
BEGIN
  INSERT INTO HomepageSections (SectionType, Title, Description, ShowViewAll, IsActive, SortOrder)
  VALUES (
    N'AUTO_CATEGORY_CAROUSEL',
    N'Kategoriler',
    N'Aktif ve ana sayfada gösterilen kategorilerden otomatik oluşturulur.',
    0,
    1,
    -10
  );
END
GO

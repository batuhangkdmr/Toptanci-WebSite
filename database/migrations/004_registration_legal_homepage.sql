/*
  004: Registration profile fields, consents, legal docs, homepage carousels
*/

/* Users: Gender + City/District codes — column and CHECK must be separate batches */
IF COL_LENGTH('Users', 'Gender') IS NULL
  ALTER TABLE Users ADD Gender NVARCHAR(30) NULL;
GO

IF COL_LENGTH('Users', 'Gender') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_Gender')
  ALTER TABLE Users ADD CONSTRAINT CK_Users_Gender
    CHECK (Gender IS NULL OR Gender IN ('MALE', 'FEMALE', 'UNSPECIFIED'));
GO

IF COL_LENGTH('Users', 'CityCode') IS NULL
  ALTER TABLE Users ADD CityCode NVARCHAR(10) NULL;
GO

IF COL_LENGTH('Users', 'DistrictCode') IS NULL
  ALTER TABLE Users ADD DistrictCode NVARCHAR(20) NULL;
GO

IF COL_LENGTH('Users', 'CityName') IS NULL
  ALTER TABLE Users ADD CityName NVARCHAR(100) NULL;
GO

IF COL_LENGTH('Users', 'DistrictName') IS NULL
  ALTER TABLE Users ADD DistrictName NVARCHAR(100) NULL;
GO

/* Companies: city codes + country */
IF COL_LENGTH('Companies', 'CityCode') IS NULL
  ALTER TABLE Companies ADD CityCode NVARCHAR(10) NULL;
GO

IF COL_LENGTH('Companies', 'DistrictCode') IS NULL
  ALTER TABLE Companies ADD DistrictCode NVARCHAR(20) NULL;
GO

IF COL_LENGTH('Companies', 'Country') IS NULL
  ALTER TABLE Companies ADD Country NVARCHAR(50) NULL;
GO

IF COL_LENGTH('Companies', 'Country') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys.default_constraints
    WHERE name = 'DF_Companies_Country'
  )
  ALTER TABLE Companies ADD CONSTRAINT DF_Companies_Country DEFAULT N'Türkiye' FOR Country;
GO

/* Legal document versions */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LegalDocuments')
BEGIN
  CREATE TABLE LegalDocuments (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_LegalDocuments PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    DocType NVARCHAR(50) NOT NULL,
    Version NVARCHAR(20) NOT NULL,
    Title NVARCHAR(250) NOT NULL,
    Slug NVARCHAR(180) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_LegalDocuments_IsActive DEFAULT 1,
    PublishedAt DATETIME2 NOT NULL CONSTRAINT DF_LegalDocuments_PublishedAt DEFAULT SYSUTCDATETIME(),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_LegalDocuments_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_LegalDocuments_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_LegalDocuments_Type_Version UNIQUE (DocType, Version),
    CONSTRAINT UQ_LegalDocuments_Slug_Version UNIQUE (Slug, Version),
    CONSTRAINT CK_LegalDocuments_DocType CHECK (DocType IN (
      'MEMBERSHIP_AGREEMENT', 'KVKK_NOTICE', 'COMMERCIAL_COMMUNICATION',
      'DELIVERY_TERMS', 'SALES_AGREEMENT', 'WARRANTY_RETURNS',
      'PRIVACY_SECURITY', 'COOKIE_POLICY'
    ))
  );
END
GO

/* User consents / agreements */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserConsents')
BEGIN
  CREATE TABLE UserConsents (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_UserConsents PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    DocType NVARCHAR(50) NOT NULL,
    DocumentVersion NVARCHAR(20) NOT NULL,
    Accepted BIT NOT NULL,
    AcceptedAt DATETIME2 NULL,
    IpAddress NVARCHAR(64) NULL,
    UserAgent NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserConsents_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_UserConsents_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_UserConsents_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT CK_UserConsents_DocType CHECK (DocType IN (
      'MEMBERSHIP_AGREEMENT', 'KVKK_NOTICE', 'COMMERCIAL_COMMUNICATION'
    ))
  );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserConsents_UserId' AND object_id = OBJECT_ID('UserConsents'))
  CREATE INDEX IX_UserConsents_UserId ON UserConsents(UserId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserConsents_DocType' AND object_id = OBJECT_ID('UserConsents'))
  CREATE INDEX IX_UserConsents_DocType ON UserConsents(DocType);
GO

/* Newsletter subscriptions */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NewsletterSubscriptions')
BEGIN
  CREATE TABLE NewsletterSubscriptions (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_NewsletterSubscriptions PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Email NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Newsletter_IsActive DEFAULT 1,
    ConsentVersion NVARCHAR(20) NULL,
    IpAddress NVARCHAR(64) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Newsletter_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Newsletter_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Newsletter_Email UNIQUE (Email)
  );
END
GO

/* Homepage sections / carousels */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HomepageSections')
BEGIN
  CREATE TABLE HomepageSections (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_HomepageSections PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SectionType NVARCHAR(40) NOT NULL,
    Title NVARCHAR(200) NULL,
    Description NVARCHAR(1000) NULL,
    ShowViewAll BIT NOT NULL CONSTRAINT DF_HomepageSections_ShowViewAll DEFAULT 0,
    ViewAllHref NVARCHAR(300) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_HomepageSections_IsActive DEFAULT 1,
    SortOrder INT NOT NULL CONSTRAINT DF_HomepageSections_SortOrder DEFAULT 0,
    StartsAt DATETIME2 NULL,
    EndsAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_HomepageSections_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_HomepageSections_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_HomepageSections_Type CHECK (SectionType IN (
      'CATEGORY_STRIP', 'HERO_BANNER', 'SIDE_BANNER', 'PRODUCT_RAIL'
    ))
  );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HomepageCarouselItems')
BEGIN
  CREATE TABLE HomepageCarouselItems (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_HomepageCarouselItems PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SectionId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(200) NULL,
    Description NVARCHAR(500) NULL,
    AltText NVARCHAR(250) NULL,
    CloudinaryPublicId NVARCHAR(500) NULL,
    SecureUrl NVARCHAR(1000) NULL,
    MobileCloudinaryPublicId NVARCHAR(500) NULL,
    MobileSecureUrl NVARCHAR(1000) NULL,
    CategoryId UNIQUEIDENTIFIER NULL,
    ProductId UNIQUEIDENTIFIER NULL,
    TargetType NVARCHAR(30) NULL,
    TargetUrl NVARCHAR(500) NULL,
    SortOrder INT NOT NULL CONSTRAINT DF_HomepageCarouselItems_SortOrder DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_HomepageCarouselItems_IsActive DEFAULT 1,
    StartsAt DATETIME2 NULL,
    EndsAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_HomepageCarouselItems_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_HomepageCarouselItems_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_HCI_Section FOREIGN KEY (SectionId) REFERENCES HomepageSections(Id) ON DELETE CASCADE,
    CONSTRAINT FK_HCI_Category FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
    CONSTRAINT FK_HCI_Product FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT CK_HCI_TargetType CHECK (
      TargetType IS NULL OR TargetType IN ('NONE', 'CATEGORY', 'PRODUCT', 'URL')
    )
  );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HomepageProductItems')
BEGIN
  CREATE TABLE HomepageProductItems (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_HomepageProductItems PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SectionId UNIQUEIDENTIFIER NOT NULL,
    ProductId UNIQUEIDENTIFIER NOT NULL,
    SortOrder INT NOT NULL CONSTRAINT DF_HomepageProductItems_SortOrder DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_HomepageProductItems_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_HomepageProductItems_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_HPI_Section FOREIGN KEY (SectionId) REFERENCES HomepageSections(Id) ON DELETE CASCADE,
    CONSTRAINT FK_HPI_Product FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT UQ_HPI_Section_Product UNIQUE (SectionId, ProductId)
  );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HCI_SectionId' AND object_id = OBJECT_ID('HomepageCarouselItems'))
  CREATE INDEX IX_HCI_SectionId ON HomepageCarouselItems(SectionId, SortOrder);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HPI_SectionId' AND object_id = OBJECT_ID('HomepageProductItems'))
  CREATE INDEX IX_HPI_SectionId ON HomepageProductItems(SectionId, SortOrder);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HomepageSections_Type' AND object_id = OBJECT_ID('HomepageSections'))
  CREATE INDEX IX_HomepageSections_Type ON HomepageSections(SectionType, IsActive);
GO

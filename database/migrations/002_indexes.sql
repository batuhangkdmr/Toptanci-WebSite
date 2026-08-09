/*
  Indexes for toptanci-projesi
*/

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_CompanyId' AND object_id = OBJECT_ID('Users'))
  CREATE INDEX IX_Users_CompanyId ON Users(CompanyId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Role' AND object_id = OBJECT_ID('Users'))
  CREATE INDEX IX_Users_Role ON Users(Role);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_CategoryId' AND object_id = OBJECT_ID('Products'))
  CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_IsActive' AND object_id = OBJECT_ID('Products'))
  CREATE INDEX IX_Products_IsActive ON Products(IsActive);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Name' AND object_id = OBJECT_ID('Products'))
  CREATE INDEX IX_Products_Name ON Products(Name);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProductImages_ProductId' AND object_id = OBJECT_ID('ProductImages'))
  CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CartItems_CartId' AND object_id = OBJECT_ID('CartItems'))
  CREATE INDEX IX_CartItems_CartId ON CartItems(CartId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_CompanyId' AND object_id = OBJECT_ID('Orders'))
  CREATE INDEX IX_Orders_CompanyId ON Orders(CompanyId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_Status' AND object_id = OBJECT_ID('Orders'))
  CREATE INDEX IX_Orders_Status ON Orders(Status);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_CreatedAt' AND object_id = OBJECT_ID('Orders'))
  CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt DESC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OrderItems_OrderId' AND object_id = OBJECT_ID('OrderItems'))
  CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OrderStatusHistory_OrderId' AND object_id = OBJECT_ID('OrderStatusHistory'))
  CREATE INDEX IX_OrderStatusHistory_OrderId ON OrderStatusHistory(OrderId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Companies_Status' AND object_id = OBJECT_ID('Companies'))
  CREATE INDEX IX_Companies_Status ON Companies(Status);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Categories_IsActive' AND object_id = OBJECT_ID('Categories'))
  CREATE INDEX IX_Categories_IsActive ON Categories(IsActive);
GO

/*
  Order cancellation requests
*/

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderCancellationRequests')
BEGIN
  CREATE TABLE OrderCancellationRequests (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OrderCancellationRequests PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    OrderId UNIQUEIDENTIFIER NOT NULL,
    RequestedByUserId UNIQUEIDENTIFIER NOT NULL,
    Reason NVARCHAR(1000) NULL,
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_OCR_Status DEFAULT 'PENDING',
    AdminNote NVARCHAR(1000) NULL,
    ReviewedByUserId UNIQUEIDENTIFIER NULL,
    ReviewedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_OCR_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_OCR_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_OCR_Status CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED_BY_USER')),
    CONSTRAINT FK_OCR_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
    CONSTRAINT FK_OCR_RequestedBy FOREIGN KEY (RequestedByUserId) REFERENCES Users(Id),
    CONSTRAINT FK_OCR_ReviewedBy FOREIGN KEY (ReviewedByUserId) REFERENCES Users(Id)
  );
END
GO

IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE name = 'UX_OCR_Order_Pending' AND object_id = OBJECT_ID('OrderCancellationRequests')
)
BEGIN
  CREATE UNIQUE INDEX UX_OCR_Order_Pending
    ON OrderCancellationRequests(OrderId)
    WHERE Status = 'PENDING';
END
GO

IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE name = 'IX_OCR_Status' AND object_id = OBJECT_ID('OrderCancellationRequests')
)
BEGIN
  CREATE INDEX IX_OCR_Status ON OrderCancellationRequests(Status);
END
GO

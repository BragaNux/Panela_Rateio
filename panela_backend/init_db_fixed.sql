-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela Users
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Email" VARCHAR(200) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "Nome" VARCHAR(200) NOT NULL,
    "ChavePix" VARCHAR(200),
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela Groups
CREATE TABLE IF NOT EXISTS "Groups" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Nome" VARCHAR(100) NOT NULL,
    "Descricao" TEXT,
    "CreatorId" UUID NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Groups_Users_CreatorId" FOREIGN KEY ("CreatorId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Criar tabela Members
CREATE TABLE IF NOT EXISTS "Members" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GroupId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "JoinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Members_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Members_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    UNIQUE("GroupId", "UserId")
);

-- Criar tabela Expenses
CREATE TABLE IF NOT EXISTS "Expenses" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GroupId" UUID NOT NULL,
    "PayerId" UUID NOT NULL,
    "Descricao" VARCHAR(300) NOT NULL,
    "Amount" DECIMAL(18,2) NOT NULL,
    "Date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Expenses_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Expenses_Users_PayerId" FOREIGN KEY ("PayerId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Criar tabela Splits
CREATE TABLE IF NOT EXISTS "Splits" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ExpenseId" UUID NOT NULL,
    "MemberId" UUID NOT NULL,
    "Mode" INTEGER NOT NULL DEFAULT 0,
    "ShareValue" DECIMAL(18,2) NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Splits_Expenses_ExpenseId" FOREIGN KEY ("ExpenseId") REFERENCES "Expenses" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Splits_Members_MemberId" FOREIGN KEY ("MemberId") REFERENCES "Members" ("Id") ON DELETE CASCADE,
    UNIQUE("ExpenseId", "MemberId")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX IF NOT EXISTS "IX_Groups_CreatorId" ON "Groups" ("CreatorId");
CREATE INDEX IF NOT EXISTS "IX_Members_UserId" ON "Members" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Expenses_GroupId" ON "Expenses" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_Expenses_PayerId" ON "Expenses" ("PayerId");
CREATE INDEX IF NOT EXISTS "IX_Splits_MemberId" ON "Splits" ("MemberId");

-- PasswordResets para fluxo de recuperação de senha
CREATE TABLE IF NOT EXISTS "PasswordResets" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "CodeHash" VARCHAR(255) NOT NULL,
    "ExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "Used" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_PasswordResets_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_PasswordResets_User_Used" ON "PasswordResets" ("UserId", "Used");

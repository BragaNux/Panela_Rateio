-- Criar tabela Users
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "HashSenha" VARCHAR(255) NOT NULL,
    "Nome" VARCHAR(100) NOT NULL,
    "ChavePix" VARCHAR(100),
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela Groups
CREATE TABLE IF NOT EXISTS "Groups" (
    "Id" SERIAL PRIMARY KEY,
    "Nome" VARCHAR(100) NOT NULL,
    "Descricao" TEXT,
    "CreatorId" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Groups_Users_CreatorId" FOREIGN KEY ("CreatorId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Criar tabela Members
CREATE TABLE IF NOT EXISTS "Members" (
    "Id" SERIAL PRIMARY KEY,
    "GroupId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "JoinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Members_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Members_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    UNIQUE("GroupId", "UserId")
);

-- Criar tabela Expenses
CREATE TABLE IF NOT EXISTS "Expenses" (
    "Id" SERIAL PRIMARY KEY,
    "GroupId" INTEGER NOT NULL,
    "PayerId" INTEGER NOT NULL,
    "Descricao" VARCHAR(300) NOT NULL,
    "Amount" DECIMAL(18,2) NOT NULL,
    "Date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Expenses_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Expenses_Users_PayerId" FOREIGN KEY ("PayerId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Criar tabela Splits
CREATE TABLE IF NOT EXISTS "Splits" (
    "Id" SERIAL PRIMARY KEY,
    "ExpenseId" INTEGER NOT NULL,
    "MemberId" INTEGER NOT NULL,
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
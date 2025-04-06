-- CreateTable
CREATE TABLE "GitLabInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GitLabUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "instanceId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GitLabUser_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "GitLabInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GitLabEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "instanceId" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "action_name" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "target_type" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "author_username" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "project_name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GitLabEvent_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "GitLabInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GitLabUser_id_instanceId_key" ON "GitLabUser"("id", "instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "GitLabEvent_id_instanceId_key" ON "GitLabEvent"("id", "instanceId");

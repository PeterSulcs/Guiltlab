-- CreateTable
CREATE TABLE "GitHubInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GitHubEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "actor_login" TEXT NOT NULL,
    "repo_id" INTEGER NOT NULL,
    "repo_name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GitHubEvent_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "GitHubInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubEvent_id_instanceId_key" ON "GitHubEvent"("id", "instanceId");

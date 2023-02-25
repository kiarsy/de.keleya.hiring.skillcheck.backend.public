/*
  Warnings:

  - You are about to drop the column `created_at` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `credentials` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_credentials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_credentials" ("hash", "id") SELECT "hash", "id" FROM "credentials";
DROP TABLE "credentials";
ALTER TABLE "new_credentials" RENAME TO "credentials";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "email_activation_code" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialId" INTEGER,
    CONSTRAINT "users_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "credentials" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("credentialId", "email", "email_activation_code", "email_confirmed", "id", "is_admin", "is_deleted", "name") SELECT "credentialId", "email", "email_activation_code", "email_confirmed", "id", "is_admin", "is_deleted", "name" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

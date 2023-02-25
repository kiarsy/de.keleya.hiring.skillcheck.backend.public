/*
  Warnings:

  - A unique constraint covering the columns `[email,created_at]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_email_created_at_key" ON "users"("email", "created_at");

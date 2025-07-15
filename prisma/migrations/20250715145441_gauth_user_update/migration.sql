-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "f_name" TEXT NOT NULL DEFAULT '',
    "l_name" TEXT NOT NULL DEFAULT '',
    "profile_pic_url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'local'
);
INSERT INTO "new_User" ("email", "f_name", "id", "l_name", "password", "profile_pic_url", "username", "verified") SELECT "email", "f_name", "id", "l_name", "password", "profile_pic_url", "username", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

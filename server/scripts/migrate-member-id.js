import "dotenv/config";
import pool from "../src/config/db.js";
import { generateUniqueMemberId } from "../src/utils/member-id.js";

async function columnExists(table, column) {
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows.length > 0;
}

async function indexExists(table, indexName) {
  const [rows] = await pool.execute(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [table, indexName],
  );
  return rows.length > 0;
}

async function backfillMemberIds() {
  const [users] = await pool.execute(
    `SELECT user_id
     FROM Users
     WHERE member_id IS NULL OR TRIM(member_id) = ''`,
  );

  for (const user of users) {
    const memberId = await generateUniqueMemberId();
    await pool.execute("UPDATE Users SET member_id = ? WHERE user_id = ?", [
      memberId,
      user.user_id,
    ]);
    console.log(`OK: user_id=${user.user_id} -> ${memberId}`);
  }

  if (!users.length) {
    console.log("SKIP: all users already have member_id");
  }
}

async function main() {
  if (!(await columnExists("Users", "member_id"))) {
    await pool.execute(
      "ALTER TABLE Users ADD COLUMN member_id VARCHAR(20) NULL AFTER user_id",
    );
    console.log("OK: added Users.member_id");
  } else {
    console.log("SKIP: Users.member_id already exists");
  }

  await backfillMemberIds();

  if (!(await indexExists("Users", "idx_users_member_id"))) {
    await pool.execute(
      "CREATE UNIQUE INDEX idx_users_member_id ON Users (member_id)",
    );
    console.log("OK: created idx_users_member_id");
  } else {
    console.log("SKIP: idx_users_member_id already exists");
  }

  console.log("Migration complete.");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

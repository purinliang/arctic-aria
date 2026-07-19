import assert from "node:assert/strict";
import test from "node:test";
import { PostgresUserSettingsRepository } from "../server/postgres-user-settings-repository.ts";

type QueryRecord = {
  text: string;
  params: unknown[];
};

test("settings repository creates defaults when no row exists", async () => {
  const { records, sql } = createSqlStub([]);
  const repository = new PostgresUserSettingsRepository(sql as never);

  const preferences = await repository.getOrCreate("user-1");

  assert.deepEqual(preferences, {
    languagePreference: "en",
    multipleTimezonesEnabled: false,
    themePreference: "system",
    timeFormatPreference: "12h",
    timeZonePreference: "system",
  });
  assert.match(records[0]?.text ?? "", /FROM user_settings/);
  assert.match(records[1]?.text ?? "", /INSERT INTO user_settings/);
  assert.deepEqual(records[1]?.params, [
    "user-1",
    "system",
    "en",
    "12h",
    "system",
    false,
  ]);
});

test("settings repository normalizes unsupported values before upsert", async () => {
  const { records, sql } = createSqlStub([]);
  const repository = new PostgresUserSettingsRepository(sql as never);

  await repository.upsert("user-1", {
    languagePreference: "unsupported" as never,
    multipleTimezonesEnabled: true,
    themePreference: "unknown" as never,
    timeFormatPreference: "unsupported" as never,
    timeZonePreference: "not-a-timezone",
  });

  assert.deepEqual(records[0]?.params, [
    "user-1",
    "system",
    "en",
    "12h",
    "system",
    true,
  ]);
});

function createSqlStub(findRows: unknown[]) {
  const records: QueryRecord[] = [];
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      records.push({ text, params });

      if (text.includes("SELECT theme_preference")) {
        return findRows;
      }

      if (text.includes("INSERT INTO user_settings")) {
        return [
          {
            theme_preference: params[1],
            language_preference: params[2],
            time_format_preference: params[3],
            timezone_preference: params[4],
            multiple_timezones_enabled: params[5],
          },
        ];
      }

      return [];
    },
  };

  return { records, sql };
}

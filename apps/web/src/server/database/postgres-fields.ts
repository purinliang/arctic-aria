export type PostgresDateOnlyField = Date | string;
export type NullablePostgresDateOnlyField = PostgresDateOnlyField | null;

// PostgreSQL date/time-only fields are raw calendar or clock values. Do not
// convert them through UTC; timezone logic belongs at timestamp boundaries.
export function dateOnlyFieldToDateKey(value: PostgresDateOnlyField) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function nullableDateOnlyFieldToDateKey(
  value: NullablePostgresDateOnlyField,
) {
  return value ? dateOnlyFieldToDateKey(value) : null;
}

export function nullableTimeOnlyFieldToTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

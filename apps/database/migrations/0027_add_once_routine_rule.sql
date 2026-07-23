ALTER TABLE routine_rules
  DROP CONSTRAINT IF EXISTS routine_rules_type_allowed;

ALTER TABLE routine_rules
  ADD CONSTRAINT routine_rules_type_allowed CHECK (
    rule_type IN (
      'once',
      'daily',
      'weekly',
      'bi_weekly',
      'monthly_by_date',
      'day_interval'
    )
  );

import { FieldLabel, TextInput } from "./input-field";

export function EstimatedDurationMinutesField({
  darkMode,
  disabled,
  label,
  placeholder,
  value,
  onChange,
}: {
  darkMode: boolean;
  disabled?: boolean;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldLabel darkMode={darkMode} label={label} optional>
      <TextInput
        darkMode={darkMode}
        value={value}
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldLabel>
  );
}

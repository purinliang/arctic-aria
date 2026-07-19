import { useState } from "react";
import { defaultDescriptionForSeed } from "./default-description";

export function useDefaultDescriptionPlaceholder(defaults: readonly string[]) {
  const [placeholder] = useState(() =>
    defaultDescriptionForSeed(`${Date.now()}-${Math.random()}`, defaults),
  );

  return placeholder;
}

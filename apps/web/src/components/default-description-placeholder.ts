import { useState } from "react";
import { defaultDescriptionForSeed } from "./default-description";

export function useDefaultDescriptionPlaceholder(
  defaults: readonly string[],
  seed?: string,
) {
  const [placeholder] = useState(() =>
    defaultDescriptionForSeed(
      seed?.trim() || `${Date.now()}-${Math.random()}`,
      defaults,
    ),
  );

  return placeholder;
}

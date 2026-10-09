"use client";

import { useSyncExternalStore } from "react";
import type { ComponentProps } from "react";
import { TextInput } from "./input-field";
import { cx } from "../utils";

const subscribe = () => () => {};
const serverMask = () => "pending" as const;
const browserMask = () => typeof CSS !== "undefined" && CSS.supports("-webkit-text-security", "disc")
  ? "css" as const : "native" as const;

export function MaskedTextInput({
  value,
  disabled,
  className,
  ...props
}: Omit<ComponentProps<typeof TextInput>, "type" | "defaultValue" | "value"> & { value: string }) {
  const mask = useSyncExternalStore(subscribe, browserMask, serverMask);

  // Do not render a secret until the browser's masking support is known.
  return <TextInput {...props}
    type={mask === "native" ? "password" : "text"}
    value={mask === "pending" ? "" : value}
    disabled={disabled || mask === "pending"}
    className={cx(mask !== "native" && "[-webkit-text-security:disc]", className)}
  />;
}

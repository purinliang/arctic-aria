import type { LoginInput, RegisterInput } from "./validation.ts";

export const emptyRegister: RegisterInput = {
  username: "",
  displayName: "",
  password: "",
  repeatPassword: "",
};

export const emptyLogin: LoginInput = {
  username: "",
  password: "",
};

export function demoLoginInputForSearch(search: string): LoginInput | null {
  return new URLSearchParams(search).get("mode") === "demo"
    ? { username: "demo", password: "demo123456+" }
    : null;
}

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

export const demoLoginInput: LoginInput = {
  username: "demo",
  password: "demo123456+",
};

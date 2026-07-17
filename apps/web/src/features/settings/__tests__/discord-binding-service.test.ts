import assert from "node:assert/strict";
import test from "node:test";
import { createDiscordBindingService } from "../server/discord-binding-service.ts";

test("discord binding service creates binding codes that expire after 15 minutes", async () => {
  const repository = createRepositoryStub();
  const service = createDiscordBindingService(repository);

  const result = await service.createBindingCode("user-1");

  assert.equal(result.ok, true);
  const createdCode = repository.createdCode;

  assert.ok(createdCode);
  assert.equal(createdCode.userId, "user-1");
  assert.ok(createdCode.codeHash);
  assert.equal(
    createdCode.expiresAt.getTime() - createdCode.createdAt.getTime(),
    15 * 60 * 1000,
  );
});

function createRepositoryStub() {
  let createdCode:
    | {
        userId: string;
        codeHash: string;
        expiresAt: Date;
        createdAt: Date;
      }
    | null = null;

  return {
    get createdCode() {
      return createdCode;
    },
    async cancelBindingCodesByUserId() {},
    async createBindingCode(input: NonNullable<typeof createdCode>) {
      createdCode = input;
    },
    async findActiveByUserId() {
      return null;
    },
    async revokeActiveByUserId() {
      return null;
    },
  };
}

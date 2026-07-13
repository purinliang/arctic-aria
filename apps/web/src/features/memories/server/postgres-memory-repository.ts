import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  CancelPinnedMemoryInput,
  CompletePinnedMemoryInput,
  CreateMemoryCategoryInput,
  CreateMemoryInput,
  DeleteMemoryCategoryInput,
  DeleteMemoryInput,
  IgnoreMemoryInput,
  MemoryRepository,
  PinMemoryInput,
  ReplacePinnedMemoryInput,
  UnpinMemoryInput,
  UpdateMemoryCategoryInput,
  UpdateMemoryInput,
} from "./memory-repository.ts";
import * as coreQueries from "./postgres-memory-core-queries.ts";
import * as pinnedQueries from "./postgres-pinned-memory-queries.ts";

export class PostgresMemoryRepository implements MemoryRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
  }

  ensureDefaultCategories(userId: string) {
    return coreQueries.ensureDefaultCategories(this.getSql(), userId);
  }

  listCategories(userId: string) {
    return coreQueries.listCategories(this.getSql(), userId);
  }

  createCategory(input: CreateMemoryCategoryInput) {
    return coreQueries.createCategory(this.getSql(), input);
  }

  updateCategory(input: UpdateMemoryCategoryInput) {
    return coreQueries.updateCategory(this.getSql(), input);
  }

  deleteCategory(input: DeleteMemoryCategoryInput) {
    return coreQueries.deleteCategory(this.getSql(), input);
  }

  listMemories(userId: string) {
    return coreQueries.listMemories(this.getSql(), userId);
  }

  createMemory(input: CreateMemoryInput) {
    return coreQueries.createMemory(this.getSql(), input);
  }

  updateMemory(input: UpdateMemoryInput) {
    return coreQueries.updateMemory(this.getSql(), input);
  }

  deleteMemory(input: DeleteMemoryInput) {
    return coreQueries.deleteMemory(this.getSql(), input);
  }

  pinMemory(input: PinMemoryInput) {
    return pinnedQueries.pinMemory(this.getSql(), input);
  }

  ignoreMemory(input: IgnoreMemoryInput) {
    return pinnedQueries.ignoreMemory(this.getSql(), input);
  }

  unpinMemory(input: UnpinMemoryInput) {
    return pinnedQueries.unpinMemory(this.getSql(), input);
  }

  listPinnedMemories(userId: string) {
    return pinnedQueries.listPinnedMemories(this.getSql(), userId);
  }

  completePinnedMemory(input: CompletePinnedMemoryInput) {
    return pinnedQueries.completePinnedMemory(this.getSql(), input);
  }

  cancelPinnedMemoryDone(input: CancelPinnedMemoryInput) {
    return pinnedQueries.cancelPinnedMemoryDone(this.getSql(), input);
  }

  replacePinnedMemory(input: ReplacePinnedMemoryInput) {
    return pinnedQueries.replacePinnedMemory(this.getSql(), input);
  }
}

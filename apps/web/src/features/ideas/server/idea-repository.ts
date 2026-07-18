export type IdeaSource = "web" | "discord" | "mobile" | "agent";
export type IdeaTriageStatus = "untriaged" | "kept" | "converted" | "archived";

export type IdeaRecord = {
  id: string;
  userId: string;
  rawText: string;
  source: IdeaSource;
  triageStatus: IdeaTriageStatus;
  sourceMetadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type CaptureIdeaInput = {
  userId: string;
  rawText: string;
  source: IdeaSource;
  sourceMetadata?: Record<string, unknown>;
  occurredAt: Date;
};

export type UpdateIdeaInput = {
  userId: string;
  ideaId: string;
  rawText: string;
  occurredAt: Date;
};

export type ArchiveIdeaInput = {
  userId: string;
  ideaId: string;
  occurredAt: Date;
};

export type IdeaRepository = {
  capture(input: CaptureIdeaInput): Promise<IdeaRecord>;
  listUnarchived(userId: string): Promise<IdeaRecord[]>;
  update(input: UpdateIdeaInput): Promise<IdeaRecord | null>;
  archive(input: ArchiveIdeaInput): Promise<boolean>;
};

export class InMemoryIdeaRepository implements IdeaRepository {
  private ideas: IdeaRecord[] = [];

  async capture(input: CaptureIdeaInput) {
    const idea: IdeaRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      rawText: input.rawText,
      source: input.source,
      triageStatus: "untriaged",
      sourceMetadata: input.sourceMetadata ?? {},
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      archivedAt: null,
    };

    this.ideas.push(idea);

    return idea;
  }

  async listUnarchived(userId: string) {
    return this.ideas
      .filter((idea) => idea.userId === userId && idea.archivedAt === null)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async update(input: UpdateIdeaInput) {
    const idea = this.ideas.find(
      (item) =>
        item.userId === input.userId &&
        item.id === input.ideaId &&
        item.archivedAt === null,
    );

    if (!idea) {
      return null;
    }

    idea.rawText = input.rawText;
    idea.updatedAt = input.occurredAt;

    return idea;
  }

  async archive(input: ArchiveIdeaInput) {
    const idea = this.ideas.find(
      (item) =>
        item.userId === input.userId &&
        item.id === input.ideaId &&
        item.archivedAt === null,
    );

    if (!idea) {
      return false;
    }

    idea.triageStatus = "archived";
    idea.archivedAt = input.occurredAt;
    idea.updatedAt = input.occurredAt;

    return true;
  }
}

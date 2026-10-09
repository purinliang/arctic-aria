import { levelInput } from './stock-level.ts';
import { stockQuantity } from './supplies.ts';
import type { SupplyInput, SupplyItem } from './types.ts';

type Callbacks = {
  save: (input: SupplyInput) => Promise<SupplyItem | null>;
  read: (id: string) => Promise<SupplyItem | null>;
  visible: (item: SupplyItem,level: number) => void;
  confirmed: (item: SupplyItem) => void;
  settled: (id: string) => void;
  failed?: () => void;
};
type Entry = { item: SupplyItem; level: number; revision: number; callbacks: Callbacks; completion: Promise<void> };

// One versioned write per item; intermediate intentions collapse to the latest level.
export class StockLevelQueue {
  private readonly entries = new Map<string,Entry>();

  enqueue(item: SupplyItem,level: number,callbacks: Callbacks) {
    if (!levelInput(item,level)) return Promise.resolve();
    const existing = this.entries.get(item.id);
    if (existing) {
      existing.level = level;
      existing.revision++;
      existing.callbacks = callbacks;
      callbacks.visible(existing.item,level);
      return existing.completion;
    }
    const entry: Entry = { item,level,revision: 1,callbacks,completion: Promise.resolve() };
    this.entries.set(item.id,entry);
    callbacks.visible(item,level);
    entry.completion = this.drain(entry).finally(() => {
      this.entries.delete(item.id);
      entry.callbacks.settled(item.id);
    });
    return entry.completion;
  }

  private async drain(entry: Entry) {
    let retriedRevision = 0;
    while (stockQuantity(entry.item).quantity !== entry.level) {
      const revision = entry.revision;
      const input = levelInput(entry.item,entry.level);
      if (!input) { entry.callbacks.failed?.(); break; }
      const saved = await entry.callbacks.save(input);
      if (saved) {
        entry.item = saved;
        entry.callbacks.confirmed(saved);
        entry.callbacks.visible(saved,entry.level);
        continue;
      }
      // A transport error may have committed. Read the current version before retrying.
      const current = await entry.callbacks.read(entry.item.id);
      if (current && current.version >= entry.item.version) {
        entry.item = current;
        entry.callbacks.confirmed(current);
      }
      if (entry.revision !== revision) continue;
      if (stockQuantity(entry.item).quantity === entry.level) break;
      if (current && retriedRevision !== revision) { retriedRevision = revision; continue; }
      entry.callbacks.failed?.();
      break;
    }
    entry.callbacks.visible(entry.item,stockQuantity(entry.item).quantity);
  }
}

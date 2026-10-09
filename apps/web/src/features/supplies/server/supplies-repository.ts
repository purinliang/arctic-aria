import { getSql } from '../../../server/database/neon.ts';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { Observation, StockCommand, StockQuantity, QuantityCommand, SuppliesData, SupplyInput, SupplyItem, WishInput, WishItem } from '../types.ts';
import { stockQuantity } from '../supplies.ts';

type SupplyRow = { id: string; kind: SupplyItem['kind']; title: string; note: string | null; level: number; spares: number; version: number; cycle_id: string; observations: Observation[] } & StockQuantity;
const itemSelect = `SELECT item.id,item.kind,item.title,item.note,item.level,item.spares,item.version,item.cycle_id,
  item.quantity,item.unit,item.increment,item.target_quantity AS "targetQuantity",item.low_stock_threshold AS "lowStockThreshold",
  COALESCE((SELECT jsonb_agg(point ORDER BY point."recordedAt" DESC,point.id DESC) FROM
    (SELECT id,cycle_id AS "cycleId",level,recorded_at AS "recordedAt" FROM supply_observations
     WHERE user_id = item.user_id AND item_id = item.id AND cycle_id = item.cycle_id ORDER BY recorded_at DESC,id DESC LIMIT 3) point), '[]'::jsonb) AS observations
  FROM supply_items item WHERE item.user_id = $1 AND item.archived_at IS NULL`;
const mapItem = (row: SupplyRow): SupplyItem => ({ id: row.id, kind: row.kind, title: row.title, note: row.note, level: row.level,
  spares: row.spares, version: row.version, cycleId: row.cycle_id, quantity: Number(row.quantity),unit: row.unit,increment: Number(row.increment),
  targetQuantity: Number(row.targetQuantity),lowStockThreshold: Number(row.lowStockThreshold),
  observations: row.observations.map((point) => ({ ...point, recordedAt: new Date(point.recordedAt).toISOString() })) });
const wishColumns = 'id,title,country,shop,url,note,linked_supply_id AS "linkedSupplyId",status,version';
const optional = (value: string | null) => value?.trim() || null;

export class SuppliesRepository {
  private readonly client?: NeonQueryFunction<false, false>;
  constructor(client?: NeonQueryFunction<false, false>) { this.client = client; }
  private sql() { return this.client ?? getSql(); }
  async data(owner: string): Promise<SuppliesData> {
    const rows = await this.sql().query(`${itemSelect} ORDER BY item.title,item.id`, [owner]) as SupplyRow[];
    const wishlist = await this.sql().query(`SELECT wish.id,wish.title,wish.country,wish.shop,wish.url,wish.note,wish.linked_supply_id AS "linkedSupplyId",wish.status,wish.version,
      item.title AS "linkedTitle",item.archived_at IS NOT NULL AS "linkedArchived" FROM supply_wishlist wish
      LEFT JOIN supply_items item ON item.user_id = wish.user_id AND item.id = wish.linked_supply_id
      WHERE wish.user_id = $1 AND wish.archived_at IS NULL ORDER BY wish.status,wish.created_at DESC,wish.id`, [owner]) as WishItem[];
    return { items: rows.map(mapItem), wishlist };
  }
  async item(owner: string, id: string) {
    const rows = await this.sql().query(`${itemSelect} AND item.id = $2`, [owner,id]) as SupplyRow[];
    return rows[0] ? mapItem(rows[0]) : null;
  }
  async save(owner: string, input: SupplyInput) {
    const stock = stockQuantity(input);
    const rows = await this.sql().query('SELECT save_supply_stock($1::uuid,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) AS saved',
      [owner,input.id,input.isNew,input.version,input.kind,input.title.trim(),optional(input.note),stock.quantity,stock.unit,stock.increment,stock.targetQuantity,stock.lowStockThreshold,input.spares]);
    return rows[0].saved ? this.item(owner,input.id) : null;
  }
  async adjust(owner: string, input: QuantityCommand): Promise<{ error: string } | { item: SupplyItem }> {
    const rows = await this.sql().query('SELECT adjust_supply_quantity($1::uuid,$2::uuid,$3,$4::uuid,$5) AS result',
      [owner,input.id,input.version,input.key,input.direction]);
    const result = rows[0].result as { error?: string };
    if (result.error) return { error: result.error };
    const item = await this.item(owner,input.id);
    return item ? { item } : { error: 'missing' };
  }
  async change(owner: string, input: StockCommand): Promise<{ error: string } | { item: SupplyItem }> {
    const rows = await this.sql().query('SELECT change_supply($1::uuid,$2::uuid,$3,$4::uuid,$5,$6,$7) AS result',
      [owner,input.id,input.version,input.key,input.operation,input.level,input.useSpare]);
    const result = rows[0].result as { error?: string };
    if (result.error) return { error: result.error };
    const item = await this.item(owner,input.id);
    return item ? { item } : { error: 'missing' };
  }
  async archive(owner: string, id: string, version: number) {
    return (await this.sql().query('UPDATE supply_items SET archived_at = now(),version = version + 1 WHERE user_id = $1 AND id = $2 AND version = $3 AND archived_at IS NULL RETURNING id', [owner,id,version])).length > 0;
  }
  async history(owner: string, id: string) {
    const rows = await this.sql().query('SELECT id,cycle_id AS "cycleId",level,recorded_at AS "recordedAt" FROM supply_observations WHERE user_id = $1 AND item_id = $2 ORDER BY recorded_at DESC,id DESC', [owner,id]) as Observation[];
    return rows.map((row) => ({ ...row, recordedAt: new Date(row.recordedAt).toISOString() }));
  }
  async saveWish(owner: string, input: WishInput) {
    const args = [owner,input.id,input.title.trim(),optional(input.country),optional(input.shop),input.url?.trim() ? new URL(input.url.trim()).href : null,optional(input.note),input.linkedSupplyId,input.status,input.version];
    const rows = await this.sql().query(input.isNew
      ? `INSERT INTO supply_wishlist (user_id,id,title,country,shop,url,note,linked_supply_id,status)
          SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9 WHERE $8::uuid IS NULL OR EXISTS
          (SELECT 1 FROM supply_items WHERE user_id = $1 AND id = $8 AND archived_at IS NULL)
          ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id WHERE supply_wishlist.user_id = $1 AND supply_wishlist.archived_at IS NULL RETURNING ${wishColumns}`
      : `UPDATE supply_wishlist wish SET title = $3,country = $4,shop = $5,url = $6,note = $7,linked_supply_id = $8,status = $9,version = version + 1,updated_at = now()
          WHERE user_id = $1 AND id = $2 AND version = $10 AND archived_at IS NULL AND
          ($8::uuid IS NULL OR $8 = wish.linked_supply_id OR EXISTS (SELECT 1 FROM supply_items WHERE user_id = $1 AND id = $8 AND archived_at IS NULL)) RETURNING ${wishColumns}`, args);
    return rows[0] as WishItem | undefined;
  }
  async archiveWish(owner: string, id: string, version: number) {
    return (await this.sql().query('UPDATE supply_wishlist SET archived_at = now(),version = version + 1 WHERE user_id = $1 AND id = $2 AND version = $3 AND archived_at IS NULL RETURNING id', [owner,id,version])).length > 0;
  }
}

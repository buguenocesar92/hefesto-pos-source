// Per-tab recovery: no customer catalogue, credentials or full database stored locally.
export const RECOVERY_KEY = 'hefesto-pos:tab-recovery:v1';
export type PendingOperation = {key:string; id:string; version:number};
export type Draft = {cart:{id:string;qty:number}[];customer:string;discount:number;holdId:string};
export type Recovery = {draft:Draft;pending:PendingOperation|null};
export function parseRecovery(raw:string|null):Recovery|null {
  if(!raw)return null;
  const v=JSON.parse(raw);
  if(v?.format!==1||!v.draft||!Array.isArray(v.draft.cart)||v.draft.cart.length>1000)throw Error('Recuperación local inválida');
  const d=v.draft;
  if(!d.cart.every((x:any)=>typeof x.id==='string'&&Number.isFinite(x.qty)&&x.qty>=0)||!Number.isSafeInteger(d.discount)||d.discount<0||typeof d.customer!=='string'||typeof d.holdId!=='string')throw Error('Carrito local inválido');
  const p=v.pending;
  if(p!==null&&(typeof p?.key!=='string'||typeof p.id!=='string'||p.id.length<6||!Number.isSafeInteger(p.version)||p.version<0))throw Error('Operación local inválida');
  if(p){const a=JSON.parse(p.key);if(!a||typeof a.type!=='string')throw Error('Acción local inválida')}
  return {draft:d,pending:p};
}
export function serializeRecovery(draft:Draft,pending:PendingOperation|null){return JSON.stringify({format:1,draft,pending})}
export function recoveredOutcome(processed:string[],pending:PendingOperation|null){return !!pending&&processed.includes(pending.id)}

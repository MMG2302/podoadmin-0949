import { describe, expect, it, vi } from 'vitest';

// Regression guard for a real cross-tenant leak (Claude Security finding F5, fixed
// 2026-07-28): a client-supplied `podiatristUserId` used to REPLACE the caller's
// role-derived scope filter instead of narrowing it, so any authenticated user could
// read another tenant's satisfaction data by passing an arbitrary podiatrist id.
//
// We can't run real SQL against D1 in this unit-test environment, so instead of
// asserting on returned rows we assert on the *shape of the query itself*: the fix
// must always AND the podiatristUserId condition on top of the scope condition, never
// swap one for the other. If someone reintroduces the old `if (podiatristUserId) {...}
// else if (scope...) {...}` branching, the scope condition disappears from the
// query and this test catches that by counting the top-level AND-ed conditions
// drizzle's `and(...)` produced in the captured `.where(...)` call.

const whereCalls: unknown[] = [];

vi.mock('../database', () => ({
  database: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn((cond: unknown) => {
          whereCalls.push(cond);
          return Promise.resolve([]);
        }),
      })),
    })),
  },
}));

import { fetchSatisfactionSummary } from './satisfaction-summary';

type SqlNode = { queryChunks?: unknown[] };

/** and(c1, c2, ..., cN) builds `(c1 and c2 and ... and cN)`: an outer SQL wrapping
 *  a single inner SQL whose queryChunks alternate [cond, " and ", cond, " and ", cond...].
 *  Counting is structural, not string-matching, so it survives formatting changes. */
function countAndedConditions(node: SqlNode): number {
  const inner = node.queryChunks?.find((c): c is SqlNode => !!(c as SqlNode)?.queryChunks);
  if (!inner?.queryChunks) return 1;
  return Math.ceil(inner.queryChunks.length / 2);
}

function lastWhereConditionCount(): number {
  const last = whereCalls.at(-1);
  if (!last) throw new Error('.where(...) was never called');
  return countAndedConditions(last as SqlNode);
}

describe('fetchSatisfactionSummary — scope must narrow podiatristUserId, never be replaced by it', () => {
  it('AND-uses both the clinic scope and podiatristUserId (does not drop the scope condition)', async () => {
    await fetchSatisfactionSummary({
      scope: { mode: 'clinic', clinicId: 'clinic-A' },
      podiatristUserId: 'podiatrist-from-clinic-B',
    });
    // 3 base conditions (date range x2 + isNotNull) + clinic scope + podiatristUserId = 5.
    // The pre-fix bug would produce 4 (scope condition silently dropped).
    expect(lastWhereConditionCount()).toBe(5);
  });

  it('AND-uses both the podiatrist scope and podiatristUserId', async () => {
    await fetchSatisfactionSummary({
      scope: { mode: 'podiatrist', createdBy: 'me' },
      podiatristUserId: 'someone-else',
    });
    expect(lastWhereConditionCount()).toBe(5);
  });

  it('AND-uses both the receptionist scope and podiatristUserId', async () => {
    await fetchSatisfactionSummary({
      scope: { mode: 'receptionist', createdByIn: ['assigned-1', 'assigned-2'] },
      podiatristUserId: 'not-assigned-to-me',
    });
    expect(lastWhereConditionCount()).toBe(5);
  });

  it('still applies only the scope condition when no podiatristUserId is given', async () => {
    await fetchSatisfactionSummary({ scope: { mode: 'podiatrist', createdBy: 'me' } });
    // 3 base conditions + scope, no podiatristUserId filter = 4.
    expect(lastWhereConditionCount()).toBe(4);
  });

  it('returns the empty summary without querying when scope is "none"', async () => {
    const result = await fetchSatisfactionSummary({
      scope: { mode: 'none' },
      podiatristUserId: 'anyone',
    });
    expect(result.totals.total).toBe(0);
    expect(result.comments).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { filterValidIndependentPodiatristIds } from './receptionist-limits';

// Regression guard: PATCH /api/receptionists/:id/assigned-podiatrists solo filtraba
// los IDs del body cuando la recepcionista pertenecía a una clínica. Para una
// recepcionista de podólogo independiente los IDs se guardaban tal cual, y como el
// acceso a pacientes/sesiones de una recepcionista se decide por esa lista
// (resolveClinicalAccessDenied en tenant-isolation.ts), un podólogo podía asignarle
// el userId de un podólogo de otro tenant y leer sus pacientes con esa cuenta.
// Estos tests fallan si el filtro se afloja.
describe('filterValidIndependentPodiatristIds', () => {
  const owner = 'user_created_owner';
  const otherTenant = 'user_created_otro_tenant';

  it('acepta al podólogo dueño', () => {
    expect(filterValidIndependentPodiatristIds(owner, [owner])).toEqual([owner]);
  });

  it('descarta podólogos de otro tenant', () => {
    expect(filterValidIndependentPodiatristIds(owner, [otherTenant])).toEqual([]);
    expect(filterValidIndependentPodiatristIds(owner, [owner, otherTenant])).toEqual([owner]);
  });

  it('acota, nunca amplía: no deja escalar a varios podólogos', () => {
    expect(filterValidIndependentPodiatristIds(owner, [otherTenant, 'x', 'y'])).toEqual([]);
  });

  it('permite desasignar con lista vacía', () => {
    expect(filterValidIndependentPodiatristIds(owner, [])).toEqual([]);
  });

  it('es seguro ante dueño ausente o body malformado', () => {
    expect(filterValidIndependentPodiatristIds(null, [owner])).toEqual([]);
    expect(filterValidIndependentPodiatristIds(undefined, [owner])).toEqual([]);
    expect(filterValidIndependentPodiatristIds('', [owner])).toEqual([]);
    expect(filterValidIndependentPodiatristIds(owner, null)).toEqual([]);
    expect(filterValidIndependentPodiatristIds(owner, 'no-es-array')).toEqual([]);
    expect(filterValidIndependentPodiatristIds(owner, { 0: owner })).toEqual([]);
  });
});

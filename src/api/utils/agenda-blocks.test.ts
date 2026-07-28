import { describe, it, expect } from 'vitest';
import {
  END_OF_DAY_MINUTES,
  agendaTimeToMinutes,
  blockAppliesToDate,
  blocksForDate,
  findOverlappingBlock,
  isAllDayBlock,
  minutesToAgendaTime,
  parseWeekdays,
  serializeWeekdays,
  validateAgendaBlockInput,
  weekdayOfIsoDate,
  type AgendaBlock,
  type AgendaBlockInput,
} from './agenda-blocks';

function makeBlock(overrides: Partial<AgendaBlock> = {}): AgendaBlock {
  return {
    id: 'blk_1',
    podiatristId: 'user_podiatrist_001',
    clinicId: 'clinic_1',
    title: 'Comida',
    category: 'lunch',
    recurrence: 'weekly',
    weekdays: [1, 2, 3, 4, 5],
    startDate: null,
    endDate: null,
    startTime: '14:00',
    endTime: '15:00',
    createdBy: 'user_podiatrist_001',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeInput(overrides: Partial<AgendaBlockInput> = {}): AgendaBlockInput {
  return {
    podiatristId: 'user_podiatrist_001',
    clinicId: 'clinic_1',
    title: 'Comida',
    category: 'lunch',
    recurrence: 'weekly',
    weekdays: [1, 2, 3, 4, 5],
    startDate: null,
    endDate: null,
    startTime: '14:00',
    endTime: '15:00',
    ...overrides,
  };
}

describe('agenda-blocks · horas', () => {
  it('convierte HH:MM a minutos y de vuelta', () => {
    expect(agendaTimeToMinutes('00:00')).toBe(0);
    expect(agendaTimeToMinutes('14:30')).toBe(870);
    expect(agendaTimeToMinutes('24:00')).toBe(END_OF_DAY_MINUTES);
    expect(minutesToAgendaTime(870)).toBe('14:30');
    expect(minutesToAgendaTime(END_OF_DAY_MINUTES)).toBe('24:00');
  });

  it('reconoce un bloqueo de día completo', () => {
    expect(isAllDayBlock(makeBlock({ startTime: '00:00', endTime: '24:00' }))).toBe(true);
    expect(isAllDayBlock(makeBlock({ startTime: '14:00', endTime: '15:00' }))).toBe(false);
  });
});

describe('agenda-blocks · weekdays', () => {
  it('calcula el día de la semana sin desfase por zona horaria', () => {
    // 2026-07-28 es martes; 2026-08-02, domingo.
    expect(weekdayOfIsoDate('2026-07-28')).toBe(2);
    expect(weekdayOfIsoDate('2026-08-02')).toBe(0);
  });

  it('parsea y serializa CSV ignorando basura y duplicados', () => {
    expect(parseWeekdays('1,2,2,9,x,5')).toEqual([1, 2, 5]);
    expect(parseWeekdays(null)).toEqual([]);
    expect(serializeWeekdays([5, 1, 1, 3])).toBe('1,3,5');
  });
});

describe('agenda-blocks · vigencia', () => {
  it('bloqueo semanal permanente aplica solo en sus días', () => {
    const lunch = makeBlock();
    expect(blockAppliesToDate(lunch, '2026-07-28')).toBe(true); // martes
    expect(blockAppliesToDate(lunch, '2026-08-02')).toBe(false); // domingo
  });

  it('bloqueo semanal respeta la ventana de vigencia', () => {
    const temporal = makeBlock({ startDate: '2026-08-01', endDate: '2026-08-31' });
    expect(blockAppliesToDate(temporal, '2026-07-28')).toBe(false); // antes de vigencia
    expect(blockAppliesToDate(temporal, '2026-08-04')).toBe(true); // martes dentro
    expect(blockAppliesToDate(temporal, '2026-09-01')).toBe(false); // después de vigencia
  });

  it('bloqueo puntual de un solo día no se escapa al futuro', () => {
    const once = makeBlock({
      recurrence: 'once',
      weekdays: [],
      startDate: '2026-07-30',
      endDate: '2026-07-30',
    });
    expect(blockAppliesToDate(once, '2026-07-29')).toBe(false);
    expect(blockAppliesToDate(once, '2026-07-30')).toBe(true);
    expect(blockAppliesToDate(once, '2026-07-31')).toBe(false);
  });

  it('bloqueo puntual multi-día cubre todo el rango (vacaciones)', () => {
    const vacaciones = makeBlock({
      recurrence: 'once',
      weekdays: [],
      category: 'vacation',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      startTime: '00:00',
      endTime: '24:00',
    });
    expect(blockAppliesToDate(vacaciones, '2026-08-09')).toBe(false);
    expect(blockAppliesToDate(vacaciones, '2026-08-12')).toBe(true);
    expect(blockAppliesToDate(vacaciones, '2026-08-14')).toBe(true);
    expect(blockAppliesToDate(vacaciones, '2026-08-15')).toBe(false);
  });

  it('un bloqueo puntual sin fecha de inicio no aplica nunca', () => {
    const roto = makeBlock({ recurrence: 'once', weekdays: [], startDate: null, endDate: null });
    expect(blockAppliesToDate(roto, '2026-07-28')).toBe(false);
  });
});

describe('agenda-blocks · solapes', () => {
  const lunch = makeBlock(); // L-V 14:00–15:00

  it('detecta una cita que cae dentro del bloqueo', () => {
    expect(findOverlappingBlock([lunch], '2026-07-28', '14:15', 30)?.id).toBe('blk_1');
  });

  it('detecta una cita que termina dentro del bloqueo', () => {
    expect(findOverlappingBlock([lunch], '2026-07-28', '13:45', 30)?.id).toBe('blk_1');
  });

  it('detecta una cita que envuelve al bloqueo', () => {
    expect(findOverlappingBlock([lunch], '2026-07-28', '13:00', 180)?.id).toBe('blk_1');
  });

  it('deja pasar citas que solo tocan el borde', () => {
    expect(findOverlappingBlock([lunch], '2026-07-28', '13:00', 60)).toBeNull(); // termina justo a las 14:00
    expect(findOverlappingBlock([lunch], '2026-07-28', '15:00', 60)).toBeNull(); // empieza justo a las 15:00
  });

  it('no bloquea en un día en que la recurrencia no aplica', () => {
    expect(findOverlappingBlock([lunch], '2026-08-02', '14:15', 30)).toBeNull(); // domingo
  });

  it('un bloqueo de día completo tapa cualquier hora', () => {
    const festivo = makeBlock({
      id: 'blk_holiday',
      podiatristId: null,
      recurrence: 'once',
      weekdays: [],
      category: 'other',
      title: 'Festivo',
      startDate: '2026-09-16',
      endDate: '2026-09-16',
      startTime: '00:00',
      endTime: '24:00',
    });
    expect(findOverlappingBlock([festivo], '2026-09-16', '08:00', 30)?.id).toBe('blk_holiday');
    expect(findOverlappingBlock([festivo], '2026-09-16', '23:30', 30)?.id).toBe('blk_holiday');
    expect(findOverlappingBlock([festivo], '2026-09-17', '08:00', 30)).toBeNull();
  });

  it('lista los bloqueos del día ordenados por hora', () => {
    const tarde = makeBlock({ id: 'blk_2', title: 'Salida', startTime: '17:00', endTime: '18:00' });
    const rows = blocksForDate([tarde, lunch], '2026-07-28');
    expect(rows.map((b) => b.id)).toEqual(['blk_1', 'blk_2']);
  });
});

describe('agenda-blocks · validación', () => {
  it('acepta una comida semanal', () => {
    const res = validateAgendaBlockInput(makeInput());
    expect(res.ok).toBe(true);
  });

  it('rechaza fin anterior o igual al inicio', () => {
    const res = validateAgendaBlockInput(makeInput({ startTime: '15:00', endTime: '14:00' }));
    expect(res).toMatchObject({ ok: false });
  });

  it('rechaza un semanal sin días elegidos', () => {
    const res = validateAgendaBlockInput(makeInput({ weekdays: [] }));
    expect(res).toMatchObject({ ok: false });
  });

  it('rechaza un puntual sin fecha', () => {
    const res = validateAgendaBlockInput(makeInput({ recurrence: 'once', startDate: null }));
    expect(res).toMatchObject({ ok: false });
  });

  it('cierra el rango de un puntual de un día (endDate = startDate)', () => {
    const res = validateAgendaBlockInput(
      makeInput({ recurrence: 'once', weekdays: [], startDate: '2026-07-30', endDate: null })
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.endDate).toBe('2026-07-30');
  });

  it('rechaza títulos vacíos y horas mal formadas', () => {
    expect(validateAgendaBlockInput(makeInput({ title: ' ' }))).toMatchObject({ ok: false });
    expect(validateAgendaBlockInput(makeInput({ startTime: '25:00' }))).toMatchObject({ ok: false });
    expect(validateAgendaBlockInput(makeInput({ endTime: '14:60' }))).toMatchObject({ ok: false });
  });

  it('rechaza fechas con formato inválido', () => {
    expect(
      validateAgendaBlockInput(makeInput({ recurrence: 'once', startDate: '30-07-2026' }))
    ).toMatchObject({ ok: false });
  });
});

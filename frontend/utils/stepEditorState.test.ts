import { describe, expect, it } from 'vitest';
import type { StepType } from '@/types/case';
import { getMaxStepId, insertStepAt, markStepDeleted, normalizeFetchedSteps, replaceStep } from './stepEditorState';

function createStep(id: number, stepNo: number, editState: StepType['editState'] = 'notChanged'): StepType {
  return {
    id,
    step: `step-${id}`,
    result: `result-${id}`,
    createdAt: new Date('2026-03-14T00:00:00Z'),
    updatedAt: new Date('2026-03-14T00:00:00Z'),
    caseSteps: {
      stepNo,
    },
    uid: `step-${id}`,
    editState,
  };
}

describe('stepEditorState', () => {
  it('normalizes fetched steps with stable uid and edit state', () => {
    const steps = [
      {
        ...createStep(10, 2, 'changed'),
        uid: undefined as unknown as string,
        editState: 'changed' as const,
      },
    ];

    expect(normalizeFetchedSteps(steps)).toEqual([
      {
        ...createStep(10, 2, 'notChanged'),
        uid: 'step-10',
      },
    ]);
  });

  it('returns the max step id', () => {
    expect(getMaxStepId([createStep(5, 1), createStep(7, 2)])).toBe(7);
    expect(getMaxStepId(undefined)).toBe(0);
  });

  it('inserts a new step and shifts following step numbers', () => {
    const existing = [createStep(1, 1), createStep(2, 2), createStep(3, 3)];
    const inserted = createStep(4, 2, 'new');

    expect(insertStepAt(existing, inserted, 2)).toEqual([
      createStep(1, 1),
      { ...createStep(2, 3), editState: 'changed' },
      { ...createStep(3, 4), editState: 'changed' },
      inserted,
    ]);
  });

  it('marks a step as deleted and re-numbers the following steps', () => {
    const existing = [createStep(1, 1), createStep(2, 2), createStep(3, 3)];

    expect(markStepDeleted(existing, 2)).toEqual([
      createStep(1, 1),
      { ...createStep(2, 2), editState: 'deleted' },
      { ...createStep(3, 2), editState: 'changed' },
    ]);
  });

  it('replaces only the targeted step', () => {
    const existing = [createStep(1, 1), createStep(2, 2)];
    const changed = { ...createStep(2, 2), step: 'updated', editState: 'changed' as const };

    expect(replaceStep(existing, 2, changed)).toEqual([createStep(1, 1), changed]);
  });
});

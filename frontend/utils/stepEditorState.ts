import type { StepType } from '@/types/case';

export function normalizeFetchedSteps(steps: StepType[] | undefined): StepType[] {
  return (
    steps?.map((step) => ({
      ...step,
      editState: 'notChanged',
      uid: step.uid ?? `step-${step.id}`,
    })) ?? []
  );
}

export function getMaxStepId(steps: StepType[] | undefined): number {
  return (steps ?? []).reduce((maxId, step) => Math.max(maxId, step.id), 0);
}

export function insertStepAt(steps: StepType[] | undefined, newStep: StepType, newStepNo: number): StepType[] {
  const prevSteps = steps ?? [];

  const updatedSteps = prevSteps.map((step): StepType => {
    if (step.caseSteps.stepNo >= newStepNo) {
      const nextEditState: StepType['editState'] = step.editState === 'notChanged' ? 'changed' : step.editState;

      return {
        ...step,
        editState: nextEditState,
        caseSteps: {
          ...step.caseSteps,
          stepNo: step.caseSteps.stepNo + 1,
        },
      };
    }

    return step;
  });

  updatedSteps.push(newStep);

  return updatedSteps;
}

export function markStepDeleted(steps: StepType[] | undefined, stepId: number): StepType[] | undefined {
  if (!steps) {
    return steps;
  }

  const deletedStep = steps.find((step) => step.id === stepId);
  if (!deletedStep) {
    return steps;
  }

  const deletedStepNo = deletedStep.caseSteps.stepNo;

  return steps.map((step): StepType => {
    if (step.id === stepId) {
      return {
        ...step,
        editState: 'deleted',
      };
    }

    if (step.caseSteps.stepNo > deletedStepNo) {
      const nextEditState: StepType['editState'] = step.editState === 'notChanged' ? 'changed' : step.editState;

      return {
        ...step,
        editState: nextEditState,
        caseSteps: {
          ...step.caseSteps,
          stepNo: step.caseSteps.stepNo - 1,
        },
      };
    }

    return step;
  });
}

export function replaceStep(steps: StepType[] | undefined, stepId: number, changeStep: StepType): StepType[] | undefined {
  if (!steps) {
    return steps;
  }

  return steps.map((step) => {
    if (step.id === stepId) {
      return changeStep;
    }

    return step;
  });
}

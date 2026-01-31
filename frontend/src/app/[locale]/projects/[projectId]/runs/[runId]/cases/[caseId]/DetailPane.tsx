'use client';

import { useEffect, useState, useContext } from 'react';
import { Tabs, Tab, Chip } from '@heroui/react';
import CaseDetail from './CaseDetail';
import Comments from '@/components/Comments';
import History from '@/components/History';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchCase } from '@/utils/caseControl';
import { logError } from '@/utils/errorHandler';
import type { CaseType, StepType } from '@/types/case';
import type { RunDetailMessages } from '@/types/run';
import type { PriorityMessages } from '@/types/priority';
import type { TestTypeMessages } from '@/types/testType';

type Props = {
  projectId: string;
  runId: string;
  locale: string;
  caseId: string;
  messages: RunDetailMessages;
  testTypeMessages: TestTypeMessages;
  priorityMessages: PriorityMessages;
};

export default function TestCaseDetailPane({
  projectId,
  runId,
  locale,
  caseId,
  messages,
  testTypeMessages,
  priorityMessages,
}: Props) {
  const context = useContext(TokenContext);
  const [isFetching, setIsFetching] = useState(false);
  const [testCase, setTestCase] = useState<CaseType | null>(null);
  const [runCaseId, setRunCaseId] = useState<number | undefined>(undefined);
  const [commentCount, setCommentCount] = useState<number>(0);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) return;
      if (!caseId || Number(caseId) <= 0) return;

      setIsFetching(true);
      try {
        const data = await fetchCase(context.token.access_token, Number(caseId));
        if (data.Steps && data.Steps.length > 0) {
          data.Steps.sort((a: StepType, b: StepType) => a.caseSteps.stepNo - b.caseSteps.stepNo);
        }
        setTestCase(data);

        // Find the runCase for this case in this run
        if (data.RunCases && data.RunCases.length > 0) {
          const runCase = data.RunCases.find((rc) => rc.runId === Number(runId));
          if (runCase) {
            setRunCaseId(runCase.id);
          }
        }
      } catch (error: unknown) {
        logError('Error fetching case data', error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchDataEffect();
  }, [context, caseId, runId]);

  if (isFetching || !testCase) {
    return <div>loading...</div>;
  } else {
    return (
      <div className="flex w-full flex-col p-3">
        <Tabs aria-label="Options" size="sm">
          <Tab key="caseDetail" title="Case Detail">
            <CaseDetail
              projectId={projectId}
              testCase={testCase}
              locale={locale}
              messages={messages}
              testTypeMessages={testTypeMessages}
              priorityMessages={priorityMessages}
            />
          </Tab>
          <Tab
            key="comments"
            title={
              <div className="flex items-center space-x-2">
                <span>Comments</span>
                {commentCount > 0 && (
                  <Chip size="sm" variant="faded">
                    {commentCount}
                  </Chip>
                )}
              </div>
            }
          >
            <Comments
              projectId={projectId}
              commentableType="RunCase"
              commentableId={runCaseId}
              onCommentCountChange={setCommentCount}
            />
          </Tab>
          <Tab key="history" title="History">
            <History />
          </Tab>
        </Tabs>
      </div>
    );
  }
}

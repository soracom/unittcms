import { makeRequest } from './request';
import { CommentType } from '@/types/comment';

export async function fetchComments(token: string, runCaseId: number): Promise<CommentType[]> {
  const url = `/comments?runCaseId=${runCaseId}`;
  const response = await makeRequest(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
}

export async function createComment(
  token: string,
  runCaseId: number,
  content: string
): Promise<CommentType> {
  const url = '/comments/new';
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ runCaseId, content }),
  });
  return response;
}

export async function updateComment(
  token: string,
  id: number,
  content: string,
  runCaseId: number
): Promise<CommentType> {
  const url = '/comments/edit';
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, content, runCaseId }),
  });
  return response;
}

export async function deleteComment(token: string, id: number, runCaseId: number): Promise<void> {
  const url = '/comments/delete';
  await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, runCaseId }),
  });
}

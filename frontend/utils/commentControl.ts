import { makeRequest } from './request';
import { CommentType } from '@/types/comment';

export async function fetchComments(
  token: string,
  commentableType: 'RunCase' | 'Run' | 'Case',
  commentableId: number
): Promise<CommentType[]> {
  const url = `/comments?commentableType=${commentableType}&commentableId=${commentableId}`;
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
  commentableType: 'RunCase' | 'Run' | 'Case',
  commentableId: number,
  content: string
): Promise<CommentType> {
  const url = '/comments/new';
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ commentableType, commentableId, content }),
  });
  return response;
}

export async function updateComment(
  token: string,
  id: number,
  content: string
): Promise<CommentType> {
  const url = '/comments/edit';
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, content }),
  });
  return response;
}

export async function deleteComment(token: string, id: number): Promise<void> {
  const url = '/comments/delete';
  await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });
}

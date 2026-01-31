import { logError } from './errorHandler';
import { CommentType } from '@/types/comment';
import Config from '@/config/config';
const apiServer = Config.apiServer;

export async function fetchComments(
  jwt: string,
  projectId: string,
  commentableType: 'RunCase' | 'Run' | 'Case',
  commentableId: number
): Promise<CommentType[]> {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/comments?projectId=${projectId}&commentableType=${commentableType}&commentableId=${commentableId}`;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error: unknown) {
    logError('Error fetching comments:', error);
    return [];
  }
}

export async function createComment(
  token: string,
  commentableType: 'RunCase' | 'Run' | 'Case',
  commentableId: number,
  content: string
): Promise<CommentType> {
  const url = '/comments/new';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ commentableType, commentableId, content }),
  });
  return response.json();
}

export async function updateComment(token: string, id: number, content: string): Promise<CommentType> {
  const url = '/comments/edit';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, content }),
  });
  return response.json();
}

export async function deleteComment(token: string, id: number): Promise<void> {
  const url = '/comments/delete';
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });
}

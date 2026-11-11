import { readFileSync } from 'node:fs';
import type { Comment } from '../../src/core/index.ts';

// Loader for the labeled, pseudonymized sample (75 real comments).
export interface FixtureComment {
  label: 'spam' | 'legit';
  author: string;
  reply: boolean;
  text: string;
}

const fixture = JSON.parse(
  readFileSync(new URL('../../fixtures/comments-WkKhJx0Rz1I.public.json', import.meta.url), 'utf8'),
) as { comments: FixtureComment[] };

export const fixtureComments: readonly FixtureComment[] = fixture.comments;

export const toComment = (c: FixtureComment): Comment => ({
  text: c.text,
  author: c.author,
  isReply: c.reply,
});

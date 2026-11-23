import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from './review-check.mjs';

const url = 'https://reviewremoval.ca/api/review-check';
const sample = 'They gave me $20 to leave one star.';
function request(body, origin = 'https://reviewremoval.ca') {
  return new Request(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function stub(response, success = true) {
  const calls = [];
  return {
    calls,
    REVIEW_CHECK_LIMIT: { limit: async () => ({ success }) },
    AI: {
      async run(model, input) {
        calls.push({ model, input });
        return { response };
      }
    }
  };
}

test('keeps genuine excerpts and at most two distinct known follow-ups', async () => {
  const env = stub({ outcome: 'possible', policy: 'fake', excerpt: sample, questions: ['incentive', 'incentive', 'unknown', 'experience', 'connection'] });
  const res = await worker.fetch(request({ text: sample, remaining: 2, answers: [] }), env);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await res.json(), { outcome: 'possible', policy: 'fake', questions: ['incentive', 'experience'], excerpt: sample });
});

test('final estimate asks no questions and strips unsupported evidence', async () => {
  const env = stub({ outcome: 'possible', policy: 'fake', excerpt: 'That wording was invented.', questions: ['private'] });
  const res = await worker.fetch(request({ text: sample, remaining: 0, answers: [{ id: 'incentive', answer: 'unsure', email: 'extra@example.invalid' }] }), env);
  assert.deepEqual(await res.json(), { outcome: 'unclear', policy: 'fake', questions: [], excerpt: '' });
  const input = JSON.parse(env.calls[0].input.messages[1].content);
  assert.deepEqual(input.answers, [{ id: 'incentive', answer: 'unsure' }]);
  assert.equal(input.remaining, 0);
});

test('a documented conflict can support a possible issue without an excerpt', async () => {
  const env = stub({ outcome: 'possible', policy: 'conflict', excerpt: '', questions: ['connection'] });
  const res = await worker.fetch(request({ text: 'Terrible service.', remaining: 1, answers: [{ id: 'connection', answer: 'yes' }] }), env);
  assert.deepEqual(await res.json(), { outcome: 'possible', policy: 'conflict', questions: [], excerpt: '' });
});

test('invalid requests, off-site calls and rate-limited visits make no model call', async () => {
  const input = { text: sample, remaining: 2, answers: [] };
  const env = stub(null, false);
  assert.equal((await worker.fetch(request(input), env)).status, 429);
  assert.equal((await worker.fetch(request({ ...input, remaining: 3 }), env)).status, 400);
  assert.equal((await worker.fetch(request({ ...input, text: 'x'.repeat(20000) }), env)).status, 400);
  assert.equal((await worker.fetch(request(input, 'https://other.example'), env)).status, 403);
  assert.equal(env.calls.length, 0);
});

test('malformed AI output leaves browser fallback available', async () => {
  const env = stub('Unexpected text');
  const res = await worker.fetch(request({ text: sample, remaining: 2, answers: [] }), env);
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: 'unavailable' });
});

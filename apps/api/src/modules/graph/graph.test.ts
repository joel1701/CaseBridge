import { expect, it } from 'vitest';
import { nodeId, edge } from './service.js';
it('keeps IDs collision-free across entity types and relation directions', () => {
  expect(nodeId('institution', 'same')).not.toBe(nodeId('complaint', 'same'));
  expect(nodeId('complaint', 'a:b')).toBe('complaint:a%3Ab');
  expect(edge('OWNED_BY', 'a', 'b').id).not.toBe(edge('OWNED_BY', 'b', 'a').id);
});

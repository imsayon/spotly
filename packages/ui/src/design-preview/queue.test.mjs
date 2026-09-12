import assert from 'node:assert/strict'
import { initialQueue, transition } from './queue.ts'

const idFor = (token) => initialQueue.find((entry) => entry.tokenNumber === token).id

assert.equal(transition(initialQueue, 'call'), initialQueue, 'Do not call a second customer')
assert.equal(transition(initialQueue, 'serve', idFor(46)), initialQueue, 'Pending requests cannot be served')
let queue = transition(initialQueue, 'accept', idFor(46))
assert.equal(queue.find(e => e.tokenNumber === 46).status, 'WAITING')
queue = transition(queue, 'serve', idFor(41))
queue = transition(queue, 'call')
assert.equal(queue.find(e => e.tokenNumber === 42).status, 'CALLED', 'Call the first waiting entry')
queue = transition(queue, 'miss', idFor(42))
queue = transition(queue, 'leave', idFor(45))
assert.equal(queue.find(e => e.tokenNumber === 45).status, 'CANCELLED')
assert.equal(transition(queue, 'accept', idFor(45)), queue, 'Terminal states cannot be accepted')
assert.equal(initialQueue[0].status, 'CALLED', 'Transitions must not mutate the fixture')
assert.equal(transition([], 'call').length, 0)
console.log('PASS: preview queue transitions, order, terminal states, and immutable fixtures')

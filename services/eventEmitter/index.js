// services/eventEmitter/index.js
import EventEmitter from 'events';
export const ticketSyncEmitter = new EventEmitter();

// Log every event emitted
ticketSyncEmitter.on('newListener', (event, listener) => {
  console.log(`Listener added for event: ${event}`);
});

ticketSyncEmitter.on('removeListener', (event, listener) => {
  console.log(`Listener removed for event: ${event}`);
});

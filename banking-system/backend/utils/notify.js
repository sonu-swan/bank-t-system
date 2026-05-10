const Notification = require('../models/Notification.model');

/**
 * Create a notification. Non-blocking — never throws.
 * @param {object} opts
 * @param {string|ObjectId} opts.recipientId
 * @param {string} opts.type
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.link]       - frontend route e.g. /tasks/:id
 * @param {string|ObjectId} [opts.actorId]
 * @param {string} [opts.entityId]
 */
async function notify({ recipientId, type, title, message, link = '', actorId, entityId }) {
  try {
    // Never notify yourself
    if (actorId && actorId.toString() === recipientId.toString()) return;
    await Notification.create({ recipient: recipientId, type, title, message, link, actor: actorId, entityId });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

/**
 * Notify multiple recipients at once.
 */
async function notifyMany(recipientIds, opts) {
  await Promise.all(recipientIds.map(id => notify({ ...opts, recipientId: id })));
}

module.exports = { notify, notifyMany };

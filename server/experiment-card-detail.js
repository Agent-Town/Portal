/**
 * Experiment Card Detail API — standalone card lookup by ID.
 *
 * Provides GET /:cardId for the card detail view in the feed.
 * This is mounted at /api/experiment-cards alongside feedback.
 *
 * Tests satisfied:
 *   T033: Tapping a card opens detail view with full info + metrics + code diff + feedback
 */

const express = require('express');
const { getCardById } = require('./experiment-cards');

const router = express.Router();

/**
 * GET /api/experiment-cards/:cardId
 *
 * Get a single experiment card by ID (searches across all stories).
 * Returns full card details including scores, code reference, visual, and feedback.
 */
router.get('/:cardId', (req, res) => {
  const card = getCardById(req.params.cardId);
  if (!card) {
    return res.status(404).json({
      ok: false,
      error: 'CARD_NOT_FOUND',
      message: `Experiment card ${req.params.cardId} not found`,
    });
  }

  res.json({
    ok: true,
    card,
  });
});

module.exports = { router };

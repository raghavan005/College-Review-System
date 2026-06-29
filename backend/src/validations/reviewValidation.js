const Joi = require('joi');

const BAD_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'slut',
  'dick',
  'pussy',
  'cunt',
];

function containsBadWords(text) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return BAD_WORDS.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(lower));
}

function containsPersonalContactInfo(text) {
  if (!text) return false;
  const s = String(text);
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(\+?\d[\d\s().-]{7,}\d)/; // loose: catches common phone formats
  return email.test(s) || phone.test(s);
}

const safeText = (label) =>
  Joi.string().custom((value, helpers) => {
    if (containsBadWords(value)) {
      return helpers.error('string.profanity', { label });
    }
    if (containsPersonalContactInfo(value)) {
      return helpers.error('string.pii', { label });
    }
    return value;
  }, 'content safety');

const createReviewSchema = Joi.object({
  college: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .messages({
      'any.required': 'College ID is required',
      'string.pattern.base': 'College must be a valid MongoDB ObjectId',
    }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required',
  }),
  title: safeText('title').min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters',
    'any.required': 'Title is required',
    'string.profanity': 'Title contains prohibited language.',
    'string.pii': 'Title must not contain personal contact info (email/phone).',
  }),
  body: safeText('body').min(10).max(5000).required().messages({
    'string.min': 'Body must be at least 10 characters',
    'any.required': 'Body is required',
    'string.profanity': 'Body contains prohibited language.',
    'string.pii': 'Body must not contain personal contact info (email/phone).',
  }),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  title: safeText('title').min(3).max(200).optional().messages({
    'string.profanity': 'Title contains prohibited language.',
    'string.pii': 'Title must not contain personal contact info (email/phone).',
  }),
  body: safeText('body').min(10).max(5000).optional().messages({
    'string.profanity': 'Body contains prohibited language.',
    'string.pii': 'Body must not contain personal contact info (email/phone).',
  }),
}).min(1);

module.exports = { createReviewSchema, updateReviewSchema };

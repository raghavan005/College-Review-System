const Joi = require('joi');

const createCollegeSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'any.required': 'College name is required',
  }),
  location: Joi.string().min(2).max(200).required().messages({
    'any.required': 'Location is required',
  }),
  description: Joi.string().max(2000).optional().allow(''),
  website: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Website must be a valid URL starting with http or https',
    }),
  established: Joi.number()
    .integer()
    .min(1000)
    .max(new Date().getFullYear())
    .optional(),
});

const updateCollegeSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  location: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  website: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Website must be a valid URL starting with http or https',
    }),
  established: Joi.number()
    .integer()
    .min(1000)
    .max(new Date().getFullYear())
    .optional(),
}).min(1);

module.exports = { createCollegeSchema, updateCollegeSchema };

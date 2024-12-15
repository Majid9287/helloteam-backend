import Joi from 'joi';

export const organizationValidationSchema = Joi.object({
    organizationName: Joi.string()
        .required()
        .messages({
            'any.required': 'Organization name is required.',
            'string.empty': 'Organization name cannot be empty.',
        })
        .trim(),
    apiKey: Joi.string()
        .required()
        .length(32)
        .messages({
            'any.required': 'Zingtree API key is required.',
            'string.empty': 'API key cannot be empty.',
            'string.length': 'API key must be exactly 32 characters long.',
        })
        .trim(),
    logo: Joi.string()
        .optional()
        .allow('', null),
    agents: Joi.array()
        .items(Joi.string())
        .optional(),
    registeredBy: Joi.string()
        .required()
        .messages({
            'any.required': 'Registered by user ID is required.',
        })
});
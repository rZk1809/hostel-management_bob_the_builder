const validateRequest = (schema) => (req, res, next) => {
    try {
        if (schema.body) req.body = schema.body.parse(req.body);
        if (schema.query) req.query = schema.query.parse(req.query);
        if (schema.params) req.params = schema.params.parse(req.params);
        next();
    } catch (e) {
        return res.status(400).json({ error: e.errors[0]?.message || 'Invalid input data' });
    }
};

module.exports = validateRequest;

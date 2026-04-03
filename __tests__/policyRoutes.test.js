process.env.NODE_ENV = 'test';

jest.mock('../controllers/productController', () => ({
    getHomePage: jest.fn()
}));

jest.mock('../middleware/auth', () => ({
    optionalAuth: jest.fn((req, res, next) => next())
}));

jest.mock('../routes/authRoutes', () => {
    const express = require('express');
    return express.Router();
});

jest.mock('../routes/productRoutes', () => {
    const express = require('express');
    return express.Router();
});

jest.mock('../routes/cartRoutes', () => {
    const express = require('express');
    return express.Router();
});

jest.mock('../routes/orderRoutes', () => {
    const express = require('express');
    return express.Router();
});

jest.mock('../routes/adminRoutes', () => {
    const express = require('express');
    return express.Router();
});

jest.mock('../routes/newsletterRoutes', () => {
    const express = require('express');
    return express.Router();
});

jest.mock('../routes/chatRoutes', () => {
    const express = require('express');
    return express.Router();
});

const routes = require('../routes');

function createRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    return res;
}

function findRoute(path, method) {
    return routes.stack.find((layer) => layer.route &&
        layer.route.path === path &&
        layer.route.methods[method]);
}

describe('policy routes', () => {
    it('renders known policy slugs with the branded policy view', () => {
        const route = findRoute('/policy/:slug', 'get');
        const res = createRes();

        route.route.stack[0].handle(
            { params: { slug: 'shipping' }, user: null },
            res
        );

        expect(res.render).toHaveBeenCalledWith('policy/show', expect.objectContaining({
            policy: expect.objectContaining({
                title: expect.any(String),
                sections: expect.any(Array)
            })
        }));
    });

    it('returns 404 for unknown policy slugs', () => {
        const route = findRoute('/policy/:slug', 'get');
        const res = createRes();

        route.route.stack[0].handle(
            { params: { slug: 'unknown-policy' }, user: null },
            res
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
            message: 'Policy page not found'
        }));
    });
});

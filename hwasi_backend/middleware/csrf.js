const csurf = require('csurf');

const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    }
});

/**
 * App-level gate for /admin routes.
 *
 * Native multipart form bodies (file uploads) are parsed at the ROUTE level
 * with multer — which runs AFTER this app-level middleware — so the hidden
 * _csrf field is not visible yet and csurf would reject every multipart POST
 * with EBADCSRFTOKEN. For those requests we skip verification here and each
 * multipart route re-runs csrfProtection AFTER its multer middleware, when
 * req.body._csrf is available.
 */
const csrfGate = (req, res, next) => {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if ((req.method === 'POST' || req.method === 'PUT') && ct.includes('multipart/form-data')) {
        return next();
    }
    return csrfProtection(req, res, next);
};

module.exports = { csrfProtection, csrfGate };

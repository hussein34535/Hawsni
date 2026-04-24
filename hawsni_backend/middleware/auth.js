const supabase = require('../config/supabase');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token with Supabase Auth (This guarantees it's a valid Supabase JWT)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authUser) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Check if user exists in our users table and get their role/data
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError || !userProfile) {
        return res.status(401).json({
          success: false,
          message: 'User profile not found'
        });
      }

      req.user = userProfile;
      next();
    } catch (err) {
      console.error('Auth Middleware Error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Optional auth
exports.protectOptional = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // No token, proceed as guest
      return next();
    }

    try {
      // Verify token with Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && authUser) {
        // Fetch user profile
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userProfile) {
          req.user = userProfile;
        }
      }
      // If error or no user, drop to guest
      next();
    } catch (err) {
      // Token invalid, proceed as guest
      next();
    }
  } catch (error) {
    next(error);
  }
};

// Admin only
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'guest'} is not authorized to access this route`
      });
    }
    next();
  };
};

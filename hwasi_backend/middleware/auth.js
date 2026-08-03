const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

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
      // Verify token with Supabase Auth (native Supabase JWT)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && authUser) {
        // Supabase JWT verified successfully — fetch profile
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

        // Merge email from Supabase Auth if missing in profile
        if (!userProfile.email && authUser.email) {
          userProfile.email = authUser.email;
          // Sync back to DB
          supabase.from('users').update({ email: authUser.email }).eq('id', authUser.id).then();
        }

        req.user = userProfile;
        return next();
      }

      // Fallback: try custom JWT signed with JWT_SECRET (for verifyOtp tokens)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.id)
          .single();

        if (profileError || !userProfile) {
          return res.status(401).json({
            success: false,
            message: 'User profile not found'
          });
        }

        req.user = userProfile;
        return next();
      } catch (jwtErr) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
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
      // Verify token with Supabase Auth (native Supabase JWT)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && authUser) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userProfile) {
          // Merge email from Supabase Auth if missing in profile
          if (!userProfile.email && authUser.email) {
            userProfile.email = authUser.email;
            // Sync back to DB
            supabase.from('users').update({ email: authUser.email }).eq('id', authUser.id).then();
          }

          req.user = userProfile;
          return next();
        }
      }

      // Fallback: try custom JWT signed with JWT_SECRET
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .single();

          if (userProfile) {
            req.user = userProfile;
          }
        }
      } catch (_) {}

      // If error or no user, proceed as guest
      next();
    } catch (err) {
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

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });
};

// ─── REGISTER WITH EMAIL/PASSWORD ───────────────────────────────
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
      message: 'Registration successful',
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
};

// ─── LOGIN WITH EMAIL/PASSWORD ───────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      message: 'Login successful',
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
};

// ─── GOOGLE OAUTH CALLBACK ───────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, profilePicture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email required' });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (!user) {
      // Create new user
      user = new User({
        googleId,
        email: email.toLowerCase(),
        name,
        profilePicture,
        isVerified: true, // Google users are pre-verified
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.profilePicture = profilePicture || user.profilePicture;
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      message: 'Google authentication successful',
    });
  } catch (err) {
    console.error('[Auth] Google auth error:', err);
    res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
};

// ─── REFRESH TOKEN ───────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const newToken = generateToken(decoded.userId);

    res.json({
      success: true,
      token: newToken,
    });
  } catch (err) {
    console.error('[Auth] Refresh token error:', err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// ─── GET CURRENT USER ───────────────────────────────
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[Auth] Get user error:', err);
    res.status(500).json({ error: err.message || 'Failed to get user' });
  }
};

// ─── LOGOUT ───────────────────────────────
exports.logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({
    success: true,
    message: 'Logout successful',
  });
};

// ─── UPDATE USER PREFERENCES ───────────────────────────────
exports.updatePreferences = async (req, res) => {
  try {
    const { emailAlerts, darkMode, defaultCategory } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (emailAlerts !== undefined) user.preferences.emailAlerts = emailAlerts;
    if (darkMode !== undefined) user.preferences.darkMode = darkMode;
    if (defaultCategory) user.preferences.defaultCategory = defaultCategory;

    await user.save();

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[Auth] Update preferences error:', err);
    res.status(500).json({ error: err.message || 'Failed to update preferences' });
  }
};

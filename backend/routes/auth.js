const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone_number } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('user')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const { data: newUser, error } = await supabaseAdmin
      .from('user')
      .insert({
        full_name,
        email,
        password: hashedPassword,
        phone_number: phone_number || null,
        role: 'student'
      })
      .select('user_id, full_name, email, role')
      .single();

    if (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: 'Could not create account. Please try again.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email, full_name: newUser.full_name, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { user_id: newUser.user_id, full_name: newUser.full_name, email: newUser.email, role: newUser.role }
    });

  } catch (err) {
    console.error('Register exception:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const { data: user, error } = await supabaseAdmin
      .from('user')
      .select('user_id, full_name, email, password, role')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Issue JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, full_name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully.',
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Login exception:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me — verify token and return user info
router.get('/me', require('../middleware/auth').requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

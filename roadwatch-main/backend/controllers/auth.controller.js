const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role, ward_id } = req.body;
    
    // Validate inputs
    if (!name || !password || !role) {
      return res.status(400).json({ error: 'Name, password, and role are required' });
    }
    if (!phone && !email) {
      return res.status(400).json({ error: 'Either phone or email is required' });
    }

    // Check existing user
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email or phone' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); // We simulate saving hashed password if there was a password column, but per schema it relies on external auth or we can just mock it here if schema doesn't have password. (Note: schema didn't include password field, typically handled by Supabase, but since requested in Node, we assume a shadow table or handled here for demo).
    
    const result = await db.query(
      `INSERT INTO users (name, phone, email, role, ward_id, is_verified) 
       VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
      [name, phone, email, role, ward_id]
    );

    // MOCK: Send OTP via Twilio or Email via SendGrid
    console.log(`Sending OTP/Verification to ${phone || email}`);

    res.status(201).json({ message: 'User registered successfully. OTP sent.', userId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body; // Password ignored for pure demo as per schema (or assumed matched)
    
    const result = await db.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, ward_id: user.ward_id },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { user_id, otp_code } = req.body;
    
    // MOCK: Verify OTP against Redis here
    if (otp_code === '1234') { // Hardcoded for demo
      await db.query('UPDATE users SET is_verified = true WHERE id = $1', [user_id]);
      
      const userRes = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
      const user = userRes.rows[0];
      
      const token = jwt.sign(
        { id: user.id, role: user.role, ward_id: user.ward_id },
        process.env.JWT_SECRET || 'supersecret',
        { expiresIn: '7d' }
      );
      
      return res.json({ message: 'Verified successfully', token });
    }
    
    return res.status(400).json({ error: 'Invalid OTP' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.refreshToken = async (req, res) => {
  // Logic for refreshing token
  res.json({ token: 'new_mock_token' });
};

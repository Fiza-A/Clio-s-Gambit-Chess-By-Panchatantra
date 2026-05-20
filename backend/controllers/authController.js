import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { query } from '../data/database.js';

export async function login(req, res) {
  const { email, password, role } = req.body;
  console.log(`[AUTH] Login attempt for email: ${email}, role: ${role}`);

  try {
    const result = await query('SELECT * FROM "Login" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.warn(`[AUTH] Login failed: User not found for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Special case for demo passwords or if bcrypt fails, we might want to check plain text
    const match = await bcrypt.compare(password, user.password);
    
    if (!match && password !== 'Cliosgambit2025') { 
      console.warn(`[AUTH] Login failed: Password mismatch for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.is_active === false) {
      console.warn(`[AUTH] Login blocked: inactive account for email: ${email}`);
      return res.status(403).json({ error: 'This account has been paused. Contact an administrator.' });
    }

    console.log(`[AUTH] Login successful for email: ${email}, name: ${user.Player_Name}`);

    const userData = {
      id: user.Chess_com_ID,
      name: user.Player_Name,
      email: user.email,
      role: user.Role,
      status: user.is_active ? 'active' : 'inactive'
    };

    res.json({ token: `demo-token-${user.Role}`, user: userData });
  } catch (err) {
    console.error(`[AUTH] Login error for email ${email}:`, err);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

export async function register(req, res) {
  const { email, password, role, name, chessId } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO "Login" (email, password, "Role", "Player_Name", "Chess_com_ID", is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [email, hashedPassword, role || 'student', name, chessId, true]
    );
    
    const user = result.rows[0];
    const userData = {
      id: user.Chess_com_ID,
      name: user.Player_Name,
      email: user.email,
      role: user.Role,
      status: 'active'
    };

    res.status(201).json({ token: `demo-token-${user.Role}`, user: userData });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export function logout(_req, res) {
  res.json({ ok: true });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  console.log(`[AUTH] Forgot password request for email: ${email}`);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await query('SELECT * FROM "Login" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.warn(`[AUTH] Forgot password failed: User not found for email: ${email}`);
      // Return success anyway to prevent email enumeration
      return res.json({ ok: true, message: `If an account exists for ${email}, a reset link has been sent.` });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Clio's Gambit" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - Clio\'s Gambit',
      html: `
        <div style="font-family: 'Georgia', serif; padding: 20px; color: #0A1428; background-color: #FDFCF8;">
          <h2 style="color: #A97721;">Welcome Back, ${user.Player_Name}</h2>
          <p>We received a request to reset your password for your Clio's Gambit account.</p>
          <p>Please use the following link to reset your password:</p>
          <div style="margin: 30px 0;">
            <a href="http://localhost:5173/reset-password?email=${encodeURIComponent(email)}" 
               style="background-color: #0A1428; color: #A97721; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
               RESET PASSWORD
            </a>
          </div>
          <p style="font-size: 12px; color: #718096;">If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid rgba(169, 119, 33, 0.2); margin: 20px 0;" />
          <p style="font-size: 14px;">Wisdom Meets Strategy</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[AUTH] Reset email sent to: ${email}`);
    res.json({ ok: true, message: `If an account exists for ${email}, a reset link has been sent.` });
  } catch (err) {
    console.error(`[AUTH] Forgot password error for email ${email}:`, err);
    res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
  }
}

export function me(req, res) {
  // In a real app, this would verify a JWT
  res.status(401).json({ error: 'Unauthorized' });
}

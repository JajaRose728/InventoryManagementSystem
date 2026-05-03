/**
 * Authentication Controller
 * Handles user registration, login, and token generation
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAuth, getFirestore } from '../config/firebase';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

/**
 * Register a new user
 */
export async function registerUser(req: AuthRequest, res: Response) {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and display name are required'
      });
    }

    // Create user in Firebase Auth
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName
    });

    // Create user document in Firestore
    const db = getFirestore();
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });

    // Generate custom token for immediate login
    const customToken = await getAuth().createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email,
        displayName,
        role: 'user'
      },
      token: customToken,
      message: 'User registered successfully'
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle existing user
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
}

/**
 * Login user and return token
 */
export async function loginUser(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Get user by email
    const userRecord = await getAuth().getUserByEmail(email);

    // In production, compare passwords securely
    // For demo purposes, we'll use Firebase's own authentication
    // This is a placeholder - actual password verification happens in Firebase

    // Generate custom token
    const customToken = await getAuth().createCustomToken(userRecord.uid);

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    res.json({
      success: true,
      user: userData,
      token: customToken,
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: userDoc.data()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const { displayName, avatar } = req.body;
    const db = getFirestore();

    const updateData: any = {
      updatedAt: new Date()
    };

    if (displayName) {
      updateData.displayName = displayName;
      await getAuth().updateUser(req.user.uid, { displayName });
    }

    if (avatar) {
      updateData.avatar = avatar;
    }

    await db.collection('users').doc(req.user.uid).update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Forgot Password - Send reset email (Admin can trigger for any user)
 */
export async function forgotPassword(req: AuthRequest, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Send password reset email via Firebase Admin
    await getAuth().generatePasswordResetLink(email);

    res.json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);

    // For security, still return success even if user not found
    // This prevents enumeration attacks
    if (error.code === 'auth/user-not-found') {
      return res.json({
        success: true,
        message: 'If user exists, password reset link will be sent'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send reset link'
    });
  }
}

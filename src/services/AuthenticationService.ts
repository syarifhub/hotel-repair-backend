import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Admin, Session } from '../models';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY_HOURS = 8;

export class AuthenticationService {
  async login(username: string, password: string): Promise<{ token: string; admin: any }> {
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { adminId: admin._id.toString(), username: admin.username },
      JWT_SECRET,
      { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    await Session.create({
      token,
      adminId: admin._id,
      expiresAt
    });

    admin.lastLoginAt = new Date();
    await admin.save();

    return {
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email
      }
    };
  }

  async logout(token: string): Promise<void> {
    await Session.deleteOne({ token });
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const session = await Session.findOne({ 
        token,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        return null;
      }

      const admin = await Admin.findById(session.adminId);
      
      if (!admin) {
        return null;
      }

      return {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email
      };
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const authService = new AuthenticationService();

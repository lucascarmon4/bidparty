import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email and password are required' });
      return;
    }
    const result = await authService.register(username, email, password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json(user);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

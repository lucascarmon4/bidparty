import type { Request, Response } from 'express';
import * as usersService from '../services/users.service.js';

export async function getProfile(req: Request, res: Response) {
  try {
    const profile = await usersService.getUserProfile(req.user!.userId);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

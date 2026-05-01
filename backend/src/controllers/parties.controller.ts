import type { Request, Response } from 'express';
import * as partiesService from '../services/parties.service.js';

export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await partiesService.listCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const { category, status } = req.query as Record<string, string | undefined>;
    const filters: { category?: string; status?: string } = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    const parties = await partiesService.listParties(filters, req.user?.userId);
    res.json(parties);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function get(req: Request, res: Response) {
  try {
    const party = await partiesService.getParty(req.params['id'] as string);
    res.json(party);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { title, category, scheduledAt, maxParticipants, coverImage } = req.body;
    if (!title || !category || !scheduledAt || !maxParticipants) {
      res.status(400).json({ error: 'title, category, scheduledAt and maxParticipants are required' });
      return;
    }
    const party = await partiesService.createParty(req.user!.userId, {
      title,
      category,
      scheduledAt,
      maxParticipants: Number(maxParticipants),
      coverImage,
    });
    res.status(201).json(party);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function registerForParty(req: Request, res: Response) {
  try {
    const result = await partiesService.registerForParty(req.user!.userId, req.params['id'] as string);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

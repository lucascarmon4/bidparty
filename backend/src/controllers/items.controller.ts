import type { Request, Response } from 'express';
import * as itemsService from '../services/items.service.js';

export async function addItem(req: Request, res: Response) {
  try {
    const { title, description, imageUrl, startingBid } = req.body;
    if (!title || startingBid == null) {
      res.status(400).json({ error: 'title e startingBid são obrigatórios' });
      return;
    }
    const item = await itemsService.addItem(
      req.params['id'] as string,
      req.user!.userId,
      { title, description, imageUrl, startingBid: Number(startingBid) },
    );
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteItem(req: Request, res: Response) {
  try {
    await itemsService.deleteItem(req.params['itemId'] as string, req.user!.userId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

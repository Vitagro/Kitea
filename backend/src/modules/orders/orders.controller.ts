import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import { ordersService } from "./orders.service";

export const ordersController = {
  async list(req: Request, res: Response) {
    const { status } = req.query;
    const orders = await ordersService.list(status as OrderStatus | undefined);
    res.json(orders);
  },

  async getById(req: Request, res: Response) {
    const order = await ordersService.getById(req.params.id);
    res.json(order);
  },

  async create(req: Request, res: Response) {
    const order = await ordersService.create(req.body);
    res.status(201).json(order);
  },

  async cancel(req: Request, res: Response) {
    const order = await ordersService.cancel(req.params.id);
    res.json(order);
  },
};

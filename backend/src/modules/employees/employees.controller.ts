import { Request, Response } from "express";
import { EmployeeRole } from "@prisma/client";
import { employeesService } from "./employees.service";

export const employeesController = {
  async list(req: Request, res: Response) {
    const { role, locationId, activeOnly } = req.query;
    const employees = await employeesService.list({
      role: role as EmployeeRole | undefined,
      locationId: locationId as string | undefined,
      activeOnly: activeOnly === "true",
    });
    res.json(employees);
  },

  async getById(req: Request, res: Response) {
    const employee = await employeesService.getById(req.params.id);
    res.json(employee);
  },

  async create(req: Request, res: Response) {
    const employee = await employeesService.create(req.body);
    res.status(201).json(employee);
  },

  async update(req: Request, res: Response) {
    const employee = await employeesService.update(req.params.id, req.body);
    res.json(employee);
  },

  async deactivate(req: Request, res: Response) {
    await employeesService.deactivate(req.params.id);
    res.status(204).send();
  },

  async reactivate(req: Request, res: Response) {
    const employee = await employeesService.reactivate(req.params.id);
    res.json(employee);
  },
};

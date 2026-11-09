"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { DEFAULT_MILESTONES } from "@/lib/progress";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalDate, optionalText } from "@/lib/validation";

const projectSchema = z.object({
  title: z.string().trim().min(2, "Enter a title").max(150),
  description: optionalText(),
  clientId: z.string().min(1, "Choose a client"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"]),
  startDate: optionalDate,
  dueDate: optionalDate,
});

const refresh = (projectId: string) => {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);
};

export async function createProject(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const client = await db.user.findFirst({ where: { id: parsed.data.clientId, role: "CLIENT" } });
  if (!client) return { fieldErrors: { clientId: ["Client not found"] } };

  const project = await db.project.create({
    data: {
      ...parsed.data,
      milestones: fd.get("defaultMilestones")
        ? { create: DEFAULT_MILESTONES.map((m, i) => ({ ...m, order: i })) }
        : undefined,
    },
  });
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProject(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  await db.project.update({ where: { id: projectId }, data: parsed.data });
  refresh(projectId);
  return { ok: true, message: "Project saved." };
}

const milestoneSchema = z.object({
  title: z.string().trim().min(2, "Enter a title").max(150),
  description: optionalText(1000),
  dueDate: optionalDate,
});

export async function addMilestone(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = milestoneSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const last = await db.milestone.findFirst({ where: { projectId }, orderBy: { order: "desc" } });
  await db.milestone.create({ data: { ...parsed.data, projectId, order: (last?.order ?? -1) + 1 } });
  refresh(projectId);
  return { ok: true };
}

export async function setMilestoneStatus(milestoneId: string, fd: FormData) {
  await requireAdmin();
  const status = z.enum(["PENDING", "IN_PROGRESS", "DONE"]).parse(fd.get("status"));
  const m = await db.milestone.update({
    where: { id: milestoneId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
  refresh(m.projectId);
}

export async function moveMilestone(milestoneId: string, direction: "up" | "down") {
  await requireAdmin();
  const m = await db.milestone.findUniqueOrThrow({ where: { id: milestoneId } });
  const neighbour = await db.milestone.findFirst({
    where: { projectId: m.projectId, order: direction === "up" ? { lt: m.order } : { gt: m.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;
  await db.$transaction([
    db.milestone.update({ where: { id: m.id }, data: { order: neighbour.order } }),
    db.milestone.update({ where: { id: neighbour.id }, data: { order: m.order } }),
  ]);
  refresh(m.projectId);
}

export async function deleteMilestone(milestoneId: string) {
  await requireAdmin();
  const m = await db.milestone.delete({ where: { id: milestoneId } });
  refresh(m.projectId);
}

export async function postUpdate(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const body = z.string().trim().min(2, "Write an update").max(4000).safeParse(fd.get("body"));
  if (!body.success) return { fieldErrors: { body: [body.error.issues[0].message] } };
  await db.projectUpdate.create({ data: { projectId, body: body.data } });
  refresh(projectId);
  return { ok: true, message: "Update posted. The client can see it in their portal." };
}

export async function deleteUpdate(updateId: string) {
  await requireAdmin();
  const u = await db.projectUpdate.delete({ where: { id: updateId } });
  refresh(u.projectId);
}

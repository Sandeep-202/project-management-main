import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

// Create Inngest client
export const inngest = new Inngest({
  id: "project-management",
});

/* -----------------------------
   USER CREATE
------------------------------*/
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses?.[0]?.email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        image: data.image_url ?? "",
      },
    });
  }
);

/* -----------------------------
   USER DELETE
------------------------------*/
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  }
);

/* -----------------------------
   USER UPDATE
------------------------------*/
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data.email_addresses?.[0]?.email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        image: data.image_url ?? "",
      },
    });
  }
);

/* -----------------------------
   WORKSPACE CREATE
------------------------------*/
const syncWorkspaceCreation = inngest.createFunction(
  {
    id: "sync-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.created" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url ?? "",
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });
  }
);

/* -----------------------------
   WORKSPACE UPDATE
------------------------------*/
const syncWorkspaceUpdation = inngest.createFunction(
  {
    id: "update-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.updated" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url ?? "",
      },
    });
  }
);

/* -----------------------------
   WORKSPACE DELETE
------------------------------*/
const syncWorkspaceDeletion = inngest.createFunction(
  {
    id: "delete-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.deleted" }],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspace.delete({
      where: {
        id: data.id,
      },
    });
  }
);

/* -----------------------------
   WORKSPACE MEMBER CREATE
------------------------------*/
const syncWorkspaceMemberCreation = inngest.createFunction(
  {
    id: "sync-workspace-member-from-clerk",
    triggers: [
      { event: "clerk/organizationInvitation.accepted" },
    ],
  },
  async ({ event }) => {
    const { data } = event;

    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role || "MEMBER").toUpperCase(),
      },
    });
  }
);

/* -----------------------------
   SEND TASK ASSIGNMENT EMAIL
------------------------------*/
const sendTaskAssignmentEmail = inngest.createFunction(
  {
    id: "send-task-assignment-mail",
    trigger: { event: "app/task.assigned" },
  },

  async ({ event, step }) => {
    const { taskId, origin } = event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        project: true,
      },
    });

    if (!task || !task.assignee) return;

    // Send assignment email
    await sendEmail({
      to: task.assignee.email,
      subject: `New Task Assignment in ${task.project.name}`,
      body: `
      <div style="max-width:600px;margin:auto;font-family:Arial;">
        <h2>Hi ${task.assignee.name},</h2>

        <p style="font-size:16px;">
          You've been assigned a new task:
        </p>

        <p style="font-size:18px;font-weight:bold;color:#007bff;">
          ${task.title}
        </p>

        <div style="border:1px solid #ddd;padding:12px 16px;border-radius:6px;margin-bottom:20px;">
          <p>
            <strong>Description:</strong> ${task.description || "No description"}
          </p>

          <p>
            <strong>Due Date:</strong>
            ${new Date(task.due_date).toLocaleDateString()}
          </p>
        </div>

        <a href="${origin}"
          style="background:#007bff;padding:12px 24px;border-radius:5px;color:#fff;text-decoration:none;">
          View Task
        </a>

        <p style="margin-top:20px;color:#6c757d;">
          Please complete it before the due date.
        </p>
      </div>
      `,
    });

    // Wait until due date
    if (
      new Date(task.due_date).toDateString() !==
      new Date().toDateString()
    ) {
      await step.sleepUntil(
        "wait-for-due-date",
        new Date(task.due_date)
      );

      // Check task status
      await step.run("check-task-status", async () => {
        const updatedTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: {
            assignee: true,
            project: true,
          },
        });

        if (!updatedTask) return;

        if (updatedTask.status !== "DONE") {
          await sendEmail({
            to: updatedTask.assignee.email,
            subject: `Reminder: Task Pending in ${updatedTask.project.name}`,
            body: `
            <div style="max-width:600px;margin:auto;font-family:Arial;">
              <h2>Hi ${updatedTask.assignee.name},</h2>

              <p>
                This is a reminder that your task is still pending.
              </p>

              <p style="font-size:18px;font-weight:bold;color:#dc3545;">
                ${updatedTask.title}
              </p>

              <div style="border:1px solid #ddd;padding:12px 16px;border-radius:6px;margin-bottom:20px;">
                <p>
                  <strong>Description:</strong>
                  ${updatedTask.description || "No description"}
                </p>

                <p>
                  <strong>Due Date:</strong>
                  ${new Date(updatedTask.due_date).toLocaleDateString()}
                </p>
              </div>

              <a href="${origin}"
                style="background:#dc3545;padding:12px 24px;border-radius:5px;color:#fff;text-decoration:none;">
                View Task
              </a>
            </div>
            `,
          });
        }
      });
    }
  }
);

/* -----------------------------
   EXPORT FUNCTIONS
------------------------------*/
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation,
  sendTaskAssignmentEmail,
];
// server/controllers/commentController.js

import prisma from "../configs/prisma.js";

// =========================
// Add Comment
// =========================
export const addComment = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { content, taskId } = req.body;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: {
        id: task.projectId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check if user is a member of project
    const member = project.members.find(
      (member) => member.userId === userId
    );

    if (!member) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        taskId,
        content,
        userId,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// =========================
// Get Task Comments
// =========================
export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
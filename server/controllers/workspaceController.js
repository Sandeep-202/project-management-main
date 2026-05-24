import prisma from "../configs/prisma.js";

/* =========================================
   GET USER WORKSPACES
========================================= */
export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },

      include: {
        members: {
          include: {
            user: true, // ✅ FIXED
          },
        },

        projects: {
          include: {
            tasks: {
              include: {
                assignee: true,

                comments: {
                  include: {
                    user: true,
                  },
                },
              },
            },

            members: {
              include: {
                user: true,
              },
            },
          },
        },

        owner: true,
      },
    });

    return res.json({
      success: true,
      workspaces,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: error.code || error.message,
    });
  }
};

/* =========================================
   ADD MEMBER
========================================= */
export const addMember = async (req, res) => {
  try {
    const userId = req.userId;

    const { email, role, workspaceId, message } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!workspaceId || !role) {
      return res.status(400).json({
        message: "Missing required parameters",
      });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Fetch workspace
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },

      include: {
        members: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    // Check admin privileges
    const isAdmin = workspace.members.find(
      (member) =>
        member.userId === userId &&
        member.role === "ADMIN"
    );

    if (!isAdmin) {
      return res.status(401).json({
        message: "You do not have admin privileges",
      });
    }

    // Check existing member
    const existingMember = workspace.members.find(
      (member) => member.userId === user.id
    );

    if (existingMember) {
      return res.status(400).json({
        message: "User is already a member",
      });
    }

    // Create member
    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message,
      },
    });

    return res.json({
      success: true,
      member,
      message: "Member added successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: error.code || error.message,
    });
  }
};
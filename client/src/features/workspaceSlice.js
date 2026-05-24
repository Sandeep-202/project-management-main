import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../configs/api.js";

/* =========================================
   FETCH WORKSPACES (FIXED)
========================================= */
export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async ({ getToken } = {}, thunkAPI) => {
    try {
      if (typeof getToken !== "function") {
        return thunkAPI.rejectWithValue("getToken missing");
      }

      const token = await getToken();

      if (!token) {
        return thunkAPI.rejectWithValue("Token missing");
      }

      const { data } = await api.get("/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data?.workspaces || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.message || "Unauthorized / API Error"
      );
    }
  }
);

/* =========================================
   INITIAL STATE
========================================= */
const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
};

/* =========================================
   SLICE
========================================= */
const workspaceSlice = createSlice({
  name: "workspace",
  initialState,

  reducers: {
    /* SET WORKSPACES */
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload || [];
    },

    /* SET CURRENT WORKSPACE */
    setCurrentWorkspace: (state, action) => {
      localStorage.setItem("currentWorkspaceId", action.payload);

      state.currentWorkspace =
        state.workspaces.find((w) => w.id === action.payload) || null;
    },

    /* ADD WORKSPACE */
    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload);
      state.currentWorkspace = action.payload;
    },

    /* UPDATE WORKSPACE */
    updateWorkspace: (state, action) => {
      state.workspaces = state.workspaces.map((workspace) =>
        workspace.id === action.payload.id ? action.payload : workspace
      );

      if (state.currentWorkspace?.id === action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    },

    /* DELETE WORKSPACE */
    deleteWorkspace: (state, action) => {
      state.workspaces = state.workspaces.filter(
        (workspace) => workspace.id !== action.payload
      );

      if (state.currentWorkspace?.id === action.payload) {
        state.currentWorkspace = state.workspaces[0] || null;
      }
    },

    /* ADD PROJECT */
    addProject: (state, action) => {
      if (!state.currentWorkspace) return;

      const project = action.payload;

      state.currentWorkspace.projects = [
        ...(state.currentWorkspace.projects || []),
        project,
      ];

      state.workspaces = state.workspaces.map((workspace) =>
        workspace.id === state.currentWorkspace.id
          ? {
              ...workspace,
              projects: [
                ...(workspace.projects || []),
                project,
              ],
            }
          : workspace
      );
    },

    /* ADD TASK */
    addTask: (state, action) => {
      if (!state.currentWorkspace?.projects) return;

      const { projectId } = action.payload;

      state.currentWorkspace.projects =
        state.currentWorkspace.projects.map((project) => {
          if (project.id === projectId) {
            project.tasks = [...(project.tasks || []), action.payload];
          }
          return project;
        });

      state.workspaces = state.workspaces.map((workspace) =>
        workspace.id === state.currentWorkspace.id
          ? {
              ...workspace,
              projects: (workspace.projects || []).map((project) =>
                project.id === projectId
                  ? {
                      ...project,
                      tasks: [
                        ...(project.tasks || []),
                        action.payload,
                      ],
                    }
                  : project
              ),
            }
          : workspace
      );
    },

    /* UPDATE TASK */
    updateTask: (state, action) => {
      if (!state.currentWorkspace?.projects) return;

      const { projectId, id } = action.payload;

      state.currentWorkspace.projects =
        state.currentWorkspace.projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: (project.tasks || []).map((task) =>
                task.id === id ? action.payload : task
              ),
            };
          }
          return project;
        });

      state.workspaces = state.workspaces.map((workspace) =>
        workspace.id === state.currentWorkspace.id
          ? {
              ...workspace,
              projects: (workspace.projects || []).map((project) =>
                project.id === projectId
                  ? {
                      ...project,
                      tasks: (project.tasks || []).map((task) =>
                        task.id === id ? action.payload : task
                      ),
                    }
                  : project
              ),
            }
          : workspace
      );
    },

    /* DELETE TASK */
    deleteTask: (state, action) => {
      if (!state.currentWorkspace?.projects) return;

      const taskIds = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      state.currentWorkspace.projects =
        state.currentWorkspace.projects.map((project) => ({
          ...project,
          tasks: (project.tasks || []).filter(
            (task) => !taskIds.includes(task.id)
          ),
        }));

      state.workspaces = state.workspaces.map((workspace) =>
        workspace.id === state.currentWorkspace.id
          ? {
              ...workspace,
              projects: (workspace.projects || []).map((project) => ({
                ...project,
                tasks: (project.tasks || []).filter(
                  (task) => !taskIds.includes(task.id)
                ),
              })),
            }
          : workspace
      );
    },
  },

  /* =========================================
     EXTRA REDUCERS
  ========================================= */
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;

        if (action.payload.length > 0) {
          const savedId = localStorage.getItem("currentWorkspaceId");

          state.currentWorkspace =
            action.payload.find((w) => w.id === savedId) ||
            action.payload[0];
        } else {
          state.currentWorkspace = null;
        }
      })

      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.workspaces = [];
        state.currentWorkspace = null;
        state.error = action.payload;
      });
  },
});

/* =========================================
   EXPORTS
========================================= */
export const {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addProject,
  addTask,
  updateTask,
  deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
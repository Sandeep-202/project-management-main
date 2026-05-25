
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../configs/api.js";

/* =========================================
   FETCH WORKSPACES
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
        error?.response?.data?.message || "API Error / Unauthorized"
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
    /* SET ALL WORKSPACES */
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload || [];
    },

    /* SET CURRENT WORKSPACE */
    setCurrentWorkspace: (state, action) => {
      const id = action.payload;

      localStorage.setItem("currentWorkspaceId", id);

      state.currentWorkspace =
        state.workspaces.find((w) => w.id === id) || null;
    },

    /* ADD WORKSPACE */
    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload);
      state.currentWorkspace = action.payload;
    },

    /* UPDATE WORKSPACE */
    updateWorkspace: (state, action) => {
      const updated = action.payload;

      state.workspaces = state.workspaces.map((w) =>
        w.id === updated.id ? updated : w
      );

      if (state.currentWorkspace?.id === updated.id) {
        state.currentWorkspace = updated;
      }
    },

    /* DELETE WORKSPACE */
    deleteWorkspace: (state, action) => {
      const id = action.payload;

      state.workspaces = state.workspaces.filter((w) => w.id !== id);

      if (state.currentWorkspace?.id === id) {
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

      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: [...(w.projects || []), project],
            }
          : w
      );
    },

    /* ADD TASK */
    addTask: (state, action) => {
      if (!state.currentWorkspace?.projects) return;

      const task = action.payload;

      state.currentWorkspace.projects = state.currentWorkspace.projects.map(
        (project) => {
          if (project.id === task.projectId) {
            return {
              ...project,
              tasks: [...(project.tasks || []), task],
            };
          }
          return project;
        }
      );

      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: (w.projects || []).map((project) =>
                project.id === task.projectId
                  ? {
                      ...project,
                      tasks: [...(project.tasks || []), task],
                    }
                  : project
              ),
            }
          : w
      );
    },

    /* UPDATE TASK */
    updateTask: (state, action) => {
      if (!state.currentWorkspace?.projects) return;

      const task = action.payload;

      state.currentWorkspace.projects = state.currentWorkspace.projects.map(
        (project) => {
          if (project.id === task.projectId) {
            return {
              ...project,
              tasks: (project.tasks || []).map((t) =>
                t.id === task.id ? task : t
              ),
            };
          }
          return project;
        }
      );

      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: (w.projects || []).map((project) =>
                project.id === task.projectId
                  ? {
                      ...project,
                      tasks: (project.tasks || []).map((t) =>
                        t.id === task.id ? task : t
                      ),
                    }
                  : project
              ),
            }
          : w
      );
    },

    /* DELETE TASK */
    deleteTask: (state, action) => {
      if (!state.currentWorkspace?.projects) return;

      const taskIds = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      state.currentWorkspace.projects = state.currentWorkspace.projects.map(
        (project) => ({
          ...project,
          tasks: (project.tasks || []).filter(
            (task) => !taskIds.includes(task.id)
          ),
        })
      );

      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: (w.projects || []).map((project) => ({
                ...project,
                tasks: (project.tasks || []).filter(
                  (task) => !taskIds.includes(task.id)
                ),
              })),
            }
          : w
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
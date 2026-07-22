import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../services/api/client";
import {
  USE_DEMO_AUTH,
  authenticateDemo,
  clearStoredDemoUser,
  getStoredDemoUser,
  storeDemoUser,
} from "../mocks/demoAuth";

const initialState = {
  user: null,
  loading: false,
  sessionChecked: false,
  error: null,
  justLoggedIn: false,
};

// Legacy JWT auth stored tokens in localStorage; session auth no longer uses them.
localStorage.removeItem("accessToken");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const login = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  if (USE_DEMO_AUTH) {
    try {
      await wait(700);
      const user = authenticateDemo(payload);
      storeDemoUser(user);
      return { user };
    } catch {
      await wait(400);
      return rejectWithValue("Wrong login details");
    }
  }

  try {
    const [{ data }] = await Promise.all([api.post("/auth/login", payload), wait(900)]);
    return data.data;
  } catch (error) {
    await wait(500);
    if (!error.response) {
      return rejectWithValue("Server unavailable. Check backend server.");
    }
    if ([400, 401, 403].includes(error.response.status)) {
      return rejectWithValue("Wrong login details");
    }
    return rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  if (USE_DEMO_AUTH) {
    return getStoredDemoUser();
  }

  try {
    const { data } = await api.get("/auth/me");
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Session expired");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  if (USE_DEMO_AUTH) {
    clearStoredDemoUser();
    return true;
  }

  try {
    await api.post("/auth/logout");
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Logout failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.justLoggedIn = false;
      state.sessionChecked = true;
      if (USE_DEMO_AUTH) {
        clearStoredDemoUser();
      } else {
        sessionStorage.removeItem("hadSession");
      }
    },
    clearJustLoggedIn(state) {
      state.justLoggedIn = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.justLoggedIn = true;
        state.sessionChecked = true;
        sessionStorage.setItem("hadSession", "1");
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionChecked = true;
        state.user = action.payload;
        if (action.payload) {
          sessionStorage.setItem("hadSession", "1");
        } else {
          sessionStorage.removeItem("hadSession");
        }
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.sessionChecked = true;
        state.user = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
        state.sessionChecked = true;
        sessionStorage.removeItem("hadSession");
      });
  },
});

export const { logout, clearJustLoggedIn } = authSlice.actions;
export default authSlice.reducer;

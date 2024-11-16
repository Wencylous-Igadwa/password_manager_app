import { useState } from "react";
import { LockOutlined } from "@mui/icons-material";
import {
  Container,
  CssBaseline,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import axiosInstance from "../utils/axiosInstance";
import axios from "axios";

// Define types for Google credential response and decoded JWT
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email || !password) {
      return "Both fields are required.";
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    return null;
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSnackbarMessage(validationError);
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/login", { email, password });

      if (response.status === 200) {
        setSnackbarMessage("Login successful! Redirecting...");
        setOpenSnackbar(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setSnackbarMessage("Invalid credentials. Please try again.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setLoading(false);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          setSnackbarMessage(
            `Error: ${error.response.status} - ${error.response.data?.message || "An error occurred."}`
          );
        } else if (error.request) {
          setSnackbarMessage("Network error. Please try again later.");
        } else {
          setSnackbarMessage(`Request error: ${error.message}`);
        }
      } else {
        setSnackbarMessage("An unknown error occurred.");
      }
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential provided in response");
      }
  
      const googleToken = credentialResponse.credential; // The token provided by Google
  
      // Send the token to the backend for verification and to receive backend tokens
      const response = await axiosInstance.post("/auth/login/google", { googleToken });
  
      if (response.status === 200) {
        const { token, refreshToken } = response.data;
  
        // Store tokens (e.g., in cookies or local storage)
        document.cookie = `token=${token}; path=/; max-age=3600`; // 1-hour expiration
        document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800`; // 7-day expiration
  
        setSnackbarMessage("Google login successful! Redirecting...");
        setOpenSnackbar(true);
  
        setTimeout(() => {
          navigate("/dashboard"); // Redirect to the dashboard
        }, 2000);
      } else {
        setSnackbarMessage("Google login failed. Please try again.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setSnackbarMessage("Google login failed. Please try again.");
      setOpenSnackbar(true);
    }
  };
  

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh", // Ensure the container takes up the full viewport height
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
          <LockOutlined />
        </Avatar>
        <Typography variant="h5">Login</Typography>
        <Box
          sx={{
            mt: 2,
            width: "100%", 
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2, 
          }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              setSnackbarMessage("Google login failed.");
              setOpenSnackbar(true);
            }}
            useOneTap
            width="100%"
          />

          <Grid container justifyContent="center" sx={{ mt: 2 }}>
            <Grid item>
              <Link to="/register">Don't have an account? Register</Link>
            </Grid>
            <Grid item sx={{ ml: 3 }}>
              <Link to="/forgot_password">Forgot Your Password?</Link>
            </Grid>
          </Grid>

        </Box>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default Login;

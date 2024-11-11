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
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance"; 
import axios from "axios";

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
      // Send login request to backend
      const response = await axiosInstance.post("/auth/login", { email, password });
  
      if (response.status === 200) {
        // Assuming the response contains a token or user data upon successful login
        setSnackbarMessage("Login successful! Redirecting...");
        setOpenSnackbar(true);
        setTimeout(() => {
          navigate("/dashboard"); // Redirect to the dashboard or home page
        }, 2000);
      } else {
        setSnackbarMessage("Invalid credentials. Please try again.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setLoading(false);
  
      if (axios.isAxiosError(error)) { // Use axios.isAxiosError() here
        if (error.response) {
          setSnackbarMessage(`Error: ${error.response.status} - ${error.response.data?.message || "An error occurred."}`);
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

  return (
    <>
      <Container maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            mt: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.light" }}>
            <LockOutlined />
          </Avatar>
          <Typography variant="h5">Login</Typography>
          <Box sx={{ mt: 1 }}>
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
              sx={{ mt: 3, mb: 2 }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Grid container justifyContent={"flex-end"}>
              <Grid item>
                <Link to="/register">Don't have an account? Register</Link>
              </Grid>
              <Grid item>
                <Link to="/forgot_password">Forgot Your Password?</Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* Snackbar for success or error messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default Login;

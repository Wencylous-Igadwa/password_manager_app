/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { LockOutlined } from "@mui/icons-material";
import {
  Container,
  CssBaseline,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  Snackbar,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import axios from "axios";

const ResetPassword: React.FC = () => {
  const [newPassword, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null); // Track token validity
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setSnackbarMessage("Token is missing.");
        setOpenSnackbar(true);
        return;
      }

      try {
        // Verify the token when the component is loaded
        await axiosInstance.get(`/auth/verify-reset/${token}`);
        setIsTokenValid(true); // If the response is successful, set the token as valid
      } catch (error) {
        setIsTokenValid(false); // If an error occurs (e.g., token is invalid), set the token as invalid
        setSnackbarMessage("Invalid or expired token.");
        setOpenSnackbar(true);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  const validateForm = () => {
    if (!newPassword || !confirmPassword) {
      return "Both fields are required.";
    }
    if (newPassword.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  };

  const handleResetPassword = async () => {
    const validationError = validateForm();
    if (validationError) {
      setSnackbarMessage(validationError);
      setOpenSnackbar(true);
      return;
    }

    if (!isTokenValid) {
      setSnackbarMessage("Token is invalid or expired.");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(`/auth/reset-password/${token}`, {
        newPassword,
      });

      if (response.status === 200) {
        setSnackbarMessage("Password reset successful! Redirecting...");
        setOpenSnackbar(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setSnackbarMessage(response.data?.message || "An error occurred.");
        setOpenSnackbar(true);
      }
    } catch (error: unknown) {
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

  if (isTokenValid === null) {
    // Show loading indicator while verifying the token
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <Typography variant="h5">Verifying Token...</Typography>
        </Box>
      </Container>
    );
  }

  if (isTokenValid === false) {
    // Token is invalid, show an error message
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <Typography variant="h5" color="error">
            Invalid or expired token. Please request a new password reset.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
          <LockOutlined />
        </Avatar>
        <Typography variant="h5">Reset Password</Typography>
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
            id="password"
            label="New Password"
            name="password"
            type="password"
            value={newPassword}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleResetPassword}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </Button>
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

export default ResetPassword;

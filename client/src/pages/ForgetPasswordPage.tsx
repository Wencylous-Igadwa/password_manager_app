import React, { useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Container,
    CssBaseline,
    TextField,
    Typography,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import axiosInstance from "../utils/axiosInstance";
import { AxiosError } from 'axios';  
import validator from 'validator';

// Define an interface for the error response data structure
interface ErrorResponse {
    message: string;
}

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!validator.isEmail(email)) {
        setMessage('Please enter a valid email address.');
        return;
    }

    setLoading(true);
    setMessage(''); // Clear any previous messages

    try {
        const response = await axiosInstance.post('/auth/password-reset', { email });

        if (response.status === 200) {
            setMessage(`A password reset link has been sent to ${email}. Please check your inbox.`);
        } else {
            setMessage('Unable to send reset link at the moment. Please try again later.');
        }
    } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;

        if (axiosError.response) {
            // Handle backend errors
            switch (axiosError.response.status) {
                case 400:
                    setMessage('Invalid email format or request. Please check and try again.');
                    break;
                case 404:
                    setMessage('We could not find an account associated with that email.');
                    break;
                case 500:
                    setMessage('Server error. Please try again later.');
                    break;
                default:
                    setMessage(axiosError.response.data.message || 'An unexpected error occurred.');
            }
        } else if (axiosError.request) {
            // Handle network errors
            setMessage('Network error. Please check your connection and try again.');
        } else {
            // Handle unexpected errors
            setMessage(`Error: ${axiosError.message || 'An unexpected error occurred.'}`);
        }
    } finally {
        setLoading(false); // Reset loading state
    }
};

return (
        <Container maxWidth="xs">
            <CssBaseline />
            <Box
                sx={{
                    mt: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'primary.light' }}>
                    <LockOutlined />
                </Avatar>
                <Typography variant="h5">Forgot Password</Typography>
                <Box component="form" onSubmit={handleReset} sx={{ mt: 3 }}>
                    <TextField
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        label="Email Address"
                        variant="outlined"
                        required
                        fullWidth
                        autoFocus
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </Box>
                {message && <Typography variant="body2" color="error">{message}</Typography>}
            </Box>
        </Container>
    );
};

export default ForgotPasswordPage;

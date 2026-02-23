import React, { useState } from 'react';
import { authService } from '../services/AuthService';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await authService.resetPassword(email);
            setMessage('If an account exists for this email, you will receive reset instructions shortly.');
        } catch (err) {
            setError('Failed to reset password. Ensure the email is correct.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-dark">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="row w-100 justify-content-center"
            >
                <div className="col-11 col-sm-8 col-md-6 col-lg-4">
                    <div className="auth-card-custom p-5">
                        <h2 className="text-center mb-5 auth-heading-gradient">
                            <span className="text-highlight">Password</span> Reset
                        </h2>

                        {error && <div className="alert alert-danger py-2 small">{error}</div>}
                        {message && <div className="alert alert-success py-2 small">{message}</div>}

                        <form onSubmit={handleReset}>
                            <div className="mb-4">
                                <label className="form-label text-light small">Enter your email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="form-control form-input-custom"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-grad-custom w-100" disabled={loading}>
                                {loading ? 'Sending...' : 'Reset Password'}
                            </button>
                        </form>
                        <div className="text-center mt-4 auth-footer-text">
                            <Link to="/login" className="auth-footer-link">Back to Login</Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { RefreshRounded, BugReportRounded } from '@mui/icons-material';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            borderRadius: 4
                        }}
                    >
                        <BugReportRounded sx={{ fontSize: 64, color: 'error.main' }} />
                        <Typography variant="h4" component="h1" gutterBottom align="center">
                            Something went wrong
                        </Typography>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
                            The application encountered an unexpected error.
                        </Typography>

                        <Box
                            sx={{
                                width: '100%',
                                bgcolor: '#f5f5f5',
                                p: 2,
                                borderRadius: 2,
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                overflowX: 'auto',
                                border: '1px solid #e0e0e0',
                                mb: 2
                            }}
                        >
                            <Typography color="error" sx={{ fontWeight: 'bold' }}>
                                {this.state.error && this.state.error.toString()}
                            </Typography>
                            {this.state.errorInfo && (
                                <Typography variant="caption" color="text.secondary" component="pre" sx={{ mt: 1 }}>
                                    {this.state.errorInfo.componentStack}
                                </Typography>
                            )}
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<RefreshRounded />}
                            onClick={this.handleReload}
                            size="large"
                        >
                            Reload Application
                        </Button>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

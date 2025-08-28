const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

// Serve static files
app.use(express.static('.'));

// Main route - serve the command center dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'DRDO Command Center',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🏢 DRDO Command Center running on http://localhost:${PORT}`);
    console.log(`🔗 Connect to real-time server at http://localhost:8081`);
});

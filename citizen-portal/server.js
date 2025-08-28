const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Serve static files
app.use(express.static('.'));

// Main route - serve the citizen portal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'DRDO Citizen Portal',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🏠 DRDO Citizen Portal running on http://localhost:${PORT}`);
    console.log(`🔗 Connect to real-time server at http://localhost:8081`);
});

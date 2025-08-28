# DRDO Emergency Response System

A comprehensive real-time emergency response management system designed for rapid incident reporting, resource coordination, and emergency communications. This system provides integrated solutions for command centers, citizens, and emergency responders with real-time data synchronization and geolocation-based services.

## System Overview

The DRDO Emergency Response System is a multi-component platform that enables efficient emergency management through:

- **Real-time Communication**: WebSocket-based instant messaging and notifications
- **Incident Management**: Comprehensive incident reporting, tracking, and resolution
- **Resource Coordination**: Dynamic allocation and tracking of emergency resources
- **Geolocation Services**: Location-based incident mapping and responder dispatch
- **Multi-role Access**: Differentiated interfaces for command centers, citizens, and responders

## Architecture

The system follows a microservices architecture with the following components:

### Core Services

- **Real-time Server** (Port 8081): Central communication hub with Socket.IO
- **Command Center** (Port 3002): Administrative interface for emergency coordinators
- **Citizen Portal** (Port 3003): Public interface for incident reporting
- **Backend Services**: Java-based API services and data processing

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Leaflet.js for mapping
- **Backend**: Node.js, Express.js, Socket.IO for real-time communication
- **Database**: PostgreSQL with Redis for caching and session management
- **Authentication**: JWT-based secure authentication system
- **Mapping**: OpenStreetMap with Leaflet for geospatial visualization

## Features

### Command Center Dashboard
- Real-time incident monitoring and management
- Resource allocation and tracking dashboard
- Emergency responder coordination interface
- Comprehensive reporting and analytics
- Multi-priority incident classification system

### Citizen Portal
- Simple incident reporting interface
- Emergency contact information
- Real-time status updates on reported incidents
- Community safety notifications
- Emergency preparedness resources

### Real-time Communication
- Instant messaging between all system components
- Push notifications for critical alerts
- Location-based emergency broadcasts
- Secure communication channels
- Connection resilience and automatic reconnection

### Incident Management
- Structured incident reporting workflow
- Priority-based incident classification
- Resource requirement assessment
- Progress tracking and status updates
- Historical incident database

## Installation

### Prerequisites

- Node.js (version 16.0 or higher)
- PostgreSQL (version 12.0 or higher)
- Redis (version 6.0 or higher)
- Git

### Quick Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/IRONalways17/DRDO-Emergency-Response-System.git
   cd DRDO-Emergency-Response-System
   ```

2. **Run Setup Script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   The setup script will automatically:
   - Install all dependencies for each service
   - Configure environment variables
   - Initialize the database
   - Start all services

### Manual Installation

If you prefer manual installation:

1. **Install Dependencies for Each Service**
   ```bash
   # Real-time Server
   cd realtime-server && npm install && cd ..
   
   # Command Center
   cd command-center && npm install && cd ..
   
   # Citizen Portal
   cd citizen-portal && npm install && cd ..
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env` in each service directory
   - Update configuration values as needed

3. **Start Services**
   ```bash
   # Terminal 1: Real-time Server
   cd realtime-server && npm start
   
   # Terminal 2: Command Center
   cd command-center && npm start
   
   # Terminal 3: Citizen Portal
   cd citizen-portal && npm start
   ```

## Configuration

### Environment Variables

Each service requires specific environment variables:

**Real-time Server (.env)**
```
NODE_ENV=production
PORT=8081
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
LOG_LEVEL=info
```

**Command Center (.env)**
```
NODE_ENV=production
PORT=3002
REALTIME_SERVER_URL=http://localhost:8081
API_BASE_URL=http://localhost:8080
```

**Citizen Portal (.env)**
```
NODE_ENV=production
PORT=3003
REALTIME_SERVER_URL=http://localhost:8081
API_BASE_URL=http://localhost:8080
```

### Database Configuration

The system uses PostgreSQL for persistent data storage. Run the following to set up the database:

```bash
# Create database
createdb drdo_emergency

# Run migrations
cd database && npm run migrate
```

## Usage

### Starting the System

1. **Using Setup Script** (Recommended)
   ```bash
   ./setup.sh
   ```

2. **Manual Start**
   ```bash
   # Start real-time server first
   cd realtime-server && npm start &
   
   # Start command center
   cd command-center && npm start &
   
   # Start citizen portal
   cd citizen-portal && npm start &
   ```

### Accessing the System

- **Command Center**: http://localhost:3002
- **Citizen Portal**: http://localhost:3003
- **Real-time Server API**: http://localhost:8081

### User Roles

1. **Emergency Coordinator**: Full access to command center dashboard
2. **Field Responder**: Mobile access with location tracking
3. **Citizen**: Basic incident reporting and status viewing
4. **System Administrator**: System configuration and user management

## API Documentation

### Real-time Events

The system uses Socket.IO for real-time communication with the following events:

- `incident:new` - New incident reported
- `incident:update` - Incident status updated
- `responder:location` - Responder location update
- `alert:broadcast` - System-wide emergency alert
- `resource:allocated` - Resource allocation notification

### REST API Endpoints

- `GET /api/incidents` - Retrieve all incidents
- `POST /api/incidents` - Create new incident
- `PUT /api/incidents/:id` - Update incident
- `GET /api/responders` - Get responder information
- `POST /api/resources/allocate` - Allocate emergency resources

## Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   export NODE_ENV=production
   export PORT=8081
   ```

2. **Process Management**
   Use PM2 for production process management:
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

3. **Reverse Proxy**
   Configure Nginx for load balancing and SSL termination

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Security

The system implements multiple security layers:

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Data Encryption**: TLS/SSL for all communications
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against API abuse
- **Security Headers**: Helmet.js for security headers

## Monitoring and Logging

- **Application Logs**: Winston-based structured logging
- **Performance Monitoring**: Built-in metrics collection
- **Health Checks**: Automated service health monitoring
- **Error Tracking**: Comprehensive error reporting and alerting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Testing

Run the test suite:

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

## Support

For technical support or questions:

- Create an issue in the GitHub repository
- Contact the development team
- Review the documentation in the `/docs` directory

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- DRDO for project requirements and specifications
- Emergency response best practices and standards
- Open source community for the underlying technologies

---

**Version**: 1.0.0  
**Intern Project**: Aug 2024 , DRDO  
**Maintained by**: Aaryan Choudhary

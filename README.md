# NexTicket API Gateway

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-0## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure Firebase service account
- [ ] Update all service URLs
- [ ] Set up SSL/TLS certificates
- [ ] Configure process manager (PM2)
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx)express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A secure, high-performance API Gateway for NexTicket microservices architecture**

</div>

## 🌟 Overview

The NexTicket API Gateway serves as the central entry point for all client requests, providing authentication, routing, rate limiting, and security features for the NexTicket ticketing platform. Built with Express.js and Firebase authentication, it intelligently routes requests to appropriate microservices while ensuring security and performance.

### Key Features

- 🔒 **Firebase Authentication** - JWT token verification with Firebase Admin SDK
- 🚦 **Intelligent Routing** - Dynamic service discovery and load balancing
- 🛡️ **Enterprise Security** - Rate limiting, CORS, security headers, and request validation
- 📊 **Health Monitoring** - Real-time service health checks and metrics
- 🔄 **Request Proxying** - High-performance HTTP proxy with error handling
- 📝 **Comprehensive Logging** - Structured logging with request tracking

## � Quick Start

### Prerequisites

- **Node.js** 16.0.0 or higher
- **Firebase Project** with Admin SDK configured
- **Backend Services** running on configured ports

### Installation

1. **Clone and setup the project:**
   ```bash
   cd /path/to/NexTicket/ApiGateway
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Firebase credentials:**
   - Download service account key from Firebase Console
   - Save as `firebase-service-account.json` in project root

4. **Start the gateway:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

The API Gateway will be available at `http://localhost:3000`

## 📋 Environment Configuration

Create a `.env` file with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Firebase Authentication
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Backend Services
NOTIFICATION_SERVICE_URL=http://localhost:5000
EVENT_SERVICE_URL=http://localhost:4000
TICKET_SERVICE_URL=http://localhost:8000
PUBLIC_SERVICE_URL=http://localhost:5003

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
PROXY_TIMEOUT=30000
```

## �️ API Routes

### Public Routes (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Gateway information and status |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/health/services` | Backend services health status |
| `GET` | `/api/info` | API documentation |
| `ALL` | `/public/*` | Public service endpoints |

### Protected Routes (Authentication Required)

| Service | Route Pattern | Target | Description |
|---------|---------------|--------|-------------|
| Notifications | `/notifi_service/*` | `:5000` | Notification management |
| Events | `/event_service/*` | `:4000` | Event management |
| Tickets | `/ticket_service/*` | `:8000` | Ticket operations |
| Auth Test | `/auth/test` | Internal | Authentication verification |

## 🔐 Authentication

### Request Format

Include Firebase JWT token in the Authorization header:

```bash
Authorization: Bearer <firebase-jwt-token>
```

### User Context

After authentication, user information is available in `req.user`:

```javascript
{
  uid: "firebase-user-id",
  email: "user@example.com",
  emailVerified: true,
  name: "User Name",
  roles: ["user", "admin"],
  customClaims: { /* custom claims */ }
}
```

### Testing Authentication

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/auth/test
```

## 🏥 Health Monitoring

### Gateway Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-14T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600.45,
  "environment": "production"
}
```

### Services Health Check

```bash
curl http://localhost:3000/health/services
```

**Response:**
```json
{
  "overall": "healthy",
  "services": {
    "notification": {
      "status": "healthy",
      "url": "http://localhost:5000",
      "responseTime": "45ms"
    },
    "event": {
      "status": "unhealthy",
      "url": "http://localhost:4000",
      "error": "Connection refused"
    }
  }
}
```

## ⚙️ Configuration Options

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | - | Yes |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Service account key path | - | Yes |
| `NOTIFICATION_SERVICE_URL` | Notification service endpoint | `http://localhost:5000` | Yes |
| `EVENT_SERVICE_URL` | Event service endpoint | `http://localhost:4000` | Yes |
| `TICKET_SERVICE_URL` | Ticket service endpoint | `http://localhost:8000` | Yes |
| `PUBLIC_SERVICE_URL` | Public service endpoint | `http://localhost:5003` | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window | `900000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `PROXY_TIMEOUT` | Proxy timeout (ms) | `30000` | No |

## 🛡️ Security Features

### Rate Limiting
- **Default:** 100 requests per 15 minutes per IP address
- **Response:** `429 Too Many Requests` when limit exceeded
- **Configurable:** Via `RATE_LIMIT_*` environment variables

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- And more via Helmet.js middleware

### CORS Configuration
- Configurable allowed origins
- Credentials support enabled
- Preflight request handling

## � Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure Firebase service account
- [ ] Update all service URLs
- [ ] Set up SSL/TLS certificates
- [ ] Configure process manager (PM2)
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx)

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
USER node
CMD ["npm", "start"]
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "nexticket-gateway"

# Enable startup script
pm2 startup
pm2 save
```

## 🔧 Development

### Project Structure

```
ApiGateway/
├── config/          # Configuration files
│   ├── firebase.js  # Firebase Admin SDK setup
│   └── proxy.js     # Proxy configuration
├── controllers/     # Request controllers
├── middleware/      # Custom middleware
├── routes/          # Route definitions
├── server.js        # Application entry point
└── package.json     # Dependencies and scripts
```

### Available Scripts

```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
npm test       # Run tests (placeholder)
```

### Adding New Services

1. **Update environment variables:**
   ```bash
   NEW_SERVICE_URL=http://localhost:9000
   ```

2. **Configure proxy in `config/proxy.js`:**
   ```javascript
   newService: {
     target: process.env.NEW_SERVICE_URL,
     pathRewrite: { '^/new_service': '' },
     requireAuth: true
   }
   ```

3. **Add route in `routes/serviceRoutes.js`**

## � Troubleshooting

### Common Issues

**Firebase Authentication Fails**
- Verify `FIREBASE_PROJECT_ID` is correct
- Check service account key file exists and is valid
- Ensure Firebase Admin SDK permissions

**Service Proxy Errors (502 Bad Gateway)**
- Verify backend service URLs are accessible
- Check if services are running on specified ports
- Review firewall and network configuration

**Rate Limiting Too Restrictive**
- Adjust `RATE_LIMIT_MAX_REQUESTS` for your needs
- Consider implementing user-based rate limiting
- Review rate limit window configuration

**CORS Errors**
- Update `ALLOWED_ORIGINS` to include frontend domains
- Verify preflight requests are handled correctly
- Check for trailing slashes in origin URLs

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
LOG_LEVEL=debug npm run dev
```

### Health Check Testing

```bash
# Test all endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/services

# Test authentication
curl -H "Authorization: Bearer VALID_JWT" \
     http://localhost:3000/auth/test

# Test rate limiting
for i in {1..105}; do
  curl -s http://localhost:3000/health > /dev/null
  echo "Request $i completed"
done
```

## 📄 API Response Format

### Success Response
```json
{
  "data": { /* response data */ },
  "timestamp": "2025-09-14T10:30:00.000Z",
  "requestId": "uuid-string"
}
```

### Error Response
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "timestamp": "2025-09-14T10:30:00.000Z",
  "requestId": "uuid-string"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway (Service Unavailable)

## 📞 Support

For technical support and questions:

1. **Check the logs** for error details
2. **Review the troubleshooting guide** above
3. **Test individual components** (auth, proxy, services)
4. **Create an issue** with detailed reproduction steps

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---



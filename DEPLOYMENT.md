# Deployment Guide

## Prerequisites
- Node.js v14+ installed
- MongoDB v4+ running
- Email account for SMTP (Gmail recommended)
- Domain name (for production)
- SSL certificate (for HTTPS)

## Local Development Deployment

### 1. Install Dependencies
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment
Create `.env` file in root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/message-platform
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_random
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@messageplatform.com
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start MongoDB
```bash
# If MongoDB is installed locally
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Or separately
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd frontend
npm start
```

### 5. Create Admin User
```bash
# Connect to MongoDB
mongo message-platform

# Make a user admin
db.users.updateOne(
  { email: "your_email@example.com" },
  { $set: { isAdmin: true } }
)
```

## Production Deployment

### Option 1: VPS (DigitalOcean, AWS EC2, etc.)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Clone and Setup Project
```bash
# Clone repository
git clone https://github.com/mainakgarai007/Message-.git
cd Message-

# Install dependencies
npm install
cd frontend
npm install
cd ..

# Create production .env
nano .env
```

Production `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/message-platform
JWT_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_KEY_HERE_MIN_64_CHARS
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
```

#### 3. Build Frontend
```bash
cd frontend
npm run build
cd ..
```

#### 4. Setup Nginx
```bash
sudo nano /etc/nginx/sites-available/message-platform
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /home/user/Message-/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/message-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6. Start Application with PM2
```bash
# Start backend
pm2 start backend/server.js --name message-platform

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 7. Setup Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Option 2: Heroku Deployment

#### 1. Prepare for Heroku
Create `Procfile` in root:
```
web: node backend/server.js
```

Update `package.json` to add heroku-postbuild:
```json
{
  "scripts": {
    "heroku-postbuild": "cd frontend && npm install && npm run build"
  }
}
```

#### 2. Deploy to Heroku
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASS=your_password
heroku config:set CLIENT_URL=https://your-app-name.herokuapp.com
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open app
heroku open
```

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy source
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "backend/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/message-platform
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
      - CLIENT_URL=${CLIENT_URL}
      - NODE_ENV=production
    depends_on:
      - mongodb

volumes:
  mongo-data:
```

Deploy:
```bash
docker-compose up -d
```

## Post-Deployment Checklist

- [ ] SSL certificate configured and working
- [ ] Environment variables set correctly
- [ ] MongoDB secured with authentication
- [ ] Firewall configured
- [ ] Email sending working (test verification emails)
- [ ] Domain DNS configured
- [ ] Backup strategy implemented
- [ ] Monitoring setup (PM2, logs)
- [ ] Create first admin user
- [ ] Test all features:
  - [ ] Registration and email verification
  - [ ] Login/logout
  - [ ] Direct messaging
  - [ ] Group creation
  - [ ] Real-time messaging
  - [ ] Bot modes
  - [ ] Language detection
  - [ ] Message commands
  - [ ] Reactions and replies

## Monitoring

### PM2 Logs
```bash
pm2 logs message-platform
pm2 monit
```

### Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Logs
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

## Backup

### MongoDB Backup
```bash
# Backup
mongodump --db message-platform --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --db message-platform /backup/20240101/message-platform
```

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mongodump --db message-platform --out $BACKUP_DIR/$DATE

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -exec rm -rf {} \;
```

Setup cron:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Troubleshooting

### Application Won't Start
- Check logs: `pm2 logs`
- Verify MongoDB is running: `sudo systemctl status mongod`
- Check .env variables
- Ensure port 5000 is not in use

### Socket.io Connection Failed
- Check Nginx websocket configuration
- Verify CORS settings in server.js
- Check firewall rules

### Email Not Sending
- Test SMTP credentials
- Check Gmail security settings
- Enable 2FA and use app password

### High CPU/Memory Usage
- Check for memory leaks with `pm2 monit`
- Adjust PM2 max memory: `pm2 start server.js --max-memory-restart 300M`
- Scale with cluster mode: `pm2 start server.js -i max`

## Scaling

### Horizontal Scaling
Use PM2 cluster mode:
```bash
pm2 start backend/server.js -i max
```

### Load Balancing
Setup Nginx load balancer:
```nginx
upstream backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

location /api {
    proxy_pass http://backend;
}
```

### Database Scaling
- MongoDB Replica Set for high availability
- MongoDB Sharding for large datasets
- Redis for caching and session management

## Security Best Practices

1. **Never commit .env file**
2. **Use strong JWT secrets (64+ characters)**
3. **Enable MongoDB authentication**
4. **Keep dependencies updated**: `npm audit fix`
5. **Use rate limiting** (add express-rate-limit)
6. **Enable HTTPS only**
7. **Setup fail2ban** for SSH protection
8. **Regular backups**
9. **Monitor logs** for suspicious activity
10. **Use environment-specific configs**

## Maintenance

### Update Application
```bash
cd Message-
git pull
npm install
cd frontend && npm install && npm run build && cd ..
pm2 restart message-platform
```

### Update Dependencies
```bash
npm update
cd frontend && npm update && cd ..
npm audit fix
```

### Database Maintenance
```bash
# Compact database
mongo message-platform --eval "db.runCommand({compact: 'messages'})"

# Repair database
mongod --repair
```

# Production Deployment Checklist

## 📋 Pre-Deployment

### Database
- [ ] Run all migration scripts (001-009)
- [ ] Verify RLS policies active
- [ ] Test with production user credentials
- [ ] Backup existing data
- [ ] Set up automatic backups

### Environment Variables
- [ ] Update `.env.local` with production values
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (critical for admin)
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Configure MQTT credentials if needed
- [ ] Set up monitoring API keys

### Security
- [ ] Remove test users
- [ ] Change default admin password
- [ ] Review user permissions
- [ ] Enable 2FA for admin accounts (if available)
- [ ] Configure CORS settings
- [ ] Set up rate limiting

---

## 🔧 Hardware Setup

### Raspberry Pi (MQTT Broker)
- [ ] Install Mosquitto: `sudo apt install mosquitto mosquitto-clients -y`
- [ ] Configure authentication (if needed)
- [ ] Set up autostart: `sudo systemctl enable mosquitto`
- [ ] Test connection: `mosquitto_sub -h localhost -t "#" -v`
- [ ] Deploy mqtt_listener.cjs with PM2
- [ ] Configure firewall: allow port 1883

### ESP32 Devices
- [ ] Prepare config.h for each device
- [ ] Calibrate ammonia sensors
- [ ] Test WiFi connectivity
- [ ] Upload firmware
- [ ] Label devices with IDs
- [ ] Document MAC addresses
- [ ] Test battery life (if battery-powered)

### Network
- [ ] Static IP for Raspberry Pi
- [ ] Port forwarding (if remote access needed)
- [ ] VPN setup (recommended)
- [ ] Document network topology

---

## 🚀 Application Deployment

### Next.js Application

#### Development Mode (Quick Test)
```bash
npm run dev
# Access at http://localhost:3000
```

#### Production Build
```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

#### Docker Deployment (Recommended)
```bash
# Create Dockerfile
docker build -t iot-webapp .

# Run container
docker run -d -p 3000:3000 --env-file .env.local iot-webapp

# Or use docker-compose
docker-compose up -d
```

#### PM2 Deployment (Node.js Server)
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "iot-webapp" -- start

# Auto-restart on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs iot-webapp
```

### MQTT Listener (Raspberry Pi)
```bash
# Install dependencies
cd /home/admin/iot-system
npm install

# Start with PM2
pm2 start scripts/mqtt_listener.cjs --name mqtt_listener
pm2 save

# Check status
pm2 status
pm2 logs mqtt_listener
```

---

## ✅ Testing

### Functional Tests
- [ ] User login/logout
- [ ] Device CRUD operations
- [ ] Real-time data display
- [ ] Alert generation
- [ ] MQTT publish/subscribe
- [ ] Dashboard metrics accuracy

### ESP32 → Web Flow
- [ ] ESP32 sends data → MQTT
- [ ] MQTT listener receives → Supabase
- [ ] Web displays real-time updates
- [ ] Alerts trigger correctly
- [ ] Historical data retrieval works

### Performance Tests
- [ ] Load test: 10 devices × 1 msg/min = 10 msg/min
- [ ] Database query response time < 500ms
- [ ] Dashboard load time < 2s
- [ ] MQTT latency < 100ms

### Edge Cases
- [ ] Device offline handling
- [ ] Network interruption recovery
- [ ] Database connection loss
- [ ] Invalid sensor data handling
- [ ] Timestamp sync issues

---

## 📊 Monitoring Setup

### Application Monitoring
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set up performance monitoring (Vercel Analytics)
- [ ] Create alerts for critical errors

### Device Monitoring
- [ ] Monitor device online/offline status
- [ ] Alert on missing data (> 5 minutes)
- [ ] Battery level alerts (< 20%)
- [ ] Sensor out-of-range alerts

### Infrastructure
- [ ] Server resource monitoring (CPU, RAM, Disk)
- [ ] Database performance metrics
- [ ] MQTT broker health check
- [ ] Network bandwidth usage

---

## 🔒 Security Hardening

### Application
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set secure cookie flags
- [ ] Implement CSRF protection
- [ ] Add input validation
- [ ] Sanitize user inputs
- [ ] Limit API rate

### Database
- [ ] Review RLS policies
- [ ] Audit user permissions
- [ ] Enable audit logging
- [ ] Regular security updates

### MQTT
- [ ] Enable TLS/SSL
- [ ] Use username/password auth
- [ ] Restrict topics by ACL
- [ ] Change default credentials

### Network
- [ ] Configure firewall rules
- [ ] Use VPN for remote access
- [ ] Disable unused services
- [ ] Regular security scans

---

## 📚 Documentation

### User Documentation
- [ ] Admin user guide
- [ ] Device setup instructions
- [ ] Alert configuration guide
- [ ] Troubleshooting guide

### Technical Documentation
- [ ] API documentation
- [ ] Database schema
- [ ] Network diagram
- [ ] Deployment procedures
- [ ] Backup/restore procedures

### Maintenance
- [ ] Update schedule
- [ ] Backup procedures
- [ ] Disaster recovery plan
- [ ] Contact information

---

## 🔄 Post-Deployment

### Week 1
- [ ] Monitor error logs daily
- [ ] Check device connectivity
- [ ] Verify alert accuracy
- [ ] User feedback collection
- [ ] Performance tuning

### Month 1
- [ ] Review analytics
- [ ] Optimize database queries
- [ ] Update documentation
- [ ] Plan feature enhancements
- [ ] Security audit

### Ongoing
- [ ] Weekly database backups
- [ ] Monthly security updates
- [ ] Quarterly review of alerts
- [ ] Annual hardware maintenance

---

## 🆘 Emergency Contacts

### Technical Support
- **Developer**: [Your Name/Team]
- **Email**: support@yourcompany.com
- **Phone**: +66-XXX-XXX-XXXX

### Vendors
- **Hosting**: [Provider name + support]
- **Database**: Supabase support
- **MQTT Broker**: [If managed service]

---

## 📈 Scaling Considerations

### When to Scale
- More than 50 devices
- > 100 messages per minute
- Response time > 1 second
- Database size > 10GB

### Scaling Options
- [ ] Database read replicas
- [ ] Redis caching layer
- [ ] Load balancer (multiple app instances)
- [ ] MQTT cluster
- [ ] CDN for static assets

---

## 🎯 Success Metrics

- [ ] System uptime > 99.5%
- [ ] API response time < 500ms
- [ ] Zero critical security incidents
- [ ] Device connectivity > 95%
- [ ] User satisfaction > 4/5

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Production URL**: ___________
**Next Review Date**: ___________

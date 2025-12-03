# Deployment Guide

This comprehensive guide walks you through deploying the Vertical SaaS Framework to production. The framework is designed to be cloud-native and can be deployed to various platforms with minimal configuration.

## Prerequisites

Before deploying to production, ensure you have completed the following preparations. A production-ready deployment requires proper infrastructure setup, security configurations, and monitoring tools to ensure reliability and scalability.

### Required Services

You will need accounts and API keys for the following services. Each service plays a critical role in the application's functionality, from database storage to AI-powered features.

**Database**: The framework requires a MySQL 8.0+ compatible database. We recommend managed database services such as AWS RDS MySQL, PlanetScale, or DigitalOcean Managed Databases. These services provide automatic backups, scaling capabilities, and high availability out of the box.

**File Storage**: For storing user-uploaded files, client documents, and generated assets, you need an S3-compatible storage service. AWS S3 is the recommended option, but you can also use Cloudflare R2, DigitalOcean Spaces, or MinIO for self-hosted solutions.

**AI Services**: The framework uses Hugging Face's Inference API for AI-powered features. You can start with their free tier, which provides 30,000 requests per month. For production workloads, consider upgrading to their Pro tier for higher rate limits and priority support.

**Email Service**: Transactional emails (password resets, notifications, invoices) require an SMTP service. SendGrid, Mailgun, or AWS SES are excellent choices with generous free tiers and reliable delivery rates.

**Payment Processing**: If you plan to accept payments, integrate Stripe or PayPal. Stripe is recommended for its developer-friendly API and comprehensive documentation.

### Environment Setup

Create a production environment file with all necessary configuration variables. Never commit this file to version control. Instead, use your hosting platform's environment variable management system.

```bash
# Database Configuration
DATABASE_URL=mysql://user:password@host:3306/database_name

# Authentication
JWT_SECRET=your-secure-random-string-here
OAUTH_SERVER_URL=https://your-oauth-server.com

# AI Services
HUGGINGFACE_API_KEY=hf_your_api_key_here

# File Storage (S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application Settings
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
```

## Deployment Options

The framework supports multiple deployment strategies depending on your infrastructure preferences and scaling requirements. Each option has its own trade-offs in terms of cost, complexity, and scalability.

### Option 1: Docker Deployment (Recommended)

Docker provides the most consistent deployment experience across different hosting platforms. This approach ensures that your application runs identically in development, staging, and production environments.

**Step 1: Build the Docker Image**

The framework includes a production-optimized Dockerfile that creates a multi-stage build. This approach minimizes the final image size while including all necessary dependencies.

```bash
docker build -t vertical-saas-framework:latest .
```

**Step 2: Run with Docker Compose**

For a complete production stack including the database and Redis for caching, use Docker Compose. This configuration sets up all services with proper networking and volume management.

```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Step 3: Configure Reverse Proxy**

Set up Nginx or Traefik as a reverse proxy to handle SSL termination and load balancing. This configuration ensures secure HTTPS connections and can distribute traffic across multiple application instances.

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Platform as a Service (PaaS)

Platform services like Railway, Render, or Heroku provide the simplest deployment experience with automatic scaling and zero DevOps overhead. These platforms are ideal for teams without dedicated infrastructure engineers.

**Railway Deployment**

Railway offers one-click deployment with automatic SSL, custom domains, and built-in monitoring. Connect your GitHub repository and Railway will automatically deploy on every push to your main branch.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

**Render Deployment**

Render provides similar functionality with a focus on developer experience. Their free tier is generous enough for testing and small-scale production deployments.

Create a `render.yaml` file in your repository root:

```yaml
services:
  - type: web
    name: vertical-saas-framework
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: HUGGINGFACE_API_KEY
        sync: false
```

### Option 3: Kubernetes Deployment

For enterprise-scale deployments requiring high availability and advanced orchestration, Kubernetes provides the most robust solution. This approach is recommended for applications serving thousands of concurrent users.

**Step 1: Create Kubernetes Manifests**

Define your application's deployment, service, and ingress configurations. These manifests describe how Kubernetes should run and expose your application.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vertical-saas-framework
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vertical-saas-framework
  template:
    metadata:
      labels:
        app: vertical-saas-framework
    spec:
      containers:
      - name: app
        image: your-registry/vertical-saas-framework:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

**Step 2: Deploy to Cluster**

Apply your configurations to the Kubernetes cluster. Use namespaces to separate staging and production environments.

```bash
kubectl apply -f k8s/
kubectl rollout status deployment/vertical-saas-framework
```

## Database Migration

Running database migrations in production requires careful planning to avoid downtime and data loss. Always test migrations on a staging environment with production-like data before applying them to production.

### Pre-Migration Checklist

Before running any migration, complete these critical steps. Skipping any of these could result in data loss or extended downtime.

**Backup Your Database**: Create a full database backup and verify its integrity. Store the backup in a secure location separate from your primary database server.

```bash
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Test on Staging**: Apply the migration to a staging environment with production data. Monitor for errors, performance issues, and data integrity problems.

**Plan Rollback Strategy**: Prepare rollback scripts in case the migration fails. Test these scripts on staging to ensure they work correctly.

### Running Migrations

The framework uses Drizzle ORM for database migrations, which provides a type-safe and version-controlled approach to schema changes.

```bash
# Generate migration files
pnpm db:generate

# Review generated SQL
cat drizzle/migrations/*.sql

# Apply migrations
pnpm db:migrate
```

For zero-downtime migrations, use the blue-green deployment strategy. Deploy the new version alongside the old one, run migrations, then switch traffic to the new version.

## Monitoring and Logging

Production deployments require comprehensive monitoring to detect and resolve issues before they impact users. Implement monitoring at multiple levels including application metrics, infrastructure health, and business KPIs.

### Application Monitoring

Use Application Performance Monitoring (APM) tools to track request latency, error rates, and throughput. New Relic, Datadog, or open-source alternatives like Prometheus and Grafana provide excellent visibility into application behavior.

**Key Metrics to Monitor**:

- **Response Time**: Track P50, P95, and P99 latency for all API endpoints
- **Error Rate**: Monitor 4xx and 5xx error rates with alerting thresholds
- **Database Performance**: Track query execution time and connection pool utilization
- **AI API Usage**: Monitor Hugging Face API calls and rate limit consumption
- **Memory and CPU**: Track resource usage to identify memory leaks or CPU bottlenecks

### Logging Strategy

Implement structured logging with proper log levels (debug, info, warn, error) and contextual information. Centralize logs using services like Logtail, Papertrail, or self-hosted solutions like ELK stack.

```typescript
// Example structured logging
logger.info('User created tenant', {
  userId: user.id,
  tenantId: tenant.id,
  businessType: tenant.businessType,
  timestamp: new Date().toISOString(),
});
```

### Error Tracking

Integrate error tracking services like Sentry or Rollbar to capture and aggregate application errors. These tools provide stack traces, user context, and error frequency data to prioritize bug fixes.

```bash
# Install Sentry
pnpm add @sentry/node @sentry/tracing

# Configure in your application
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

## Security Hardening

Production deployments must implement multiple layers of security to protect user data and prevent unauthorized access. Security should be treated as an ongoing process, not a one-time configuration.

### SSL/TLS Configuration

Always use HTTPS in production with proper SSL/TLS certificates. Let's Encrypt provides free certificates with automatic renewal. Configure your web server to use modern TLS protocols and strong cipher suites.

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

### Rate Limiting

Implement rate limiting to prevent abuse and DDoS attacks. The framework includes built-in rate limiting middleware that can be configured per endpoint.

```typescript
// Configure rate limits
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
```

### Database Security

Secure your database with proper access controls, encrypted connections, and regular security updates. Use read-only database replicas for reporting queries to minimize the attack surface.

**Security Checklist**:

- Use strong passwords with at least 32 characters
- Enable SSL/TLS for database connections
- Restrict database access to application servers only
- Enable audit logging for sensitive operations
- Regularly update database software and apply security patches
- Implement database backup encryption

### API Security

Protect your API endpoints with authentication, authorization, and input validation. The framework uses JWT tokens for authentication and role-based access control for authorization.

```typescript
// Validate and sanitize user input
const createContactSchema = z.object({
  email: z.string().email().max(320),
  firstName: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});
```

## Performance Optimization

Optimize your production deployment for speed and efficiency. Performance directly impacts user experience, conversion rates, and operational costs.

### Caching Strategy

Implement multi-level caching to reduce database load and improve response times. Use Redis for session storage, query caching, and rate limiting.

```typescript
// Cache frequently accessed data
const cachedTenant = await redis.get(`tenant:${tenantId}`);
if (cachedTenant) {
  return JSON.parse(cachedTenant);
}

const tenant = await db.query.tenants.findFirst({
  where: eq(tenants.id, tenantId),
});

await redis.setex(`tenant:${tenantId}`, 3600, JSON.stringify(tenant));
```

### CDN Configuration

Serve static assets through a Content Delivery Network (CDN) to reduce latency and bandwidth costs. Cloudflare, AWS CloudFront, or Fastly provide excellent CDN services with generous free tiers.

Configure your CDN to cache static assets aggressively while bypassing cache for API endpoints. Set appropriate cache headers to control browser and CDN caching behavior.

### Database Optimization

Optimize database queries with proper indexing, query analysis, and connection pooling. Monitor slow queries and add indexes for frequently accessed columns.

```sql
-- Add indexes for common queries
CREATE INDEX idx_contacts_tenant_status ON contacts(tenantId, status);
CREATE INDEX idx_invoices_tenant_date ON invoices(tenantId, issueDate);
CREATE INDEX idx_appointments_tenant_date ON appointments(tenantId, startTime);
```

## Scaling Strategy

Plan for growth by implementing horizontal scaling, load balancing, and auto-scaling policies. The framework is designed to scale horizontally by adding more application instances.

### Horizontal Scaling

Run multiple application instances behind a load balancer to distribute traffic and provide high availability. Use session affinity (sticky sessions) if needed, but prefer stateless authentication with JWT tokens.

### Database Scaling

Scale your database vertically (larger instance) for immediate capacity increases, or horizontally (read replicas) for read-heavy workloads. Consider database sharding for multi-tenant applications with millions of users.

### Auto-Scaling

Configure auto-scaling policies based on CPU usage, memory consumption, or request rate. Cloud providers offer built-in auto-scaling for compute instances and Kubernetes clusters.

```yaml
# Kubernetes Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vertical-saas-framework
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vertical-saas-framework
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Backup and Disaster Recovery

Implement comprehensive backup and disaster recovery procedures to protect against data loss and ensure business continuity. Test your recovery procedures regularly to verify they work when needed.

### Backup Strategy

Create automated daily backups of your database with point-in-time recovery capability. Store backups in multiple geographic regions for redundancy. Retain backups for at least 30 days, with longer retention for compliance requirements.

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"

mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/database/

# Verify backup integrity
gunzip -t $BACKUP_FILE && echo "Backup successful" || echo "Backup failed"
```

### Disaster Recovery Plan

Document your disaster recovery procedures including recovery time objectives (RTO) and recovery point objectives (RPO). Practice recovery procedures quarterly to ensure your team can execute them under pressure.

**Recovery Procedures**:

1. Assess the scope and impact of the incident
2. Notify stakeholders and activate incident response team
3. Restore database from the most recent backup
4. Verify data integrity and application functionality
5. Switch DNS to backup infrastructure if needed
6. Monitor application health and user reports
7. Conduct post-incident review and update procedures

## Cost Optimization

Monitor and optimize your infrastructure costs to maintain profitability while delivering excellent service. Cloud costs can spiral quickly without proper monitoring and optimization.

### Cost Monitoring

Set up billing alerts and cost anomaly detection to catch unexpected cost increases. Review your monthly bills and identify opportunities for optimization.

**Common Cost Optimization Strategies**:

- Use reserved instances or savings plans for predictable workloads
- Right-size compute instances based on actual usage patterns
- Implement auto-scaling to match capacity with demand
- Use spot instances for non-critical batch processing
- Optimize database instance sizes and storage types
- Implement data lifecycle policies to archive or delete old data
- Use CDN caching to reduce bandwidth costs
- Optimize AI API usage with caching and batching

## Support and Maintenance

Establish processes for ongoing maintenance, security updates, and user support. Regular maintenance prevents technical debt and ensures long-term system reliability.

### Update Schedule

Plan regular maintenance windows for security updates, dependency upgrades, and feature releases. Communicate maintenance schedules to users in advance and minimize disruption.

**Recommended Update Cadence**:

- **Security patches**: Apply immediately or within 24 hours
- **Dependency updates**: Review and apply weekly
- **Feature releases**: Deploy bi-weekly or monthly
- **Major version upgrades**: Plan quarterly with thorough testing

### Monitoring Checklist

Review these metrics daily to ensure system health and catch issues early:

- Application uptime and availability
- Error rates and types
- Response time trends
- Database performance and query patterns
- AI API usage and rate limits
- Storage capacity and growth rate
- Security alerts and suspicious activity
- User feedback and support tickets

---

**Deployment Support**: For assistance with production deployments, consult the [GitHub Discussions](https://github.com/Gnoscenti/vertical-saas-framework/discussions) or open an issue for specific problems.


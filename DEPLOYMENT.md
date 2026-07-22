# GENESIS ID - Deployment Guide (AWS)

## Architecture
```
Route 53 (DNS)
    ↓
CloudFront (CDN, CORS)
    ↓
ALB (Application Load Balancer)
    ↓
ECS (Container: Node.js Express)
    ↓
RDS PostgreSQL (Database)
```

GENESIS ID is self-contained — there is no external verification provider in
this pipeline. Facial and document capture, storage, and (manual) review all
happen inside GENESIS ID itself. See `VERIFICATION_ENGINE.md`.

## Prerequisites
- AWS Account con permisos de admin
- AWS CLI configurado
- Docker instalado (para build de imagen)
- Git con SSH configurado

## Phase 1: Database Setup (AWS RDS)

### 1. Create RDS PostgreSQL Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier genesis-id-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username postgres \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name genesis-id-subnet-group
```

### 2. Create Database
```bash
psql -h genesis-id-db.xxxxx.us-east-1.rds.amazonaws.com -U postgres -c \
  "CREATE DATABASE genesis_id_db;"
```

### 3. Run Migrations
```bash
npm run migrate
```

---

## Phase 2: Container Setup (ECR & ECS)

### 1. Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name genesis-id \
  --region us-east-1
```

### 2. Build Docker Image
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Build y push:
```bash
docker build -t genesis-id:latest .

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag genesis-id:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/genesis-id:latest

# Push
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/genesis-id:latest
```

### 3. Create ECS Task Definition
```json
{
  "family": "genesis-id",
  "taskRoleArn": "arn:aws:iam::123456789:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "genesis-id",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/genesis-id:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:genesis-id-db-pass"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:genesis-id-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/genesis-id",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}
```

### 4. Create ECS Service
```bash
aws ecs create-service \
  --cluster genesis-id-cluster \
  --service-name genesis-id-service \
  --task-definition genesis-id:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=genesis-id,containerPort=3000"
```

---

## Phase 3: Load Balancer & DNS

### 1. Create ALB
```bash
aws elbv2 create-load-balancer \
  --name genesis-id-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application
```

### 2. Create Target Group
```bash
aws elbv2 create-target-group \
  --name genesis-id-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-enabled \
  --health-check-path /health \
  --health-check-interval-seconds 30
```

### 3. Create Route 53 Record
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "genesis-id.orden-global.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z123456",
          "DNSName": "genesis-id-alb-123456.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

---

## Phase 4: Secrets Management

### 1. Store Secrets in AWS Secrets Manager
```bash
aws secretsmanager create-secret \
  --name genesis-id-db-pass \
  --secret-string "YourSecurePassword123!"

aws secretsmanager create-secret \
  --name genesis-id-jwt-secret \
  --secret-string "your_long_random_jwt_secret_key"

aws secretsmanager create-secret \
  --name genesis-id-email-password \
  --secret-string "your_email_app_password"
```

---

## Phase 5: Monitoring & Logging

### 1. CloudWatch Logs
```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/genesis-id

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/genesis-id \
  --retention-in-days 30
```

### 2. CloudWatch Alarms
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name genesis-id-cpu-high \
  --alarm-description "Alert if CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## Phase 6: SSL/TLS Certificate

### 1. Create Certificate (AWS Certificate Manager)
```bash
aws acm request-certificate \
  --domain-name genesis-id.orden-global.com \
  --subject-alternative-names *.genesis-id.orden-global.com \
  --validation-method DNS
```

### 2. Validate DNS
Sigue instrucciones en AWS Console para validar DNS.

### 3. Attach to ALB
```bash
aws elbv2 modify-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:...
```

---

## Deployment Commands

### Deploy Nueva Versión
```bash
# 1. Build image
docker build -t genesis-id:v1.1 .

# 2. Push a ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/genesis-id:v1.1

# 3. Update task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 4. Update service
aws ecs update-service \
  --cluster genesis-id-cluster \
  --service genesis-id-service \
  --task-definition genesis-id:2 \
  --force-new-deployment
```

### Check Deployment Status
```bash
aws ecs describe-services \
  --cluster genesis-id-cluster \
  --services genesis-id-service
```

---

## Health Check

```bash
curl https://genesis-id.orden-global.com/health
# Response: {"status": "ok", "timestamp": "2024-07-21T..."}
```

---

## Rollback

```bash
# Revert a versión anterior
aws ecs update-service \
  --cluster genesis-id-cluster \
  --service genesis-id-service \
  --task-definition genesis-id:1 \
  --force-new-deployment
```

---

## Costs (Estimated Monthly)
- RDS PostgreSQL (db.t3.micro): ~$30
- ECS Fargate (2 tasks, 256 CPU, 512 MB): ~$50
- ALB: ~$15
- Data Transfer: ~$10
- CloudWatch: ~$5
- **Total: ~$110/mes**

---

## Checklist Pre-Production
- [ ] Database backed up
- [ ] SSL certificate instalado
- [ ] CloudWatch alarms configuradas
- [ ] Rate limiting implementado
- [ ] CORS configurado correctamente
- [ ] Secrets rotados
- [ ] Load testing completado
- [ ] Disaster recovery plan

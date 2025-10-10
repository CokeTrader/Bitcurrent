# BitCurrent Exchange - Load Balancers Configuration

# Application Load Balancer for API Gateway
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "8.7.0"

  name = "${local.cluster_name}-alb"

  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [module.security_group_alb.security_group_id]

  # Access logs
  enable_deletion_protection = true
  
  access_logs = {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
  }

  # Target groups
  target_groups = [
    {
      name             = "${local.cluster_name}-api"
      backend_protocol = "HTTP"
      backend_port     = 8080
      target_type      = "ip"
      
      health_check = {
        enabled             = true
        interval            = 30
        path                = "/health"
        port                = "traffic-port"
        healthy_threshold   = 2
        unhealthy_threshold = 3
        timeout             = 10
        protocol            = "HTTP"
        matcher             = "200"
      }
    }
  ]

  # HTTPS listener
  https_listeners = [
    {
      port            = 443
      protocol        = "HTTPS"
      certificate_arn = aws_acm_certificate.api.arn
      
      action_type      = "forward"
      target_group_index = 0
    }
  ]

  # HTTP listener (redirect to HTTPS)
  http_tcp_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      action_type = "redirect"
      
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]

  tags = local.common_tags
}

# Network Load Balancer for WebSocket
module "nlb_websocket" {
  source  = "terraform-aws-modules/alb/aws"
  version = "8.7.0"

  name = "${local.cluster_name}-nlb-ws"

  load_balancer_type = "network"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets

  target_groups = [
    {
      name             = "${local.cluster_name}-ws"
      backend_protocol = "TCP"
      backend_port     = 8080
      target_type      = "ip"
      
      health_check = {
        enabled             = true
        interval            = 30
        port                = 8080
        protocol            = "HTTP"
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 3
      }
    }
  ]

  # TLS listener for WebSocket
  https_listeners = [
    {
      port            = 443
      protocol        = "TLS"
      certificate_arn = aws_acm_certificate.ws.arn
      
      action_type      = "forward"
      target_group_index = 0
    }
  ]

  tags = local.common_tags
}

# Security Group for ALB
module "security_group_alb" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.0"

  name        = "${local.cluster_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["http-80-tcp", "https-443-tcp"]

  egress_rules = ["all-all"]

  tags = local.common_tags
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = module.alb.lb_dns_name
}

output "nlb_dns_name" {
  description = "DNS name of the NLB"
  value       = module.nlb_websocket.lb_dns_name
}




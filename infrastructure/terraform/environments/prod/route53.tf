# BitCurrent Exchange - Route53 DNS Configuration

# Hosted Zone for bitcurrent.co.uk
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(local.common_tags, {
    Name = "bitcurrent-zone"
  })
}

# A record for root domain (points to CloudFront)
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

# A record for www (points to CloudFront)
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

# A record for api subdomain (points to ALB)
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.alb.lb_dns_name
    zone_id                = module.alb.lb_zone_id
    evaluate_target_health = true
  }
}

# A record for ws subdomain (points to NLB for WebSocket)
resource "aws_route53_record" "ws" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "ws.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.nlb_websocket.lb_dns_name
    zone_id                = module.nlb_websocket.lb_zone_id
    evaluate_target_health = true
  }
}

# CNAME for admin subdomain
resource "aws_route53_record" "admin" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "admin.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["api.${var.domain_name}"]
}

# CNAME for grafana subdomain
resource "aws_route53_record" "grafana" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "grafana.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["api.${var.domain_name}"]
}

# MX records for email (AWS SES)
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 300
  records = [
    "10 inbound-smtp.eu-west-2.amazonaws.com"
  ]
}

# TXT record for SPF
resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 300
  records = [
    "v=spf1 include:amazonses.com ~all"
  ]
}

# TXT record for domain verification
resource "aws_route53_record" "domain_verification" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 300
  records = [
    "bitcurrent-verification=${random_string.domain_verification.result}"
  ]
}

# CAA records for SSL certificate authority
resource "aws_route53_record" "caa" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "CAA"
  ttl     = 300
  records = [
    "0 issue \"amazon.com\"",
    "0 issue \"letsencrypt.org\"",
    "0 issuewild \"amazon.com\""
  ]
}

# Random string for domain verification
resource "random_string" "domain_verification" {
  length  = 32
  special = false
}

# Outputs
output "nameservers" {
  description = "Route53 nameservers for domain configuration"
  value       = aws_route53_zone.main.name_servers
}

output "zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}




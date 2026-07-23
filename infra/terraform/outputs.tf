output "public_ip" {
  description = "Elastic IP of the EC2 instance"
  value       = aws_eip.playground.public_ip
}

output "frontend_url" {
  value = "http://${aws_eip.playground.public_ip}:5173"
}

output "api_url" {
  value = "http://${aws_eip.playground.public_ip}:8080/api/health"
}

output "ssh_command" {
  value = "ssh -i infra/terraform/playground-ec2.pem ec2-user@${aws_eip.playground.public_ip}"
}

output "private_key_path" {
  value = abspath("${path.module}/playground-ec2.pem")
}

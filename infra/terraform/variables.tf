variable "aws_region" {
  type    = string
  default = "ap-southeast-2"
}

variable "aws_profile" {
  type    = string
  default = "playground"
}

variable "project_name" {
  type    = string
  default = "playground"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "repo_url" {
  type    = string
  default = "https://github.com/dragoon920/playground.git"
}

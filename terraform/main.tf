terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }

  required_version = ">= 0.14.9"
}

provider "aws" {
  profile = "default"
  region  = "us-east-2"
}


# Create VPC for source database

resource "aws_vpc" "dmsvpc_source" {
  cidr_block = "102.0.0.0/16"
  tags = {
    Name = "DMSVPC-Source"
  }
}

resource "aws_subnet" "dmssubnet1-source" {
  vpc_id = aws_vpc.dmsvpc_source.id
  availability_zone = "us-east-2a"
  cidr_block = "102.0.0.0/24"
  tags = {
    Name = "DMSSubnet1-Source"
  }
}

resource "aws_subnet" "dmssubnet2-source" {
  vpc_id = aws_vpc.dmsvpc_source.id
  availability_zone = "us-east-2b"
  cidr_block = "102.0.1.0/24"
  tags = {
    Name = "DMSSubnet2-Source"
  }
}

resource "aws_default_security_group" "source-default" {

  vpc_id      = aws_vpc.dmsvpc_source.id
  ingress {
    from_port        = 1521
    to_port          = 1521
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }
}

# Create source database

resource "aws_db_instance" "mapsskinner" {
  allocated_storage = 10
  max_allocated_storage    = 100
  engine               = "oracle-se2"
  engine_version       = "12.1.0.2.v2"
  instance_class       = "db.m5.large"
  name                 = "MAPS"
  username             = "admin"
  password             = "foobarbaz"
  parameter_group_name = "default.oracle-se2-12.1"
  skip_final_snapshot  = true

  license_model = "license-included"
  port = 1521
  auto_minor_version_upgrade = false
  copy_tags_to_snapshot = true

}

# Create EC2 instance to access source database

resource "aws_instance" "dmsclient-source" {
  subnet_id = aws_subnet.dmssubnet1-source.id
  ami = "ami-0231217be14a6f3ba"
  instance_type = "t2.xlarge"
  tags = {
    Name = "DMSClient-Source"
  }

}

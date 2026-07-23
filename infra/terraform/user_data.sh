#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker git

systemctl enable --now docker
usermod -aG docker ec2-user

mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# convenience symlink
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

mkdir -p /opt
if [ ! -d /opt/playground/.git ]; then
  git clone ${repo_url} /opt/playground
fi

cd /opt/playground
git fetch origin
git reset --hard origin/main

# prod compose: no live frontend mount, MySQL not published publicly
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

cat >/etc/motd <<'EOF'
Playground EC2
  Frontend: port 5173
  API:      port 8080
  App path: /opt/playground
EOF

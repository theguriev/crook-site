#!/usr/bin/env bash
#
# Deploys the site to the server.
#
#   scripts/deploy.sh                # sync the working tree, build there, roll over
#   scripts/deploy.sh --status       # what is running; changes nothing
#   scripts/deploy.sh --logs         # deploy, then follow the container's logs
#   HOST=root@other DOMAIN=x.y scripts/deploy.sh
#
# The host runs several unrelated projects behind one shared nginx-proxy that
# owns :80 and :443 (see /root/edge there). This script never touches that
# proxy, never publishes a host port, and keeps the site under its own compose
# project (`crook`), so a mistake here cannot reach anyone else's containers,
# volumes or certificates. Joining the proxy is two environment variables in
# docker-compose.prod.yml; the certificate is issued by the proxy's companion
# the first time the container comes up under a name that resolves to the host.
#
# The image is built on the server from a synced checkout rather than pulled
# from a registry: nothing to publish, nothing to authenticate, and the server
# has the CPU to spare. The build is a plain `docker build`, not `compose
# build` — the host's buildx is older than compose v5 insists on.
set -euo pipefail

HOST="${HOST:-root@blls.me}"
DOMAIN="${DOMAIN:-crook.id}"
REMOTE_DIR="${REMOTE_DIR:-/opt/crook-site}"
ACME_EMAIL="${ACME_EMAIL:-gurievcreative@gmail.com}"
IMAGE="crook-site:latest"
COMPOSE="docker compose -f docker-compose.prod.yml"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cyan=$'\033[36m'; green=$'\033[32m'; yellow=$'\033[33m'; red=$'\033[31m'; off=$'\033[0m'
step() { printf '%s==>%s %s\n' "$cyan" "$off" "$1"; }
ok()   { printf '%s  ok%s %s\n' "$green" "$off" "$1"; }
warn() { printf '%s  !!%s %s\n' "$yellow" "$off" "$1"; }
die()  { printf '%s fail%s %s\n' "$red" "$off" "$1" >&2; exit 1; }

remote() { ssh -o BatchMode=yes "$HOST" "$@"; }

case "${1:-}" in
  --status)
    step "What is running as project 'crook' on $HOST"
    remote "cd $REMOTE_DIR/src 2>/dev/null && $COMPOSE ps" || warn "not deployed yet"
    exit 0
    ;;
  --logs) TAIL_LOGS=1 ;;
  "") ;;
  *) die "unknown option: $1" ;;
esac

step "Checking the connection"
remote true || die "cannot ssh to $HOST"
ok "$HOST reachable"

# The shared proxy network has to exist; creating it is a one-time host action
# and it is external to every compose project, including ours.
remote "docker network inspect edge >/dev/null 2>&1" \
  || die "the 'edge' network is missing on the host — the shared nginx-proxy uses it"
ok "shared proxy network present"

# Let's Encrypt validates over http on the domain, so until the A record points
# here the container would come up fine and the certificate would fail, quietly,
# with the proxy answering on a default cert. Cheaper to say so now.
step "Checking that $DOMAIN points at $HOST"
server_ip=$(remote "curl -s -4 --max-time 8 https://api.ipify.org || hostname -I | awk '{print \$1}'")
resolve() { getent ahostsv4 "$1" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' '; }
for name in "$DOMAIN" "www.$DOMAIN"; do
  ips=$(resolve "$name")
  case " $ips " in
    *" $server_ip "*) ok "$name → $server_ip" ;;
    *) warn "$name resolves to '${ips:-nothing}', the server is $server_ip"
       dns_wrong=1 ;;
  esac
done
if [ -n "${dns_wrong:-}" ]; then
  if [ -n "${FORCE:-}" ]; then
    warn "FORCE set, deploying anyway — the certificate will fail until DNS moves"
  else
    die "fix the A records first (or FORCE=1 to deploy without a working certificate)"
  fi
fi

step "Syncing the source to $REMOTE_DIR/src"
remote "mkdir -p $REMOTE_DIR/src"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env*' \
  --exclude '.claude' \
  -e 'ssh -o BatchMode=yes' \
  "$here/" "$HOST:$REMOTE_DIR/src/"
ok "source in place"

# Domain and contact live in the server's .env, read by compose. Written on
# every deploy so a DOMAIN= override here is what the container gets.
remote "printf 'DOMAIN=%s\nACME_EMAIL=%s\n' '$DOMAIN' '$ACME_EMAIL' > $REMOTE_DIR/src/.env"

step "Building the image on the server"
# Tagged twice: the rollover below runs :latest, and the commit tag is what you
# `docker run` if a deploy needs to be walked back by hand.
sha=$(git -C "$here" rev-parse --short HEAD 2>/dev/null || echo manual)
remote "cd $REMOTE_DIR/src && docker build -q -t $IMAGE -t crook-site:$sha . >/dev/null" \
  || die "the build failed — run it on the server without -q to see why"
ok "$IMAGE ($sha)"

step "Rolling over"
remote "cd $REMOTE_DIR/src && $COMPOSE up -d --remove-orphans"

step "Waiting for https://$DOMAIN/healthz"
for attempt in $(seq 1 30); do
  if curl -sf --max-time 5 "https://$DOMAIN/healthz" >/dev/null 2>&1; then
    ok "answering after $((attempt * 5))s"
    healthy=1
    break
  fi
  # A first deploy is also waiting on Let's Encrypt.
  sleep 5
done

if [ -z "${healthy:-}" ]; then
  warn "no answer on https yet — on a new domain the certificate can take a minute or two"
  remote "cd $REMOTE_DIR/src && $COMPOSE ps"
  remote "cd $REMOTE_DIR/src && $COMPOSE logs --tail 30 web"
  remote "docker logs --tail 20 nginx-proxy-acme 2>&1 | grep -iE '$DOMAIN|error' || true"
  exit 1
fi

# Old images pile up one per deploy; keep the last few tags, drop the dangling.
remote "docker image prune -f >/dev/null 2>&1 || true"

if [ -n "${TAIL_LOGS:-}" ]; then
  remote "cd $REMOTE_DIR/src && $COMPOSE logs -f --tail 50"
fi

printf '\n%sDeployed%s https://%s\n' "$green" "$off" "$DOMAIN"

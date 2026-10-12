FROM node:24.21.0-bookworm AS build

WORKDIR /app

ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_PROGRESS=false
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_FETCH_TIMEOUT=600000

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Git Bash on Windows rewrites a bare `/api` argument into `C:/Program Files/Git/api`. Reject such a
# value here and scan the bundle below, so a wrong build fails instead of shipping a broken login.
RUN case "${VITE_API_URL}" in     /*|http://*|https://*) ;;     *) echo "VITE_API_URL='${VITE_API_URL}' must be a path starting with / or an http(s) URL. On Windows Git Bash set MSYS_NO_PATHCONV=1 or omit --build-arg." >&2; exit 1 ;;   esac

RUN npm run build:production

RUN if grep -rEl '[A-Za-z]:/(Program Files|Users|Windows)' dist; then     echo "Windows path found in the production bundle (see files above)." >&2; exit 1;   fi

FROM nginx:alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=12 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null 2>&1 || exit 1

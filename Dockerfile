# Usa a imagem oficial do Node baseada em Alpine (leve e otimizada)
FROM node:22-alpine AS base

# Fase 1: Instalação de dependências
FROM node:22-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copia apenas os arquivos de lock para cache eficiente
COPY package.json package-lock.json* ./
# Recomenda-se npm ci para builds precisos
RUN npm ci

# Fase 2: Build da aplicação (Next.js Standalone)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Você deve ter `output: "standalone"` configurado em next.config.ts
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"
RUN npx prisma generate
RUN npm run build

# Fase 3: Produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Setando permissões e copiando arquivos do standalone
COPY --from=builder /app/public ./public

# Configura as pastas que o nextjs precisa para funcionar em modo standalone
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiando outputs do build process automático `output: "standalone"`
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]

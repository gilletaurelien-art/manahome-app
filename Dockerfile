# Service `app` du docker-compose : le front reste statique (Caddy), ce
# service ne porte que l'API (/api/*) — santé et lecture publique.
# ⭐ Le build installe SES dépendances (app/package.json), pas celles du
# front : un conteneur ne doit jamais embarquer le node_modules d'un autre.
FROM node:20-alpine
WORKDIR /service
COPY app/package.json ./
RUN npm install --omit=dev
COPY app/ ./
ENV PORT=3000
USER node
CMD ["node", "serveur.mjs"]

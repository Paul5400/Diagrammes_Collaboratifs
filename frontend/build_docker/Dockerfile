FROM node:20-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Linting et formatage (optionnel pour CI/CD)
# RUN npm run lint && npm run format

# Copie du code source
COPY . .

# Exposition du port Next.js
EXPOSE 3000

# Variable d'environnement Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Démarrage en mode développement
CMD ["npm", "run", "dev"]

# Configuration du Projet PASAD - React SPA + Laravel + PostgreSQL

## ✅ Étapes Complétées

1. **Frontend (React SPA)**
   - ✅ React 18 + ReactDOM installés
   - ✅ React Router DOM installé
   - ✅ Vite configuré avec Laravel Plugin
   - ✅ Point d'entrée SPA: `resources/js/app.jsx`
   - ✅ Vue Blade racine: `resources/views/app.blade.php`
   - ✅ Routes SPA: `resources/js/router.jsx`
   - ✅ Build Vite testé et fonctionnel ✓

2. **Backend (Laravel API)**
   - ✅ Laravel 11 avec structure API
   - ✅ Authentification configurée
   - ✅ Clé APP générée
   - ✅ Routes API prêtes: `routes/api.php`

3. **Base de Données**
   - ✅ PostgreSQL configuré dans `.env`
   - ✅ Connexion: `pgsql`
   - ✅ Hôte: `127.0.0.1:5432`
   - ✅ BDD: `pasad` (à créer)

## 🚀 Prochaines Étapes

### 1. **Démarrer PostgreSQL**
```bash
# Linux/Ubuntu
sudo systemctl start postgresql

# Vérifier le status
sudo systemctl status postgresql
```

### 2. **Créer la base de données**
```bash
sudo -u postgres psql -c "CREATE DATABASE pasad OWNER postgres;"

# Ou via PHP artisan
php artisan migrate
```

### 3. **Lancer le serveur de développement**

#### Terminal 1: Serveur Laravel (API + SSR)
```bash
php artisan serve
# Disponible à: http://localhost:8000
```

#### Terminal 2: Watcher Vite (rebuild CSS/JS)
```bash
npm run dev
```

### 4. **Accéder à l'application**
- **Application SPA**: http://localhost:8000
- **API Laravel**: http://localhost:8000/api/*

## 📁 Structure du Projet

```
PASAD/
├── app/                    # Logique métier Laravel
│   ├── Http/Controllers/   # API Controllers
│   ├── Models/             # Eloquent Models
│   └── Providers/          # Service Providers
├── resources/
│   ├── js/
│   │   ├── app.jsx         # Point d'entrée React (racine)
│   │   ├── router.jsx      # Routeur React (SPA routes)
│   │   ├── App.jsx         # Composant App principal
│   │   └── components/     # Composants React (à créer)
│   ├── css/
│   │   └── app.css         # Styles globaux
│   └── views/
│       └── app.blade.php   # Vue Blade SSR pour la SPA
├── routes/
│   ├── web.php             # Routes web (SPA catch-all)
│   └── api.php             # Routes API (JSON)
├── database/
│   ├── migrations/         # Schéma BDD
│   ├── factories/          # Model Factories
│   └── seeders/            # Seeders
├── config/
│   └── database.php        # Config PostgreSQL
├── vite.config.js          # Config build Vite
├── package.json            # Dépendances NPM
├── composer.json           # Dépendances PHP
└── .env                    # Variables d'environnement
```

## 🔧 Configuration Détaillée

### PostgreSQL (.env)
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pasad
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

### Vite + Laravel
- Entry point: `resources/js/app.jsx`
- Manifest: `public/build/manifest.json`
- Build output: `public/build/`

### Session
```
SESSION_DRIVER=database    # Sessions dans BDD
SESSION_LIFETIME=120       # 2 heures
```

## 📝 Commandes Utiles

```bash
# Créer une migration
php artisan make:migration create_table_name --create=table_name

# Lancer les migrations
php artisan migrate

# Créer un modèle + migration + contrôleur
php artisan make:model ModelName -mrc

# Lancer les tests
php artisan test

# Nettoyer les caches
php artisan optimize:clear
```

## 🐛 Dépannage

### Problème: `SQLSTATE[08006]` - PostgreSQL non accessible
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Démarrer PostgreSQL
sudo systemctl start postgresql
```

### Problème: Port 8000 déjà utilisé
```bash
php artisan serve --port=8001
```

### Problème: Erreur lors de npm run dev
```bash
npm install
npm run dev
```

## 🎯 Prochaines Fonctionnalités à Ajouter

- [ ] Authentification JWT ou Sanctum
- [ ] CORS configuré pour API
- [ ] Modèles Eloquent (User, etc.)
- [ ] Composants React réutilisables
- [ ] Formulaires avec validation
- [ ] Tests unitaires et e2e
- [ ] Documentation API (Laravel Scribe)

---

**Date**: 2026-06-22  
**Version**: Laravel 11 + React 18 + PostgreSQL 15+

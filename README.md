# TodoList — Déploiement Kubernetes

**Participants :**
- Axel GILBERT
- Virgile CAUJOLLE
- Max MENGERINGHAUSEN

---

## Description de l'application

TodoList est une application web de gestion de tâches avec authentification JWT. Elle permet à chaque utilisateur de créer un compte, se connecter, et gérer ses tâches personnelles (créer, compléter, supprimer).

### Stack technique

| Composant | Technologie |
|-----------|------------|
| Frontend | SvelteKit 2 + Tailwind CSS |
| Backend | FastAPI (Python 3.11) |
| Base de données | PostgreSQL 14 |
| Auth | JWT (HS256) |

---

## Architecture Kubernetes

```
                    ┌─────────────────────────────────────────┐
                    │           Namespace: todolist            │
                    │                                         │
  Navigateur ──────►│  frontend-service (NodePort :30300)     │
                    │         │                               │
                    │  ┌──────▼──────┐                        │
                    │  │  frontend   │ Deployment (2 replicas) │
                    │  │  pod        │ SvelteKit :3000         │
                    │  └──────┬──────┘                        │
                    │         │ HTTP /api/*                    │
                    │  ┌──────▼──────────┐                    │
                    │  │ backend-service │ ClusterIP :8000     │
                    │  └──────┬──────────┘                    │
                    │         │                               │
                    │  ┌──────▼──────┐                        │
                    │  │  backend    │ Deployment (2 replicas) │
                    │  │  pod        │ FastAPI :8000           │
                    │  └──────┬──────┘                        │
                    │         │ SQL                           │
                    │  ┌──────▼──────────┐                    │
                    │  │ postgres-service│ ClusterIP :5432     │
                    │  └──────┬──────────┘                    │
                    │         │                               │
                    │  ┌──────▼──────┐                        │
                    │  │  postgres   │ StatefulSet (1 replica) │
                    │  │  pod        │ PostgreSQL :5432        │
                    │  └──────┬──────┘                        │
                    │         │                               │
                    │  ┌──────▼──────┐                        │
                    │  │    PVC      │ PersistentVolumeClaim   │
                    │  │   (1 Gi)    │ /var/lib/postgresql     │
                    │  └─────────────┘                        │
                    │                                         │
                    │  ┌─────────────┐  ┌──────────────────┐  │
                    │  │   Secrets   │  │   ConfigMap      │  │
                    │  │ (passwords) │  │ (config non-sens)│  │
                    │  └─────────────┘  └──────────────────┘  │
                    └─────────────────────────────────────────┘
```

### Objets Kubernetes utilisés

| Objet | Rôle |
|-------|------|
| **Namespace** | Isoler toutes les ressources dans un espace dédié `todolist` |
| **Secret** | Stocker les données sensibles (mot de passe BDD, clé JWT) chiffrées en base64 |
| **ConfigMap** | Stocker la configuration non-sensible (nom BDD, algorithme JWT) |
| **StatefulSet** | Déployer PostgreSQL avec un stockage persistant garanti |
| **PersistentVolumeClaim** | Réserver 1Gi de disque pour les données PostgreSQL |
| **Deployment** | Déployer le backend et le frontend avec 2 replicas chacun |
| **Service ClusterIP** | Exposer backend et PostgreSQL en interne au cluster |
| **Service NodePort** | Exposer le frontend vers l'extérieur sur le port 30300 |

---

## Prérequis

- Docker Desktop avec Kubernetes activé (ou Minikube)
- `kubectl` configuré pour pointer vers votre cluster
- `docker` pour construire les images

Vérifier que kubectl fonctionne :
```bash
kubectl cluster-info
```

---

## Déploiement

### 1. Tester en local avec Docker Compose (optionnel)

```bash
docker-compose up --build
# Frontend : http://localhost:3000
# Backend API : http://localhost:8000/docs
```

### 2. Construire les images Docker

```bash
docker build -t todolist-backend:latest ./backend
docker build -t todolist-frontend:latest ./frontend
```

Si vous utilisez Minikube, charger les images dans son registre :
```bash
minikube image load todolist-backend:latest
minikube image load todolist-frontend:latest
```

### 3. Déployer sur Kubernetes

```bash
kubectl apply -f k8s/
```

Vérifier que tout est en ordre :
```bash
kubectl get all -n todolist
```

### 4. Accéder à l'application

Avec Docker Desktop :
```
http://localhost:30300
```

Avec Minikube :
```bash
minikube service frontend-service -n todolist
```

---

## Structure du projet

```
.
├── backend/                 # API FastAPI (Python)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── core/config.py   # Configuration via variables d'environnement
│       ├── db/init_db.py    # Connexion SQLAlchemy
│       ├── models/          # Modèles SQLAlchemy (User, Todo)
│       ├── schemas/         # Schémas Pydantic (validation)
│       └── api/endpoints/   # Routes FastAPI (auth, todos)
├── frontend/                # App SvelteKit + Tailwind CSS
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── lib/api.ts       # Client HTTP vers le backend
│       ├── lib/stores.ts    # State management (token, user)
│       └── routes/          # Pages SvelteKit
├── k8s/                     # Manifests Kubernetes
│   ├── 00-namespace.yaml
│   ├── 01-secrets.yaml      # Données sensibles (base64)
│   ├── 02-configmap.yaml    # Configuration non-sensible
│   ├── 03-postgres.yaml     # StatefulSet + PVC + Service
│   ├── 04-backend.yaml      # Deployment + Service
│   └── 05-frontend.yaml     # Deployment + NodePort Service
├── docker-compose.yml       # Pour test local uniquement
└── README.md
```

---

## Sécurité

- Les mots de passe et clés secrètes sont dans des **Secrets Kubernetes**, jamais dans les images Docker ni dans le code source.
- La base de données n'est exposée que via un **Service ClusterIP** — inaccessible depuis l'extérieur.
- En production, les Secrets devraient être gérés par un outil dédié (HashiCorp Vault, Kubernetes Sealed Secrets).
- La clé JWT dans `01-secrets.yaml` doit être remplacée par une valeur aléatoire forte : `openssl rand -base64 32`.

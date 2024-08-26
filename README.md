# 🚀 API de Mise à Jour
Cette API vous permet d'accéder aux différentes versions de votre application à travers plusieurs canaux de déploiement. Que vous soyez sur un canal stable, bêta, ou canary, cette API vous aide à gérer et télécharger les fichiers nécessaires pour mettre à jour votre application.


## 📋 Récupérer la Liste des Canaux de Déploiement

**Endpoint** : `GET /api/updates/channels`

```json
[
    "stable",
    "banneds",
    "canary"
]
```

**Description** : Cet endpoint retourne la liste de tous les canaux de déploiement disponibles.


## 📂 Obtenir la liste des fichiers depuis Canal Spécifique

**Endpoint** : `GET /api/updates/channel/:channelName`

```json
[
    {
        "url": "main.js",
        "hash": "cb2860ce54ffecbbea36767d9106448b6aba6e4ba735ea13a825d6041ac72849"
    },
    {
        "url": "index.html",
        "hash": "3f786850e387550fdab836ed7e6dc881de23001b"
    }
]
```

**Description** : Récupérez la liste des fichiers disponibles dans un canal spécifique. Vous devez spécifier le ``channelName`` dans l'URL, comme ``stable``, ``beta``, ou ``canary``. Si vous tenter d'accéder à un canal soumis à une whitelist, vous devrez précisé l'`HWID` dans le body de votre requête

**⚠️ Erreurs possibles :**

- `403 Forbidden` : Vous n'êtes pas autorisé à utiliser ce canal.
- `422 Unprocessable Entity` : Le HWID est manquant dans la requête mais est requis.


## 📥 Télécharger un Fichier d'un Canal Spécifique

**Endpoint** : `GET /api/updates/channel/:channelName/download/:filePath`

**Réponse en cas de succès :** Envoi du fichier

**Exemple de Réponse en Cas d'Erreur :**

```json
{
    "error": {
        "code": 404,
        "message": "File not found or removed"
    },
    "skip": false,
    "actions": [
        "remove"
    ]
}
```

**Description** : Utilisez cet endpoint pour télécharger un fichier spécifique depuis un canal de déploiement.

**⚠️ Erreurs possibles :**

- `403 Forbidden` : Vous n'êtes pas autorisé à télécharger ce fichier.
- `404 Not Found` : Le fichier est introuvable ou a été supprimé.
- `422 Unprocessable Entity` : Le HWID est manquant dans la requête mais est requis.


## 🔒 Gestion des Canaux Restreints

Certains canaux, comme "banned", ont des restrictions spéciales. Si un utilisateur tente d'accéder à ce canal, il sera redirigé vers une version spéciale des fichiers.

**👉 Important :** Si un canal contient un fichier `whitelist.json`, seuls les utilisateurs avec un HWID présent dans la whitelist pourront accéder aux fichiers de ce canal. Cela permet de sécuriser les versions de pré-déploiement, comme celles du canal `canary` ou `beta`.


## 🌟 Remarque

L'API utilise des `HWID` pour identifier les utilisateurs. Cela permet de restreindre l'accès à certains canaux de déploiement ou fichiers, garantissant que seules les personnes autorisées peuvent effectuer certaines mises à jour.
 

N'hésitez pas à explorer ces endpoints pour gérer efficacement les mises à jour de votre application et à utiliser les informations renvoyées pour sécuriser et contrôler les déploiements selon vos besoins ! 🎉

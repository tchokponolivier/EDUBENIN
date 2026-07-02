# Product Requirements Document (PRD) : EduBénin (Advanced Specification)

## 1. Introduction & Vision
**Nom du produit :** EduBénin (Portail National Scolaire)
**Objectif :** Fournir une plateforme centralisée et intuitive permettant de faciliter la gestion scolaire pour trois acteurs principaux : l'Administration de l'école, les Professeurs, et les Parents d'élèves.
**Technologies & Stack technique :** 
- **Frontend :** React 18+ (TypeScript), Vite, Tailwind CSS (Utility-first styling).
- **Icônes :** Lucide-React.
- **Backend & Authentification :** Supabase (PostgreSQL, Auth Google/OAuth, Row Level Security).
- **Graphiques :** Recharts.
- **Mobile :** Capacitor.js (Génération d'APK Android à partir du build web).

**Plateformes de déploiement :** 
- **Web :** Déploiement CI/CD via GitHub + Vercel ou Netlify (ou Cloud Run).
- **Mobile :** Application Android packagée via Capacitor.

---

## 2. Design System & UI/UX Guidelines
Pour garantir la reproductibilité exacte du design sur d'autres environnements, voici les règles strictes d'UI/UX :

*   **Couleurs (Palette Tailwind) :**
    *   **Primaire (Marque) :** `emerald-600` (`#059669`) pour les actions principales, focus, et branding.
    *   **Surfaces :** `slate-50` (`#f8fafc`) pour le fond de l'application, `white` (`#ffffff`) pour les cartes et conteneurs.
    *   **Texte :** `slate-900` (`#0f172a`) pour les titres, `slate-700` (`#334155`) pour le texte standard, `slate-500` (`#64748b`) pour les métadonnées.
    *   **Erreur/Alerte :** `red-500` pour les erreurs, `amber-500` pour les alertes.
*   **Typographie :**
    *   Police standard sans-serif (Inter par défaut via Tailwind).
    *   Les titres utilisent une graisse `font-bold` ou `font-black` avec un espacement `tracking-tight` ou `tracking-wide` selon le contexte.
*   **Espacements et Formes :**
    *   Utilisation intensive de `rounded-xl` et `rounded-2xl` pour un aspect moderne et doux.
    *   Ombres légères : `shadow-sm` sur les cartes, `shadow-md` sur les survols (hover).
    *   Bordures subtiles : `border border-slate-200` sur toutes les surfaces blanches.
*   **Composants structurels :**
    *   `DashboardLayout` : Barre de navigation latérale (Sidebar) sur Desktop (`w-64`), cachée sur mobile avec un menu Burger ouvrant un tiroir (Slide-over).
    *   `LoadingSkeleton` : Squelette de chargement "Pulse" global affiché pendant le fetch initial des données Supabase, simulant le header et la structure de grille.

---

## 3. Modèle de Données (Database Schema - Supabase)
Pour reproduire le projet, vous devez créer ces tables dans Supabase (avec Row Level Security) :

1.  **users** (gérée via `auth.users` de Supabase + table de profil liée)
    *   `id` (uuid, primary key)
    *   `email` (string)
    *   `role` (enum: 'SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT')
    *   `full_name` (string)
2.  **students**
    *   `id` (uuid), `parent_id` (uuid -> users.id)
    *   `first_name`, `last_name`, `birth_date`, `birth_place`
    *   `level` (string: classe), `previous_school` (string)
3.  **payments**
    *   `id` (uuid), `student_id` (uuid), `parent_id` (uuid)
    *   `amount` (number), `status` (enum: 'PENDING', 'VALIDATED')
    *   `created_at` (timestamp)
4.  **announcements**
    *   `id` (uuid), `title`, `content`, `created_at`
5.  **school_settings**
    *   `id` (uuid), `name`, `logo_url`, `enrollment_contract_template`

---

## 4. Fonctionnalités par Rôle

### 4.0. Authentification (Supabase Google Auth)
*   **Flux de connexion :** Bouton "Continuer avec Google". Utilise `supabase.auth.signInWithOAuth({ provider: 'google' })`.
*   **Process de configuration Supabase :**
    1. Créer un projet sur [supabase.com](https://supabase.com).
    2. Aller dans **Authentication > Providers > Google**.
    3. Configurer le Client ID et le Client Secret obtenus depuis la **Google Cloud Console** (API & Services > Credentials > OAuth 2.0 Client IDs).
    4. Ajouter l'URL de l'application (ex: localhost:3000 ou URL Vercel) dans les **Redirect URLs** (Authentication > URL Configuration) de Supabase. Sans cela, vous obtiendrez l'erreur *"403: You do not have access to this page"*.
    5. Copier `Project URL` et `anon key` dans un fichier `.env` (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).

### 4.1. Espace Parent (PARENT)
*   **Accueil :** Carrousel d'annonces de l'école.
*   **Mes Enfants :** Affichage des enfants liés à ce parent (`parent_id`). Possibilité de télécharger le contrat de scolarisation généré dynamiquement.
*   **Inscription :** Formulaire complet pour ajouter un nouvel enfant.
*   **Paiement :** Interface avec bouton d'action lançant un lien USSD (`tel:*880*41*681199*montant#`) sur mobile pour payer via Mobile Money au Bénin.

### 4.2. Espace Administration (ADMIN)
*   **Gestion des élèves :** Grille des classes, liste filtrable avec barre de recherche (recherche en temps réel par nom ou ID).
*   **Paramètres :** Éditeur de la "Fiche d'engagement / Contrat de scolarisation" avec utilisation de variables dynamiques (`{ecole_nom}`, `{parent_nom}`, etc.). Upload du logo de l'école (converti en Base64 ou stocké dans Supabase Storage).
*   **Statistiques :** Graphiques générés avec Recharts (PieChart, BarChart) utilisant `ResponsiveContainer` pour s'adapter à la largeur.

### 4.3. Espace Professeur (TEACHER)
*   Saisie adaptative des notes (Lettres pour la Maternelle, Chiffres pour Primaire/Secondaire).

---

## 5. Guide de Déploiement Complet (Étape par Étape)

### Étape 1 : Déploiement Web (GitHub + Vercel/Netlify)
1.  **Initialiser Git :**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/votre-nom/edubenin.git
    git push -u origin main
    ```
2.  **Déployer sur Vercel :**
    *   Créez un compte sur [vercel.com](https://vercel.com) et connectez votre GitHub.
    *   Importez le dépôt `edubenin`.
    *   Dans **Environment Variables**, ajoutez :
        *   `VITE_SUPABASE_URL` = (Votre URL Supabase)
        *   `VITE_SUPABASE_ANON_KEY` = (Votre clé anonyme Supabase)
    *   Cliquez sur **Deploy**.

### Étape 2 : Configuration de Google Auth
1.  Allez sur Google Cloud Console.
2.  Créez des identifiants OAuth. Dans **Authorized redirect URIs**, ajoutez : `https://<votre-projet>.supabase.co/auth/v1/callback`
3.  Dans Supabase (Authentication > Providers > Google), activez Google et collez les identifiants.
4.  Dans Supabase (Authentication > URL Configuration), ajoutez l'URL Vercel finale (ex: `https://edubenin.vercel.app`) à la liste des **Site URLs** ou **Redirect URLs**.

### Étape 3 : Déploiement Mobile Android (Capacitor)
L'application est configurée avec Capacitor pour générer un fichier `.apk`.
1.  **Générer le build de production web :**
    ```bash
    npm run build
    ```
2.  **Synchroniser Capacitor avec le build web :**
    ```bash
    npx cap sync android
    ```
3.  **Ouvrir dans Android Studio (Option 1) :**
    ```bash
    npx cap open android
    ```
    *   Dans Android Studio, attendez la fin de la synchronisation Gradle.
    *   Allez dans **Build > Build Bundle(s) / APK(s) > Build APK(s)** pour générer le fichier `.apk`.
4.  **Construire en ligne de commande (Option 2 - nécessite le SDK Android) :**
    ```bash
    cd android
    ./gradlew assembleDebug
    ```
    *   Le fichier APK se trouvera dans `android/app/build/outputs/apk/debug/app-debug.apk`.
5.  **Important pour Capacitor & Google Auth :** Sur mobile, l'authentification OAuth redirige vers le navigateur puis doit revenir à l'application. Assurez-vous d'utiliser `@supabase/supabase-js` avec le bon gestionnaire de redirection Capacitor (`@supabase/supabase-js` + App URL schemes).

---

## 6. Architecture des Fichiers (Reférence)
*   `/src/App.tsx` : Routeur principal + `LoadingSkeleton` + Vérifications Auth.
*   `/src/lib/supabase.ts` : Client Supabase initié avec les variables d'environnement.
*   `/src/lib/auth.tsx` : Contexte gérant `supabase.auth.onAuthStateChange`, l'état `isLoading`, et le Fallback.
*   `/src/pages/` : Contient toutes les vues par rôle (`SchoolAdmin.tsx`, `Parent.tsx`, etc.).
*   `/capacitor.config.ts` : Fichier de configuration de Capacitor pointant vers le dossier `dist/`.
*   `.env` : Contient les clés API (ne pas commiter).

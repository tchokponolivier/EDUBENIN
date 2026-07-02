# Product Requirements Document (PRD) : EduBénin

## 1. Introduction
**Nom du produit :** EduBénin (Portail National Scolaire)
**Objectif :** Fournir une plateforme centralisée et intuitive permettant de faciliter la gestion scolaire pour trois acteurs principaux : l'Administration de l'école, les Professeurs, et les Parents d'élèves.
**Technologies cibles :** React (TypeScript), Tailwind CSS, Vite, Lucide-React pour les icônes, **Supabase** pour la base de données et l'authentification (Google Auth).
**Plateformes de déploiement :** Web (Hébergement en ligne via GitHub/Vercel/Cloud Run) et Mobile (Application Android via Capacitor/PWA).

## 2. Utilisateurs Cibles et Rôles (Personas)
1. **Parent d'élève :** Souhaite inscrire ses enfants, payer la scolarité, voir les annonces, et consulter les relevés/emplois du temps. Se connecte avec son compte Gmail (Google Auth).
2. **Professeur :** Doit saisir les notes de ses élèves, paramétrer les matières selon le niveau (Maternelle, Primaire, Secondaire), et générer les relevés de notes. Se connecte avec Google Auth.
3. **Administrateur (Directeur/Secrétariat) :** Supervise l'école, gère les inscriptions, encaisse les paiements, envoie des annonces, et contacte les parents. Se connecte avec Google Auth.

## 3. Fonctionnalités par Rôle

### 3.0. Authentification
*   **Connexion via Google (Gmail) :** Les utilisateurs s'authentifient en un clic via leur compte Google.
*   **Gestion des rôles :** Assignation automatique ou manuelle des rôles (Admin, Professeur, Parent) après la connexion dans Supabase.

### 3.1. Espace Parent
*   **Tableau de bord (Accueil) :**
    *   Affichage d'un carrousel dynamique d'annonces publiées par l'école (défilement avec indicateurs à points cliquables).
    *   Liste des enfants inscrits avec accès rapide à leur emploi du temps, leur carnet de correspondance, et leur bulletin de notes.
*   **Inscription d'un enfant :**
    *   Formulaire complet : informations de l'enfant (nom, prénom, photo avec prévisualisation, date/lieu de naissance, ancienne école), informations des parents/tuteurs, options (cantine), engagement disciplinaire.
*   **Paiement de Scolarité :**
    *   Interface de paiement avec récapitulatif des frais.
    *   Intégration d'un paiement USSD Mobile Money dynamique (ex: `*880*41*681199*montant#`) déclenchant l'ouverture automatique du clavier d'appel sur mobile.
    *   Historique des paiements avec téléchargement de reçus.
*   **Prospectus :**
    *   Affichage et possibilité de télécharger le prospectus ou règlement intérieur de l'école.
*   **Support & Contact :**
    *   Formulaire de contact pour envoyer un message à l'administration, avec possibilité d'ajouter une photo (ex: pour justifier une absence ou un certificat médical).

### 3.2. Espace Professeur
*   **Tableau de Bord / Gestion des Notes :**
    *   Sélection de la classe pour afficher la liste des élèves correspondants.
    *   **Gestion des matières :** Capacité d'ajouter dynamiquement des matières/domaines et leurs coefficients. Pré-configuration automatique pour la Maternelle (Langage & Comm, Motricité, Éveil).
    *   **Saisie des notes adaptative :**
        *   Maternelle : Saisie sous forme de lettres (A, ECA, NA).
        *   Primaire/Secondaire : Notes numériques (ex: sur 10 ou sur 20).
    *   Saisie de l'appréciation globale par l'enseignant pour chaque élève.
    *   Cases à cocher pour sélectionner les élèves à inclure dans le relevé de notes final.
    *   Génération et impression des relevés de notes (impression navigateur `window.print`).
*   **Profil du Professeur :**
    *   Modification des informations personnelles (bio, matière principale, coordonnées).
    *   Upload et modification de la photo de profil.

### 3.3. Espace Administration de l'École
*   **Gestion des Élèves :**
    *   Vue filtrable par classe (grille de sélection de classe affichant les effectifs).
    *   Liste des élèves avec moteur de recherche.
    *   Actions par élève : Édition (Statut, Réduction sur la scolarité) et Suppression.
    *   Exportation des données des parents (Nom, Contact, Relation) au format CSV pour communication.
*   **Suivi des Paiements (Finance) :**
    *   Validation manuelle ou automatique des paiements initiés par les parents.
    *   Tableau de bord financier (total recouvré, reste à payer).
*   **Statistiques (Vue d'ensemble) :**
    *   Indicateurs de performance : effectifs totaux, répartition par classe, taux de présence, paiements.
*   **Paramètres & Annonces :**
    *   Création d'annonces diffusées directement sur le tableau de bord des parents.

## 4. Spécifications Techniques et UX/UI
*   **Architecture :** 
    *   `DashboardLayout.tsx` gère le menu latéral de l'application.
    *   Sur mobile, utilisation d'un bouton "Menu/Burger" à côté de la déconnexion pour ouvrir un panneau coulissant ou un overlay avec navigation.
*   **Design System :**
    *   Approche "Mobile-First" avec Tailwind CSS.
    *   Thématique couleur : dominante "Émeraude" (Emerald-600) pour souligner un aspect fiable, moderne et propice à l'apprentissage.
    *   Interface sobre, espacée avec des éléments "Card" et des arrondis (rounded-xl, rounded-2xl).
*   **Persistance de données :** Base de données locale/simulée (`db.ts`) avec classes/fonctions génériques pour manipuler : Students, Payments, Announcements, Settings, Users.

## 5. Cas d'Usage Principaux à Tester (Acceptance Criteria)
1. Un parent sans enfant doit être redirigé vers un "empty state" l'invitant à inscrire son enfant.
2. Le paiement d'un parent sur appareil mobile lance le clavier téléphonique avec le bon code USSD de Mobile Money.
3. Les annonces s'affichent correctement en carrousel horizontal avec des "dots" de défilement pour les parents.
4. L'administration peut cliquer sur une classe (ex: "CI") et exporter la liste des contacts des parents de cette classe en `.csv`.
5. Un professeur désignant une classe de "Maternelle" voit l'interface s'adapter sans coefficients complexes, optant pour des mentions (A, ECA, NA).
6. Le menu de navigation mobile doit disparaître ou se replier lorsque l'utilisateur sélectionne un onglet ou clique sur la croix "Fermer".

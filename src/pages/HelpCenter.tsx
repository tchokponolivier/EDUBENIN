import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  HelpCircle,
  Search,
  BookOpen,
  LayoutDashboard,
  CreditCard,
  FileSpreadsheet,
  Clock,
  ArrowDownToLine,
  Banknote,
  Users,
  Shield,
  Award,
  Megaphone,
  Database,
  Settings,
  UserCheck,
  Calendar,
  AlertCircle,
  FileText,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Printer,
  Sparkles,
  Info,
  Check,
  Eye,
  Plus,
  RefreshCw,
  Phone,
  MessageCircle,
  FolderLock,
  Building
} from "lucide-react";

interface TabGuideItem {
  id: string;
  tabTitle: string;
  tabBadge: string;
  appRoute: string;
  icon: any;
  purpose: string;
  howToSteps: string[];
  tipsAndRules: string[];
  faqs?: { q: string; a: string }[];
}

interface ProfileGuide {
  roleKey: string;
  title: string;
  subtitle: string;
  icon: any;
  badgeColor: string;
  quickSummary: string;
  tabs: TabGuideItem[];
}

export function HelpCenterPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const tabParam = searchParams.get("tab");
  
  // Default selected role is role from URL, user's current role, or SCHOOL_ADMIN fallback
  const [selectedRole, setSelectedRole] = useState<string>(
    roleParam || user?.role || "SCHOOL_ADMIN"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    if (roleParam) {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  // Scroll to tab if specified in URL
  useEffect(() => {
    if (tabParam) {
      setTimeout(() => {
        const el = document.getElementById(`tab-item-${tabParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);
    }
  }, [tabParam, selectedRole]);

  const guides: ProfileGuide[] = useMemo(() => [
    {
      roleKey: "SCHOOL_ADMIN",
      title: "Directeur & Administrateur",
      subtitle: "Gestion globale de l'établissement, finances, inscriptions et configurations",
      icon: Shield,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      quickSummary: "En tant que Directeur d'établissement, vous supervisez l'ensemble des modules : finances, inscriptions des élèves, corps professoral, grille des frais de scolarité et sauvegardes de sécurité.",
      tabs: [
        {
          id: "dashboard",
          tabTitle: "Tableau de Bord Général",
          tabBadge: "Navigation Tableau de bord",
          appRoute: "/school-admin",
          icon: LayoutDashboard,
          purpose: "Offre une vision panoramique et instantanée des effectifs, de la trésorerie globale, du nombre de classes actives et des dernières inscriptions réalisées.",
          howToSteps: [
            "1. Consultez les cartes KPI supérieures pour connaître le total des élèves inscrits et le cumul des recettes de l'année.",
            "2. Visualisez le tableau des inscriptions récentes pour vérifier les nouveaux dossiers validés.",
            "3. Utilisez la barre de recherche rapide pour retrouver un élève par nom ou matricule."
          ],
          tipsAndRules: [
            "Le montant des recettes affiché se met à jour automatiquement après chaque validation en caisse.",
            "Consultez ce tableau de bord chaque matin pour contrôler l'activité générale de votre école."
          ]
        },
        {
          id: "fees",
          tabTitle: "Frais de Scolarité & Grille Tarifaire",
          tabBadge: "Tab Frais de scolarité",
          appRoute: "/school-admin?tab=FEES",
          icon: CreditCard,
          purpose: "Configuration complète des tarifs par classe (inscriptions nouveaux/anciens, scolarité, tranches 1/2/3, cantine, TD, uniformes, etc.) avec modification directe sous forme de tableau (tableur).",
          howToSteps: [
            "1. Accédez à la vue 'Tableau Général' pour visualiser toutes les classes et colonnes de frais.",
            "2. Modifiez directement les montants dans chaque cellule. Lorsque vous modifiez la Tranche 1, 2 ou 3, le montant total de la Scolarité se calcule automatiquement.",
            "3. Ajouter un frais supplémentaire : Cliquez sur '+ Ajouter d'autres frais', saisissez l'intitulé (ex: Frais de dossier, Assurance, Sortie pédagogique) et le type (Obligatoire ou Optionnel). Une nouvelle colonne est instantanément créée.",
            "4. Renommer un frais : Survolez l'en-tête de la colonne et cliquez sur le crayon pour modifier le libellé à votre convenance.",
            "5. Reconduire depuis l'année précédente : Sélectionnez l'année passée dans le menu déroulant et cliquez sur 'Reconduire' pour ne modifier que les écarts.",
            "6. Cliquez sur 'Sauvegarder les modifications' pour enregistrer définitivement la grille."
          ],
          tipsAndRules: [
            "Le renommage des frais et les colonnes personnalisées sont conservés pour votre école.",
            "Vous pouvez basculer à tout moment entre le 'Tableau Général' et la 'Vue par Catégorie' selon vos préférences."
          ]
        },
        {
          id: "financial_list",
          tabTitle: "Liste Financière & Grand Livre",
          tabBadge: "Tab Liste Financière",
          appRoute: "/school-admin/payments?tab=FINANCIAL_LIST",
          icon: FileSpreadsheet,
          purpose: "Grand livre comptable certifié présentant l'historique complet et détaillé des flux financiers : Recettes encaissées, Salaires du personnel et Charges d'exploitation.",
          howToSteps: [
            "1. Consultez les 3 blocs de catégories distinctes : Recettes par poste (Tranches, Inscriptions, Cantine...), Salaires par fonction (Professeurs, Direction, Gardiennage...) et Dépenses par type.",
            "2. Filtrage précis : Utilisez les listes à choix multiples avec cases à cocher pour filtrer par classe(s), par catégorie précise sans jumelage (ex: 1ère tranche uniquement), par mode de paiement et par statut.",
            "3. Exclusion des transactions refusées : Par défaut, seules les vérifications validées et encaissées s'affichent. Les rejets sont exclus. Cochez 'Transactions Refusées / Rejetées' pour les examiner spécifiquement.",
            "4. Téléchargement : Cliquez sur 'Télécharger Liste Complète (PDF)' pour obtenir le document officiel prêt pour l'inspection, ou sur 'Exporter Excel / CSV' pour l'analyse tableur."
          ],
          tipsAndRules: [
            "Le graphique comparatif des flux présente des intitulés droits horizontaux pour une lecture agréable et directe.",
            "Vous pouvez sélectionner manuellement des lignes spécifiques à télécharger via les cases à cocher de la première colonne."
          ]
        },
        {
          id: "daily_summary",
          tabTitle: "Caisse du Jour & Clôture",
          tabBadge: "Tab Caisse du Jour",
          appRoute: "/school-admin/payments?tab=DAILY_SUMMARY",
          icon: Clock,
          purpose: "Contrôle journalier des encaissements physiques et électroniques reçus au guichet pour clôturer la journée comptable.",
          howToSteps: [
            "1. Sélectionnez la date souhaitée (par défaut la date d'aujourd'hui).",
            "2. Vérifiez le montant total en espèces dans votre caisse physique par rapport au montant affiché.",
            "3. Contrôlez les versements Mobile Money (MTN, Moov, Celtiis) et virements bancaires du jour.",
            "4. Cliquez sur 'Imprimer le Point du Jour' pour archiver le bordereau signé."
          ],
          tipsAndRules: [
            "Indispensable pour éviter tout écart de trésorerie entre le caissier et la direction."
          ]
        },
        {
          id: "creances",
          tabTitle: "Créances & Suivi des Impayés",
          tabBadge: "Tab Créances",
          appRoute: "/school-admin/payments?tab=CREANCES",
          icon: AlertCircle,
          purpose: "Détection des élèves débiteurs, dates limites d'échéances dépassées, calcul des restes à payer et relance des familles.",
          howToSteps: [
            "1. Activez le bouton 'Filtrer uniquement les retards' pour isoler les élèves dont la date limite de tranche est échue.",
            "2. Filtrez par classe spécifique grâce aux filtres pertinents à cases à cocher.",
            "3. Cliquez sur un élève pour consulter le détail de ses impayés.",
            "4. Cliquez sur l'icône WhatsApp pour envoyer un SMS/message de relance pré-rédigé contenant le montant exact impayé.",
            "5. Cliquez sur 'Télécharger Créances (PDF)' ou 'Exporter Excel / CSV' pour obtenir l'état complet des créances."
          ],
          tipsAndRules: [
            "Le taux de recouvrement global s'ajuste en temps réel au fur et à mesure des encaissements."
          ]
        },
        {
          id: "students",
          tabTitle: "Inscriptions & Dossiers Élèves",
          tabBadge: "Tab Inscriptions",
          appRoute: "/school-admin/students?tab=STUDENTS",
          icon: Users,
          purpose: "Admission des nouveaux élèves, constitution du dossier scolaire et attribution des classes.",
          howToSteps: [
            "1. Cliquez sur 'Nouvel Élève'.",
            "2. Renseignez l'état civil, les contacts des parents et le niveau.",
            "3. Enregistrez pour générer le matricule scolaire officiel."
          ],
          tipsAndRules: ["Le numéro du parent permet le suivi et le paiement par Mobile Money."]
        },
        {
          id: "students_list",
          tabTitle: "Annuaire & Liste Complète des Élèves",
          tabBadge: "Navigation Liste des Élèves",
          appRoute: "/school-admin/students-list",
          icon: Users,
          purpose: "Recherche d'élèves, consultation des effectifs par classe, impression des listes de présence et exports Excel.",
          howToSteps: [
            "1. Filtrez par classe ou promotion.",
            "2. Imprimez la liste d'appel pour le corps enseignant.",
            "3. Exportez les données au format Excel pour les dépôts d'examens."
          ],
          tipsAndRules: ["Les fiches individuelles peuvent être imprimées en 1 clic."]
        },
        {
          id: "teachers",
          tabTitle: "Corps Professoral & Affectations",
          tabBadge: "Navigation Professeurs",
          appRoute: "/school-admin/teachers",
          icon: Users,
          purpose: "Gestion des enseignants, attribution des matières enseignées et des classes affectées.",
          howToSteps: [
            "1. Créez un profil professeur avec son email et sa matière principale.",
            "2. Cochez les classes dans lesquelles il intervient.",
            "3. L'enseignant aura alors accès à ces classes pour saisir les notes."
          ],
          tipsAndRules: ["Permet le calcul automatisé des volumes horaires hebdomadaires."]
        },
        {
          id: "stats",
          tabTitle: "Synthèse & Bilans Statistiques",
          tabBadge: "Navigation Synthèse & Bilans",
          appRoute: "/school-admin/stats",
          icon: BookOpen,
          purpose: "Tableaux de bord statistiques sur les effectifs, la démographie scolaire et les taux de recouvrement financier.",
          howToSteps: [
            "1. Analysez la répartition des élèves par série et niveau.",
            "2. Suivez le taux d'encaissement global de l'année.",
            "3. Imprimez le rapport de synthèse pour les conseils d'administration."
          ],
          tipsAndRules: ["Mise à jour en temps réel à chaque encaissement."]
        },
        {
          id: "prospectus",
          tabTitle: "Prospectus de l'École",
          tabBadge: "Navigation Prospectus",
          appRoute: "/school-admin/prospectus",
          icon: BookOpen,
          purpose: "Plaquette officielle de l'établissement visible par les parents d'élèves : présentation, corps professoral, grille des tarifs, photos des infrastructures.",
          howToSteps: [
            "1. Cliquez sur 'Modifier le prospectus'.",
            "2. Mettez à jour les textes des sections (Mot de bienvenue, Conditions d'admission...).",
            "3. Téléversez des photos de vos locaux ou activités scolaires.",
            "4. Cliquez sur 'Enregistrer les modifications'. Les images sont conservées de façon permanente même après rafraîchissement ou déconnexion."
          ],
          tipsAndRules: [
            "Les parents peuvent télécharger cette brochure en format PDF imprimable depuis leur espace."
          ]
        },
        {
          id: "backup",
          tabTitle: "Sauvegarde & Restauration",
          tabBadge: "Navigation Sauvegarde",
          appRoute: "/school-admin?tab=BACKUP",
          icon: Database,
          purpose: "Sécurisation intégrale des données de votre école. Permet d'exporter l'historique complet en un fichier JSON et de restaurer ou importer les données à volonté.",
          howToSteps: [
            "1. Sauvegarde complète : Cliquez sur 'Télécharger la Sauvegarde Complète (JSON)'. Un fichier horodaté contenant élèves, paiements, dépenses, salaires, prospectus et configurations est téléchargé sur votre ordinateur.",
            "2. Sauvegarde par tableau : Vous pouvez aussi exporter individuellement les élèves, dépenses ou paiements au format CSV.",
            "3. Restauration / Importation : Cliquez sur 'Sélectionner un fichier de sauvegarde (.json)', choisissez votre fichier, vérifiez l'aperçu du contenu et confirmez l'importation."
          ],
          tipsAndRules: [
            "Effectuez une sauvegarde complète à chaque fin de mois ou avant toute modification massive de tarifs."
          ]
        },
        {
          id: "announcements",
          tabTitle: "Annonces & Communications",
          tabBadge: "Tab Annonces",
          appRoute: "/school-admin?tab=ANNOUNCEMENTS",
          icon: Megaphone,
          purpose: "Diffusion d'informations officielles, convocations de réunions et alertes à l'attention des parents ou des professeurs de votre école.",
          howToSteps: [
            "1. Renseignez le titre du communiqué.",
            "2. Sélectionnez le public cible (Parents, Professeurs ou Tout le monde).",
            "3. Rédigez le message et cliquez sur 'Publier'.",
            "4. La publication est immédiatement distribuée aux comptes de votre école et déclenche une notification sonore et visuelle."
          ],
          tipsAndRules: [
            "Les annonces restent visibles sur l'espace d'accueil des parents et des enseignants jusqu'à leur suppression."
          ]
        },
        {
          id: "members",
          tabTitle: "Membres & Invitations",
          tabBadge: "Tab Membres & Invitations",
          appRoute: "/school-admin?tab=MEMBERS",
          icon: UserCheck,
          purpose: "Gestion de l'équipe pédagogique et administrative. Attribution des rôles d'accès à l'application.",
          howToSteps: [
            "1. Saisissez l'adresse email de la personne à inviter.",
            "2. Sélectionnez son rôle : Directeur des Études, Enseignant, Caissier, Secrétaire ou Surveillant.",
            "3. Cliquez sur 'Inviter'. L'utilisateur reçoit ses identifiants pour se connecter à votre établissement."
          ],
          tipsAndRules: [
            "Vous pouvez révoquer un accès à tout moment depuis la liste des collaborateurs actifs."
          ]
        },
        {
          id: "settings",
          tabTitle: "Paramètres Établissement",
          tabBadge: "Tab Paramètres Établissement",
          appRoute: "/school-admin?tab=SETTINGS",
          icon: Settings,
          purpose: "Configuration de l'identité officielle de l'école (Nom, adresse, devise, téléphone, logo et signature numérique pour les reçus et bulletins).",
          howToSteps: [
            "1. Mettez à jour les informations administratives et coordonnées.",
            "2. Téléversez le logo de l'établissement.",
            "3. Signez numériquement dans la zone de signature prévue pour que vos documents officiels soient authentifiés.",
            "4. Cliquez sur 'Enregistrer les paramètres'."
          ],
          tipsAndRules: [
            "Ces données apparaissent sur l'entête officiel béninois de tous les reçus de paiement et bilans financiers."
          ]
        }
      ]
    },
    {
      roleKey: "CASHIER",
      title: "Caissier & Comptable",
      subtitle: "Encaissements, vérification des paiements en ligne, créances, dépenses et salaires",
      icon: Banknote,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      quickSummary: "En tant que caissier, votre rôle est d'assurer la gestion de la caisse physique, de valider les règlements initiés en ligne par les parents, d'enregistrer les paiements au guichet, de suivre les créances et de payer les dépenses autorisées.",
      tabs: [
        {
          id: "dashboard",
          tabTitle: "Tableau de Bord Caisse",
          tabBadge: "Tab Tableau de bord Caisse",
          appRoute: "/school-admin/payments?tab=DASHBOARD",
          icon: LayoutDashboard,
          purpose: "Synthèse chiffrée de la journée comptable : encaissements récents, règlements en attente et prévisions.",
          howToSteps: [
            "1. Consultez les KPIs de trésorerie le matin.",
            "2. Surveillez le compteur de vérifications en attente.",
            "3. Basculez vers l'onglet requis d'un clic."
          ],
          tipsAndRules: ["Affiche uniquement les flux de votre établissement scolaire."]
        },
        {
          id: "financial_list",
          tabTitle: "Liste Financière & Grand Livre",
          tabBadge: "Tab Liste Financière",
          appRoute: "/school-admin/payments?tab=FINANCIAL_LIST",
          icon: FileSpreadsheet,
          purpose: "Contrôle certifié des écritures comptables : Recettes encaissées, Salaires et Charges avec filtres avancés.",
          howToSteps: [
            "1. Utilisez les filtres multi-sélection pour isoler un flux ou une classe.",
            "2. Vérifiez que les transactions refusées ne sont pas prises en compte dans le total.",
            "3. Téléchargez le relevé au format PDF certifié ou Excel."
          ],
          tipsAndRules: ["Les graphiques comparatifs affichent des libellés horizontaux lisibles."]
        },
        {
          id: "verifications",
          tabTitle: "Vérifications des Paiements En Ligne",
          tabBadge: "Tab Vérifications",
          appRoute: "/school-admin/payments?tab=VERIFICATION",
          icon: CreditCard,
          purpose: "Contrôle des règlements par Mobile Money ou virement effectués par les parents depuis leur portail.",
          howToSteps: [
            "1. Consultez la liste des transactions 'En attente de vérification'.",
            "2. Vérifiez sur votre téléphone de caisse (ou relevé bancaire) la réception effective des fonds correspondant à la référence et au montant affichés.",
            "3. Si l'argent est bien reçu : Cliquez sur le bouton vert 'Valider le paiement'. La transaction est confirmée, le reçu est émis et l'argent est comptabilisé dans les recettes.",
            "4. Si la référence est fausse ou le montant non reçu : Cliquez sur 'Rejeter'. La transaction passe en statut 'Refusé'. Elle n'est PAS encaissée et ne pollue pas la comptabilité officielle."
          ],
          tipsAndRules: [
            "Une transaction rejetée ne rentre jamais dans vos totaux de recettes encaissées.",
            "Le parent d'élève reçoit instantanément une notification lorsque son paiement est validé."
          ]
        },
        {
          id: "payments",
          tabTitle: "Encaissements au Guichet (Nouveau Paiement)",
          tabBadge: "Tab Encaissements",
          appRoute: "/school-admin/payments?tab=PAYMENTS",
          icon: CreditCard,
          purpose: "Enregistrement direct des versements effectués en mains propres à la caisse par les parents ou tuteurs.",
          howToSteps: [
            "1. Recherchez l'élève par son nom ou son matricule.",
            "2. Sélectionnez le ou les frais à payer (Tranche 1, Tranche 2, Scolarité, Inscription, Cantine, Tenue...).",
            "3. Saisissez le montant perçu et le mode de règlement (Espèces, Mobile Money, Chèque, Virement).",
            "4. Validez l'encaissement et imprimez immédiatement le reçu officiel en double exemplaire."
          ],
          tipsAndRules: [
            "Le reçu porte un numéro de série unique ainsi que le tampon et la signature officielle configurés."
          ]
        },
        {
          id: "daily_summary",
          tabTitle: "Caisse du Jour & Rapprochement",
          tabBadge: "Tab Caisse du Jour",
          appRoute: "/school-admin/payments?tab=DAILY_SUMMARY",
          icon: Clock,
          purpose: "Point quotidien de la trésorerie et rapprochement des espèces en fin de service.",
          howToSteps: [
            "1. Ouvrez l'onglet en fin de journée de travail.",
            "2. Vérifiez le total espèces encaissé et comptez les billets et pièces de votre caisse.",
            "3. Vérifiez les montants MTN/Moov/Celtiis.",
            "4. Imprimez la fiche journalière et faites-la viser par le directeur."
          ],
          tipsAndRules: [
            "Conservez toujours les bordereaux journaliers signés dans votre classeur de caisse."
          ]
        },
        {
          id: "creances",
          tabTitle: "Créances & Relances",
          tabBadge: "Tab Créances",
          appRoute: "/school-admin/payments?tab=CREANCES",
          icon: AlertCircle,
          purpose: "Inventaire des sommes restant dues par élève et relance rapide des parents débiteurs.",
          howToSteps: [
            "1. Utilisez les filtres déroulants pour cibler une classe précise.",
            "2. Consultez la colonne 'Reste à Payer' et le badge 'Échéance Dépassée'.",
            "3. Cliquez sur l'icône WhatsApp pour envoyer un SMS/message de relance pré-rédigé contenant le montant exact impayé.",
            "4. Téléchargez la liste en PDF ou CSV pour les réunions de recouvrement."
          ],
          tipsAndRules: [
            "Le filtre 'Retards uniquement' vous donne instantanément la liste prioritaire des débiteurs."
          ]
        },
        {
          id: "expenses",
          tabTitle: "Dépenses d'Exploitation",
          tabBadge: "Tab Dépenses",
          appRoute: "/school-admin/payments?tab=EXPENSES",
          icon: ArrowDownToLine,
          purpose: "Enregistrement des sorties d'argent pour le fonctionnement (fournitures, eau, électricité, travaux, carburant...).",
          howToSteps: [
            "1. Cliquez sur 'Ajouter une dépense' ou modifiez directement dans le tableau des dépenses.",
            "2. Renseignez la date, la catégorie, le bénéficiaire et le montant décaissé.",
            "3. Joignez la photo ou le scan de la facture/justificatif.",
            "4. Cliquez sur le justificatif pour l'agrandir en plein écran afin de vérifier sa conformité."
          ],
          tipsAndRules: [
            "Toute dépense doit impérativement comporter un justificatif visé par la direction."
          ]
        },
        {
          id: "salaries",
          tabTitle: "Salaires & Rémunérations",
          tabBadge: "Tab Salaires",
          appRoute: "/school-admin/payments?tab=SALARIES",
          icon: Banknote,
          purpose: "Gestion et règlement des paies des professeurs et du personnel d'appui.",
          howToSteps: [
            "1. Sélectionnez le mois concerné.",
            "2. Modifiez les montants ou primes dans le tableau dédié aux salaires.",
            "3. Marquez l'état 'Payé' une fois le virement ou le paiement en espèces exécuté.",
            "4. Imprimez la fiche de paie individuelle ou l'état d'émargement global."
          ],
          tipsAndRules: [
            "Les salaires sont distinctement séparés des charges courantes dans le grand livre comptable."
          ]
        }
      ]
    },
    {
      roleKey: "SECRETARY",
      title: "Secrétaire Administratif",
      subtitle: "Accueil, inscriptions, gestion des dossiers élèves, courriers, attestations et planning",
      icon: FileText,
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      quickSummary: "Le secrétariat assure l'enregistrement des nouveaux élèves, l'édition des certificats officiels, le suivi des correspondances scolaires, le pointage administratif des dossiers et les emplois du temps.",
      tabs: [
        {
          id: "enrollment",
          tabTitle: "Inscriptions & Gestion des Dossiers",
          tabBadge: "Tab Inscriptions",
          appRoute: "/school-admin/students?tab=STUDENTS",
          icon: Users,
          purpose: "Création des fiches élèves pour la rentrée ou les transferts d'élèves en cours d'année.",
          howToSteps: [
            "1. Renseignez l'état civil de l'élève (Nom, Prénom, Date et lieu de naissance, Sexe).",
            "2. Attribuez la classe d'accueil (ex: 6ème A, Seconde CD).",
            "3. Renseignez avec soin les contacts des parents (Téléphone, Profession, Email).",
            "4. Validez l'enregistrement. L'élève reçoit un matricule automatique et apparaît dans l'annuaire de l'école."
          ],
          tipsAndRules: [
            "Le contact téléphonique du parent est crucial pour lui permettre de recevoir les SMS de relance et de se connecter."
          ]
        },
        {
          id: "students_list",
          tabTitle: "Annuaire & Liste des Élèves",
          tabBadge: "Navigation Liste des Élèves",
          appRoute: "/school-admin/students-list",
          icon: Users,
          purpose: "Recherche rapide, consultation des effectifs par classe et impression des listes de présence.",
          howToSteps: [
            "1. Filtrez par niveau ou classe pour afficher les élèves correspondants.",
            "2. Cliquez sur 'Imprimer la liste' pour remettre une liste de présence au surveillant ou au professeur principal.",
            "3. Ouvrez la fiche d'un élève pour imprimer un certificat de fréquentation ou une attestation d'inscription."
          ],
          tipsAndRules: [
            "Vous pouvez exporter les listes de classe au format Excel pour les dépôts d'examens officiels."
          ]
        },
        {
          id: "teachers",
          tabTitle: "Corps Professoral & Contacts",
          tabBadge: "Navigation Professeurs",
          appRoute: "/school-admin/teachers",
          icon: Users,
          purpose: "Consultation du répertoire des enseignants et de leurs disponibilités.",
          howToSteps: [
            "1. Retrouvez les coordonnées d'un professeur.",
            "2. Vérifiez ses classes d'affectation pour orienter les parents d'élèves."
          ],
          tipsAndRules: ["Facilite la prise de rendez-vous avec les familles."]
        },
        {
          id: "hr",
          tabTitle: "Personnel & Ressources Humaines",
          tabBadge: "Tab Personnel & RH",
          appRoute: "/school-admin/students?tab=HR",
          icon: Users,
          purpose: "Suivi des fiches d'embauche, contrats de travail et coordonnées du personnel non-enseignant.",
          howToSteps: [
            "1. Enregistrez les nouveaux collaborateurs administratifs et techniques.",
            "2. Mettez à jour les coordonnées téléphoniques et adresses.",
            "3. Consultez l'organigramme de l'école."
          ],
          tipsAndRules: ["Base documentaire partagée avec le service financier pour les salaires."]
        },
        {
          id: "absences",
          tabTitle: "Absences & Retards des Élèves",
          tabBadge: "Tab Absences",
          appRoute: "/school-admin/students?tab=ABSENCES",
          icon: Clock,
          purpose: "Centralisation des relevés d'absences et archivage des justificatifs médicaux transmis par les parents.",
          howToSteps: [
            "1. Enregistrez les certificats médicaux ou mots d'excuse déposés au secrétariat.",
            "2. Transmettez la confirmation au Surveillant Général.",
            "3. Pointez les régularisations sur le registre informatisé."
          ],
          tipsAndRules: ["Permet de garder une trace écrite de chaque justification."]
        },
        {
          id: "documents",
          tabTitle: "Attestations, Documents & Cartes Scolaires",
          tabBadge: "Tab Documents",
          appRoute: "/school-admin/students?tab=DOCUMENTS",
          icon: FileText,
          purpose: "Délivrance rapide des certificats de scolarité, attestations de radiation, billets d'entrée et cartes d'élèves.",
          howToSteps: [
            "1. Sélectionnez le modèle de document désiré (Certificat de scolarité, Certificat de radiation, Billet d'entrée).",
            "2. Recherchez l'élève concerné.",
            "3. Générez le document pré-rempli aux armes de l'école et imprimez-le pour signature."
          ],
          tipsAndRules: [
            "Le document intègre automatiquement le logo et les informations officielles de l'établissement."
          ]
        },
        {
          id: "mails",
          tabTitle: "Registre des Courriers (Arrivées / Départs)",
          tabBadge: "Tab Courriers",
          appRoute: "/school-admin/students?tab=MAILS",
          icon: FileText,
          purpose: "Enregistrement chronologique de la correspondance officielle reçue ou expédiée par l'école.",
          howToSteps: [
            "1. Attribuez un numéro d'ordre chrono à chaque lettre reçue.",
            "2. Renseignez l'expéditeur, l'objet et la date d'arrivée.",
            "3. Archivez la copie numérique pour consultation par la direction."
          ],
          tipsAndRules: ["Garantit la traçabilité des échanges administratifs."]
        },
        {
          id: "exams",
          tabTitle: "Organisation des Examens & Épreuves",
          tabBadge: "Tab Épreuves",
          appRoute: "/school-admin/students?tab=EXAMS",
          icon: BookOpen,
          purpose: "Tirage des sujets, répartition des salles d'examen et préparation du matériel pour les devoirs surveillés.",
          howToSteps: [
            "1. Consultez le planning des examens blancs ou devoirs de synthèse.",
            "2. Préparez le tirage des épreuves en nombre suffisant.",
            "3. Éditez les listes d'émargement de chaque salle d'examen."
          ],
          tipsAndRules: ["Conservez les sujets sous pli scellé jusqu'à l'heure de l'épreuve."]
        },
        {
          id: "planning",
          tabTitle: "Planning des Salles & Emplois du Temps",
          tabBadge: "Tab Planning",
          appRoute: "/school-admin/students?tab=PLANNING",
          icon: Calendar,
          purpose: "Consultation et affichage des emplois du temps des classes et occupation des laboratoires et salles spécialisées.",
          howToSteps: [
            "1. Sélectionnez la promotion souhaitée.",
            "2. Imprimez la grille hebdomadaire pour affichage dans la classe.",
            "3. Vérifiez la disponibilité d'une salle pour des cours de soutien ou des réunions."
          ],
          tipsAndRules: ["Évite les chevauchements d'horaires et de cours."]
        }
      ]
    },
    {
      roleKey: "SUPERVISOR",
      title: "Surveillant Général",
      subtitle: "Discipline, pointage des absences, autorisations de sortie, matériel et suppléances",
      icon: ShieldAlert,
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      quickSummary: "Le Surveillant Général veille au respect du règlement intérieur, au contrôle strict des présences, à la gestion des billets de sortie et à la notification des sanctions disciplinaires.",
      tabs: [
        {
          id: "discipline",
          tabTitle: "Discipline & Registre des Sanctions",
          tabBadge: "Tab Discipline",
          appRoute: "/supervisor?tab=DISCIPLINE",
          icon: ShieldAlert,
          purpose: "Enregistrement des manquements (retards répétés, insolence, absence injustifiée) et suivi des mesures disciplinaires.",
          howToSteps: [
            "1. Recherchez l'élève fautif par nom ou matricule.",
            "2. Sélectionnez le motif et le type de sanction (Avertissement, Blâme, Heures de retenue, Exclusion temporaire).",
            "3. Renseignez la description des faits et la date d'exécution.",
            "4. Enregistrez : La sanction est inscrite au dossier de l'élève et peut être imprimée pour signature des parents."
          ],
          tipsAndRules: [
            "Un historique disciplinaire clair permet d'éclairer le conseil de classe en fin de trimestre."
          ]
        },
        {
          id: "absences",
          tabTitle: "Absences Élèves & Billets d'Entrée",
          tabBadge: "Tab Absences Élèves",
          appRoute: "/supervisor?tab=ABSENCES",
          icon: Clock,
          purpose: "Enregistrement des absences constatées et émission des billets de rentrée en classe après justification.",
          howToSteps: [
            "1. Pointez les élèves absents signalés par les délégués ou les fiches d'appel.",
            "2. Au retour de l'élève, vérifiez le motif (certificat médical, mot des parents).",
            "3. Délivrez le billet d'entrée en classe justifié."
          ],
          tipsAndRules: [
            "Les absences répétées non justifiées déclenchent une alerte au niveau de la direction."
          ]
        },
        {
          id: "trips",
          tabTitle: "Sorties & Mouvements Exceptionnels",
          tabBadge: "Tab Sorties & Mouvements",
          appRoute: "/supervisor?tab=TRIPS",
          icon: Building,
          purpose: "Contrôle des sorties d'élèves pendant les heures de cours (maladie, urgence familiale).",
          howToSteps: [
            "1. Délivrez une autorisation de sortie précisant l'heure et le motif.",
            "2. Notez le nom de l'accompagnateur ou du parent venu chercher l'élève.",
            "3. Pointez l'heure de retour éventuelle."
          ],
          tipsAndRules: [
            "Aucun élève ne doit franchir le portail sans billet de sortie signé du surveillant."
          ]
        },
        {
          id: "teacher_absences",
          tabTitle: "Absences des Professeurs & Suppléances",
          tabBadge: "Tab Absences Profs",
          appRoute: "/supervisor?tab=TEACHER_ABSENCES",
          icon: Users,
          purpose: "Pointage des cours non dispensés et organisation immédiate de la surveillance des élèves en salle d'étude.",
          howToSteps: [
            "1. Enregistrez les professeurs absents signalés dès la première heure.",
            "2. Prévenez le délégué de classe et orientez les élèves vers la permanence.",
            "3. Transmettez la fiche au Directeur des Études pour programmer le rattrapage."
          ],
          tipsAndRules: ["Assure la sécurité et le calme dans les couloirs."]
        },
        {
          id: "materials",
          tabTitle: "Matériel Scolaire & Inventaire Mobilier",
          tabBadge: "Tab Matériel",
          appRoute: "/supervisor?tab=MATERIALS",
          icon: BookOpen,
          purpose: "Contrôle de l'état des tables-bancs, des tableaux de classe et du matériel d'éducation physique.",
          howToSteps: [
            "1. Effectuez la ronde d'inspection des salles en fin de semaine.",
            "2. Notez les réparations de menuiserie à effectuer.",
            "3. Enregistrez les dotations en craies, marqueurs et fournitures de surveillance."
          ],
          tipsAndRules: ["La préservation du mobilier scolaire réduit les charges d'exploitation de l'école."]
        }
      ]
    },
    {
      roleKey: "DIRECTOR_OF_STUDIES",
      title: "Directeur des Études (Censeur)",
      subtitle: "Planification académique, encadrement pédagogique, gestion des notes et bulletins",
      icon: Award,
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      quickSummary: "Le Directeur des Études coordonne les activités pédagogiques : calendrier scolaire, découpage des trimestres, contrôle de la saisie des notes, génération des bulletins officiels et suivi des professeurs.",
      tabs: [
        {
          id: "academic",
          tabTitle: "Planification Académique & Trimestres",
          tabBadge: "Navigation Planification Académique",
          appRoute: "/director",
          icon: Calendar,
          purpose: "Configuration des périodes scolaires, gestion des trimestres, coefficients des matières et barèmes d'évaluation.",
          howToSteps: [
            "1. Définissez les dates de début et de fin de chaque trimestre.",
            "2. Paramétrez les coefficients officiels par filière (Série A, B, C, D, Premier Cycle).",
            "3. Fixez la date limite de transmission des notes aux enseignants."
          ],
          tipsAndRules: [
            "La bonne configuration des coefficients garantit le calcul exact des moyennes pondérées."
          ]
        },
        {
          id: "bulletins",
          tabTitle: "Bulletins de Notes Officiels",
          tabBadge: "Navigation Bulletins",
          appRoute: "/director/bulletins",
          icon: Award,
          purpose: "Génération, contrôle et impression des bulletins scolaires trimestriels pour chaque classe avec moyennes, rangs et appréciations.",
          howToSteps: [
            "1. Sélectionnez la classe et le trimestre désiré.",
            "2. Vérifiez que toutes les notes des professeurs sont saisies et validées.",
            "3. Cliquez sur 'Calculer les moyennes et rangs'. Le système calcule automatiquement la moyenne générale de chaque élève ainsi que le rang de la classe.",
            "4. Renseignez l'appréciation globale du conseil de classe pour les élèves concernés.",
            "5. Cliquez sur 'Imprimer les bulletins de la classe' pour générer le lot de bulletins complet prêts à être signés et remis aux parents."
          ],
          tipsAndRules: [
            "Les bulletins respectent les normes officielles du Ministère des Enseignements du Bénin.",
            "Vous pouvez exporter les bulletins au format PDF individuel ou groupé."
          ]
        },
        {
          id: "teachers",
          tabTitle: "Corps Professoral & Affectations",
          tabBadge: "Navigation Professeurs",
          appRoute: "/school-admin/teachers",
          icon: Users,
          purpose: "Attribution des matières et des classes aux différents enseignants de l'établissement.",
          howToSteps: [
            "1. Consultez la liste des professeurs en exercice.",
            "2. Ouvrez la fiche d'un professeur pour lui affecter ses classes (ex: Mathématiques en 3ème A et 4ème B).",
            "3. Le professeur aura alors accès à ces classes dans son espace pour y renseigner ses notes."
          ],
          tipsAndRules: [
            "Un même cours peut être dispensé par plusieurs enseignants sur des divisions différentes."
          ]
        },
        {
          id: "announcements",
          tabTitle: "Annonces & Notes de Service",
          tabBadge: "Navigation Annonces",
          appRoute: "/director/announcements",
          icon: Megaphone,
          purpose: "Diffusion des consignes d'examens blancs, dates de conseils de professeurs et convocations.",
          howToSteps: [
            "1. Saisissez le titre et le corps de la note de service.",
            "2. Ciblez les professeurs ou l'ensemble de l'établissement.",
            "3. Publiez l'annonce qui sera immédiatement notifiée aux destinataires."
          ],
          tipsAndRules: [
            "Idéal pour rappeler les dates limites de remise des épreuves et des notes."
          ]
        }
      ]
    },
    {
      roleKey: "TEACHER",
      title: "Enseignant / Professeur",
      subtitle: "Gestion de vos classes, saisie des notes d'évaluations et suivi pédagogique",
      icon: BookOpen,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      quickSummary: "En tant qu'enseignant, votre espace personnel vous permet d'accéder à la liste de vos élèves pour chaque classe attribuée et d'y enregistrer les notes d'interrogations, devoirs surveillés et examens.",
      tabs: [
        {
          id: "classes_notes",
          tabTitle: "Mes Classes & Saisie des Notes",
          tabBadge: "Navigation Mes Classes & Notes",
          appRoute: "/teacher",
          icon: BookOpen,
          purpose: "Saisie et consultation des notes d'évaluations (Interrogations écrites, Devoirs surveillés n°1 et n°2) par classe et par matière.",
          howToSteps: [
            "1. Choisissez votre classe dans la liste de vos classes affectées (ex: 3ème M1).",
            "2. Sélectionnez le trimestre en cours ainsi que le type d'évaluation (Interrogation 1, Interrogation 2, Devoir Surveillé).",
            "3. Saisissez directement les notes sur 20 pour chaque élève de la liste.",
            "4. Vérifiez les saisies puis cliquez sur 'Enregistrer et Valider les Notes'.",
            "5. Les moyennes partielles et générales sont instantanément actualisées pour le bulletin."
          ],
          tipsAndRules: [
            "Si un élève était absent justifié, vous pouvez cocher la mention 'Absence Justifiée'.",
            "Vous pouvez modifier une note tant que la période n'a pas été verrouillée par la Direction des Études."
          ]
        },
        {
          id: "prospectus",
          tabTitle: "Prospectus de l'École",
          tabBadge: "Navigation Prospectus",
          appRoute: "/teacher/prospectus",
          icon: BookOpen,
          purpose: "Consultation du projet d'établissement, des règlements et du calendrier officiel de l'école.",
          howToSteps: [
            "1. Ouvrez le prospectus pour consulter les directives pédagogiques de l'année.",
            "2. Téléchargez la brochure en PDF si nécessaire."
          ],
          tipsAndRules: ["Contient les informations clés pour les réunions de parents."]
        },
        {
          id: "profile",
          tabTitle: "Profil & Renseignements Personnels",
          tabBadge: "Navigation Mon Profil",
          appRoute: "#settings",
          icon: Users,
          purpose: "Mise à jour de vos coordonnées professionnelles, numéro de téléphone et mot de passe de connexion.",
          howToSteps: [
            "1. Cliquez sur 'Mon Profil' en bas de la barre latérale.",
            "2. Mettez à jour votre nom ou numéro de téléphone.",
            "3. Modifiez votre mot de passe pour garantir la confidentialité de vos saisies de notes."
          ],
          tipsAndRules: [
            "Ne communiquez jamais votre mot de passe pour préserver l'intégrité des notes d'évaluations."
          ]
        }
      ]
    },
    {
      roleKey: "PARENT",
      title: "Parent d'Élève",
      subtitle: "Suivi de la scolarité de vos enfants, paiement des frais par Mobile Money et reçus",
      icon: Users,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      quickSummary: "L'espace Parent vous permet de suivre l'évolution scolaire de vos enfants inscrits, de consulter l'état de leurs frais scolaires, d'effectuer vos règlements en toute sécurité et de télécharger vos reçus officiels.",
      tabs: [
        {
          id: "children",
          tabTitle: "Mes Enfants & Situation Financière",
          tabBadge: "Navigation Mes Enfants",
          appRoute: "/parent",
          icon: Users,
          purpose: "Vue d'ensemble sur chacun de vos enfants inscrits dans l'établissement : classe, scolarité totale, montants déjà versés et reste à payer.",
          howToSteps: [
            "1. Dès votre connexion, retrouvez la carte de chaque enfant.",
            "2. Consultez la barre de progression des paiements pour voir le pourcentage déjà réglé.",
            "3. Cliquez sur 'Détails' pour voir les tranches restantes et leurs dates limites d'exigibilité."
          ],
          tipsAndRules: [
            "Assurez-vous de respecter les dates limites des tranches pour éviter tout désagrément lors des évaluations."
          ]
        },
        {
          id: "payments",
          tabTitle: "Paiement en Ligne (Mobile Money & Virement)",
          tabBadge: "Navigation Paiements",
          appRoute: "/parent/payments",
          icon: CreditCard,
          purpose: "Règlement sécurisé de la scolarité et des services optionnels (cantine, transport, tenue) sans avoir à vous déplacer à l'école.",
          howToSteps: [
            "1. Sélectionnez l'enfant concerné par le versement.",
            "2. Cochez les frais que vous souhaitez payer (ex: 1ère Tranche, Tenue, Cantine).",
            "3. Choisissez votre opérateur Mobile Money (MTN Mobile Money, Moov Money, Celtiis Cash, Wave) ou Virement.",
            "4. Effectuez le transfert vers le numéro ou compte officiel de l'école indiqué sur l'écran.",
            "5. Renseignez le numéro ayant émis le transfert ainsi que la référence de transaction SMS reçue de votre opérateur.",
            "6. Cliquez sur 'Confirmer le paiement'.",
            "7. Votre transaction passe en statut 'En attente de vérification'. Dès que la caisse vérifie la réception, votre reçu officiel est disponible en téléchargement."
          ],
          tipsAndRules: [
            "Veillez à copier fidèlement la référence SMS envoyée par MTN ou Moov pour une validation ultra-rapide par la caisse.",
            "Vous pouvez télécharger et imprimer vos reçus de paiement à tout moment dans l'onglet Historique."
          ]
        },
        {
          id: "prospectus",
          tabTitle: "Prospectus & Règlement Intérieur",
          tabBadge: "Navigation Prospectus",
          appRoute: "/parent/prospectus",
          icon: BookOpen,
          purpose: "Consultation de la brochure officielle de l'école : grille des tarifs de l'année, liste des fournitures, horaires, règlement de discipline et calendrier scolaire.",
          howToSteps: [
            "1. Ouvrez l'onglet Prospectus.",
            "2. Parcourez les différentes sections de présentation et tarifs par niveau.",
            "3. Cliquez sur 'Télécharger en PDF' pour garder une copie sur votre téléphone ou ordinateur."
          ],
          tipsAndRules: [
            "Le prospectus est mis à jour chaque année par la direction de l'établissement."
          ]
        },
        {
          id: "support",
          tabTitle: "Assistance & Réclamations",
          tabBadge: "Navigation Assistance",
          appRoute: "/parent/support",
          icon: HelpCircle,
          purpose: "Contact direct avec l'administration de l'école en cas de question sur un versement, une note ou un dossier administratif.",
          howToSteps: [
            "1. Renseignez l'objet de votre demande.",
            "2. Précisez le nom de votre enfant et éventuellement la référence du versement concerné.",
            "3. Rédigez votre message et cliquez sur 'Envoyer'. L'administration recevra votre message et y répondra."
          ],
          tipsAndRules: [
            "Pour les urgences financières, vous pouvez également joindre le numéro de la caisse affiché dans l'entête."
          ]
        }
      ]
    },
    {
      roleKey: "SUPER_ADMIN",
      title: "Super Administrateur de la Plateforme",
      subtitle: "Supervision nationale, création d'écoles, maintenance et gestion des abonnements",
      icon: Shield,
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      quickSummary: "Le Super Administrateur gère l'infrastructure multi-établissements EduBénin : provisionnement des nouvelles écoles, licences d'utilisation, monitoring technique et support de niveau supérieur.",
      tabs: [
        {
          id: "schools_mgmt",
          tabTitle: "Gestion des Établissements & Licences",
          tabBadge: "Navigation Administration",
          appRoute: "/super-admin",
          icon: Shield,
          purpose: "Création et suivi de chaque école cliente sur le territoire béninois.",
          howToSteps: [
            "1. Créez un nouvel établissement en renseignant le nom, le département/commune et l'année scolaire de démarrage.",
            "2. Définissez le compte du Directeur principal (email et mot de passe initial).",
            "3. Activez ou suspendez la licence d'accès selon les conventions de service.",
            "4. Consultez les métriques globales d'utilisation de la plateforme."
          ],
          tipsAndRules: [
            "Chaque école bénéficie d'une étanchéité totale de ses données financières et dossiers scolaires."
          ]
        }
      ]
    }
  ], []);

  // Current active guide object
  const currentGuide = useMemo(() => {
    return guides.find(g => g.roleKey === selectedRole) || guides[0];
  }, [guides, selectedRole]);

  // Filtered tabs according to search term
  const filteredTabs = useMemo(() => {
    if (!searchTerm.trim()) return currentGuide.tabs;
    const q = searchTerm.toLowerCase();
    return currentGuide.tabs.filter(tab => 
      tab.tabTitle.toLowerCase().includes(q) ||
      tab.tabBadge.toLowerCase().includes(q) ||
      tab.purpose.toLowerCase().includes(q) ||
      tab.howToSteps.some(s => s.toLowerCase().includes(q)) ||
      tab.tipsAndRules.some(t => t.toLowerCase().includes(q))
    );
  }, [currentGuide, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:m-0">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} /> Manuel & Guide Officiel
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400">EduBénin Plateforme</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
            Centre d'Aide & Procédures par Profil
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Consultez les explications détaillées de chaque partie de l'application et suivez les démarches pas à pas ("Comment procéder") adaptées à votre profil et à chaque onglet.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto print:hidden">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition border border-white/10 active:scale-95"
            title="Imprimer ce guide d'utilisation"
          >
            <Printer size={15} />
            <span>Imprimer le Guide</span>
          </button>
        </div>
      </div>

      {/* 2. Role Selector Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sélectionnez le profil à consulter :
          </span>
          {user?.role && (
            <span className="text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1 shrink-0">
              <CheckCircle2 size={12} /> Connecté : {user.role.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2">
          {guides.map(g => {
            const isSelected = g.roleKey === selectedRole;
            const isUserRole = user?.role === g.roleKey;
            const Icon = g.icon;
            return (
              <button
                key={g.roleKey}
                onClick={() => {
                  setSelectedRole(g.roleKey);
                  setSearchParams({ role: g.roleKey });
                  setSearchTerm("");
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all relative min-h-[54px] active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 hover:bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {isUserRole && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" title="Votre profil" />
                )}
                <Icon size={17} className={isSelected ? "text-emerald-400" : "text-slate-500"} />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight line-clamp-1">
                  {g.title.split('&')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Profile Overview Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <currentGuide.icon size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">
                Guide : {currentGuide.title}
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentGuide.badgeColor}`}>
                {currentGuide.roleKey}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentGuide.subtitle}
            </p>
            <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
              💡 {currentGuide.quickSummary}
            </p>
          </div>
        </div>

        {/* Search within current guide */}
        <div className="w-full md:w-72 shrink-0 print:hidden">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une action, tab, mot-clé..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* 4. Tabs & Procedures Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600" />
            <span>Détail des onglets et procédures pas à pas ({filteredTabs.length} onglet{filteredTabs.length > 1 ? 's' : ''})</span>
          </h3>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>

        {filteredTabs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Info size={32} className="text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">Aucun résultat trouvé pour "{searchTerm}"</p>
            <p className="text-xs text-slate-400">Essayez un autre mot-clé ou réinitialisez la recherche.</p>
          </div>
        ) : (
          filteredTabs.map((tab, idx) => {
            const TabIcon = tab.icon;
            const isTargetTab = tabParam === tab.id;
            return (
              <div 
                id={`tab-item-${tab.id}`}
                key={tab.id}
                className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
                  isTargetTab ? "border-2 border-emerald-500 ring-4 ring-emerald-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header bar of the tab guide */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <TabIcon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase font-mono">
                          {tab.tabBadge}
                        </span>
                        <h4 className="font-bold text-base text-gray-900">
                          {tab.tabTitle}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tab.purpose}
                      </p>
                    </div>
                  </div>

                  {/* Direct link to test/open the tab in app */}
                  {user?.role === selectedRole && tab.appRoute && tab.appRoute !== "#settings" && (
                    <Link
                      to={tab.appRoute}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shrink-0 shadow-xs self-start sm:self-auto print:hidden"
                    >
                      <span>Ouvrir cet onglet</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>

                {/* Content: How to Proceed & Tips */}
                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* How to proceed (2 cols) */}
                  <div className="lg:col-span-2 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Comment procéder étape par étape :
                    </h5>
                    
                    <div className="space-y-2.5">
                      {tab.howToSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips & Rules (1 col) */}
                  <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-600" />
                      Règles & Bonnes pratiques :
                    </h5>
                    
                    <ul className="space-y-2">
                      {tab.tipsAndRules.map((tip, tIdx) => (
                        <li key={tIdx} className="text-xs text-amber-950 flex items-start gap-2 leading-relaxed">
                          <Check size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Frequently Asked Questions (FAQ) Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-emerald-600" />
          <h3 className="text-base font-bold text-gray-900">
            Foire Aux Questions (FAQ) - {currentGuide.title}
          </h3>
        </div>

        <div className="space-y-3">
          {selectedRole === "SCHOOL_ADMIN" && (
            <>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span> Comment modifier un tarif ou ajouter une tranche pour une classe spécifique ?
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Rendez-vous dans <strong>Tableau de bord &gt; Frais de scolarité</strong>. Dans la grille "Tableau Général", modifiez directement la cellule voulue. Si vous modifiez une tranche (Tranche 1, 2 ou 3), le total de la Scolarité s'ajuste immédiatement. Cliquez ensuite sur <em>Sauvegarder les modifications</em>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span> Pourquoi une transaction rejetée n'apparaît-elle pas dans le total des recettes ?
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  C'est une règle de gestion stricte : les transactions rejetées (par exemple un faux paiement ou un rejet en caisse) ne représentent pas d'argent réellement encaissé. Elles sont donc automatiquement exclues du total des recettes et du grand livre afin d'éviter toute fausse trésorerie. Elles ne s'affichent que si vous filtrez spécifiquement sur 'Transactions Refusées'.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span> Comment créer une copie de sécurité de toutes les données de mon école ?
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cliquez sur <strong>Sauvegarde</strong> dans la barre de navigation latérale, puis sur <em>Télécharger la Sauvegarde Complète (JSON)</em>. Vous disposerez d'une archive intégrale de vos élèves, paiements, configurations et prospectus prête à être restaurée si besoin.
                </p>
              </div>
            </>
          )}

          {selectedRole === "CASHIER" && (
            <>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span> Que faire lorsqu'un parent déclare un paiement Mobile Money introuvable ?
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dans l'onglet <strong>Vérifications</strong>, comparez la référence et l'heure avec le téléphone de caisse de l'école. Si les fonds n'ont pas été reçus, cliquez sur <strong>Rejeter</strong> en précisant le motif. Le versement ne sera pas validé et le reçu ne sera pas émis.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span> Comment imprimer le reçu d'un paiement effectué précédemment ?
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dans l'onglet <strong>Encaissements</strong> ou <strong>Liste Financière</strong>, recherchez l'élève, cliquez sur l'icône de l'œil pour afficher le détail, puis cliquez sur <em>Imprimer le reçu</em>.
                </p>
              </div>
            </>
          )}

          {selectedRole === "PARENT" && (
            <>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span> Combien de temps prend la validation d'un paiement Mobile Money ?
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dès que vous validez la transaction sur votre téléphone et saisissez la référence dans l'application, la caisse de l'école reçoit une alerte instantanée. Dès que le comptable confirme la réception des fonds, votre reçu officiel devient disponible en téléchargement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span> Puis-je payer uniquement une tranche ou la cantine sans payer toute l'année ?
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Oui ! Dans l'onglet <strong>Paiements</strong>, cochez uniquement la case de la tranche ou du service concerné (ex: 1ère Tranche ou Cantine du mois). Le montant se calcule automatiquement.
                </p>
              </div>
            </>
          )}

          {selectedRole !== "SCHOOL_ADMIN" && selectedRole !== "CASHIER" && selectedRole !== "PARENT" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <h5 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                <span>❓</span> Comment obtenir de l'aide technique supplémentaire ?
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contactez directement le responsable administratif de votre école ou le support technique EduBénin via les coordonnées ci-dessous.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Technical Support Card */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Phone size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-950">Assistance & Support Utilisateur</h4>
            <p className="text-xs text-emerald-800">
              Besoin d'accompagnement ou d'une formation sur mesure pour vos équipes ?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:+22900000000"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <Phone size={14} />
            <span>Appeler le Support</span>
          </a>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Info,
  Check,
  Zap,
  SlidersHorizontal,
  Table,
  CreditCard,
  Banknote,
  Clock,
  ArrowDownToLine,
  Database,
  Users,
  Settings,
  Megaphone,
  Shield,
  Award,
  Calendar,
  ShieldAlert,
  FileText,
  FileSpreadsheet,
  Eye,
  Plus
} from "lucide-react";

interface PageElementExplanation {
  label: string;
  type: "BOUTON" | "TABLEAU" | "FILTRE" | "CHAMP" | "ACTION" | "INDICATEUR";
  description: string;
}

interface ContextualGuideData {
  pageTitle: string;
  roleBadge: string;
  tabBadge: string;
  summary: string;
  elements: PageElementExplanation[];
  howToSteps: string[];
  tips: string[];
  helpCenterAnchorRole?: string;
  helpCenterAnchorTab?: string;
}

export function PageContextualGuide() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Read tab param
  const currentTab = useMemo(() => {
    return new URLSearchParams(location.search).get("tab") || "";
  }, [location.search]);

  // Read stored preference for this page
  const pageStorageKey = useMemo(() => {
    return `edubenin_guide_hidden_${location.pathname}_${currentTab}`;
  }, [location.pathname, currentTab]);

  useEffect(() => {
    // If user previously minimized for this exact page/tab
    const isHidden = localStorage.getItem(pageStorageKey) === "true";
    setIsOpen(!isHidden);
  }, [pageStorageKey]);

  // Listen to custom event from top bar button
  useEffect(() => {
    const handleOpenGuide = () => {
      setIsOpen(true);
      localStorage.removeItem(pageStorageKey);
    };
    window.addEventListener("open_page_guide", handleOpenGuide);
    return () => window.removeEventListener("open_page_guide", handleOpenGuide);
  }, [pageStorageKey]);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    setHasInteracted(true);
    if (!next) {
      localStorage.setItem(pageStorageKey, "true");
    } else {
      localStorage.removeItem(pageStorageKey);
    }
  };

  // Determine guide data based on pathname and currentTab
  const guideData: ContextualGuideData | null = useMemo(() => {
    const path = location.pathname;

    // Do not show on /help itself
    if (path === "/help") return null;

    // 1. Finances & Caisse (/school-admin/payments)
    if (path === "/school-admin/payments") {
      if (currentTab === "FINANCIAL_LIST") {
        return {
          pageTitle: "Liste Financière & Grand Livre Comptable",
          roleBadge: "Directeur / Caissier",
          tabBadge: "Tab Liste Financière",
          helpCenterAnchorRole: "SCHOOL_ADMIN",
          helpCenterAnchorTab: "financial_list",
          summary: "Grand livre financier certifié présentant la séparation stricte de tous les flux d'argent : Recettes encaissées, Salaires du personnel et Dépenses d'exploitation, sans aucun jumelage de catégories.",
          elements: [
            {
              label: "Bloc 1 : Recettes Encaissées (Vert)",
              type: "INDICATEUR",
              description: "Affiche chaque recette séparément (1ère Tranche, 2ème Tranche, 3ème Tranche, Inscriptions, Cantine, Transport...). Seules les sommes réellement vérifiées et encaissées y figurent."
            },
            {
              label: "Bloc 2 : Salaires du Personnel (Violet)",
              type: "INDICATEUR",
              description: "Ventilation des rémunérations payées par poste : Enseignants, Direction, Caisse, Gardiennage, Chauffeurs."
            },
            {
              label: "Bloc 3 : Charges d'Exploitation (Rose)",
              type: "INDICATEUR",
              description: "Détail de chaque dépense réelle effectuée (Électricité, Fournitures, Réparations, etc.)."
            },
            {
              label: "Graphique Comparatif des Flux",
              type: "INDICATEUR",
              description: "Histogramme comparatif des montants avec intitulés droits horizontaux pour une lecture directe sans inclinaison."
            },
            {
              label: "Filtres Pertinents & Précis",
              type: "FILTRE",
              description: "Menus déroulants à cases à cocher permettant de sélectionner une ou plusieurs classes, catégories précises (sans cumul), modes de paiement et années scolaires."
            },
            {
              label: "Filtre de Statut (Exclusion des Rejets)",
              type: "FILTRE",
              description: "Par défaut, seules les vérifications validées s'affichent. Les transactions refusées en caisse sont strictement exclues et ne s'affichent que si vous cochez 'Transactions Refusées / Rejetées'."
            },
            {
              label: "Boutons 'Télécharger PDF' & 'Exporter Excel'",
              type: "BOUTON",
              description: "Génère le document officiel prêt à imprimer ou un fichier tableur CSV de la sélection."
            }
          ],
          howToSteps: [
            "1. Consultez les totaux par catégorie dans les 3 blocs colorés (Recettes en vert, Salaires en violet, Charges en rose).",
            "2. Utilisez les filtres déroulants pour isoler une classe (ex: 6ème) ou une tranche précise (ex: 1ère Tranche uniquement).",
            "3. Pour imprimer ou archiver le bilan certifié, cliquez sur 'Télécharger Liste Complète (PDF)'."
          ],
          tips: [
            "Les transactions refusées lors des vérifications n'ont pas été encaissées : elles n'augmentent jamais votre total de recettes.",
            "Vous pouvez cocher des lignes spécifiques dans la première colonne pour n'exporter qu'une sélection précise."
          ]
        };
      }

      if (currentTab === "VERIFICATION") {
        return {
          pageTitle: "Vérifications des Règlements en Ligne",
          roleBadge: "Caisse & Direction",
          tabBadge: "Tab Vérifications",
          helpCenterAnchorRole: "CASHIER",
          helpCenterAnchorTab: "verifications",
          summary: "Validation ou rejet des paiements par Mobile Money (MTN, Moov, Celtiis, Wave) ou virement bancaire déclarés par les parents d'élèves.",
          elements: [
            {
              label: "Liste 'En attente de vérification'",
              type: "TABLEAU",
              description: "Affiche les paiements déclarés par les parents qui attendent d'être confirmés par la caisse."
            },
            {
              label: "Bouton Vert 'Valider le paiement'",
              type: "BOUTON",
              description: "Confirme la bonne réception de l'argent. Le montant est immédiatement intégré aux recettes officielles, le reçu officiel est généré et le parent reçoit une notification de confirmation."
            },
            {
              label: "Bouton Rouge 'Rejeter'",
              type: "BOUTON",
              description: "À utiliser si le transfert est introuvable ou faux. La transaction passe en statut 'FAILED/Refusé', aucun reçu n'est émis et l'argent n'entre PAS dans la caisse."
            },
            {
              label: "Historique des transactions traitées",
              type: "TABLEAU",
              description: "Affiche les dernières vérifications effectuées avec le nom du caissier ayant validé ou rejeté."
            }
          ],
          howToSteps: [
            "1. Vérifiez sur le téléphone de caisse de l'école (ou le relevé de compte) la réception du SMS de l'opérateur correspondant au montant et à la référence.",
            "2. Si l'argent est effectivement reçu : Cliquez sur 'Valider le paiement'.",
            "3. Si la référence est erronée ou l'argent non reçu : Cliquez sur 'Rejeter' pour annuler la transaction."
          ],
          tips: [
            "Une transaction rejetée ne rentre jamais dans vos recettes et n'apparaît pas dans la liste financière par défaut."
          ]
        };
      }

      if (currentTab === "CREANCES") {
        return {
          pageTitle: "Créances & Suivi des Impayés",
          roleBadge: "Caisse & Direction",
          tabBadge: "Tab Créances",
          helpCenterAnchorRole: "CASHIER",
          helpCenterAnchorTab: "creances",
          summary: "Identification des élèves débiteurs, dates limites d'échéances dépassées, alertes de retard et relance directe des familles.",
          elements: [
            {
              label: "Indicateur 'Total Créances Dues'",
              type: "INDICATEUR",
              description: "Somme totale restant à percevoir auprès des familles pour l'année scolaire en cours."
            },
            {
              label: "Bouton 'Filtrer uniquement les retards'",
              type: "BOUTON",
              description: "Isole instantanément les élèves dont la date limite d'une ou plusieurs tranches est échue."
            },
            {
              label: "Filtres Pertinents (Classes, Catégories, Années)",
              type: "FILTRE",
              description: "Permet de cibler une promotion particulière (ex: Terminale ou CM2) ou un type de frais."
            },
            {
              label: "Bouton WhatsApp vert",
              type: "ACTION",
              description: "Ouvre une discussion WhatsApp avec le parent de l'élève contenant un message de rappel pré-rempli et courtois."
            },
            {
              label: "Télécharger Créances (PDF) & Exporter Excel",
              type: "BOUTON",
              description: "Télécharge le récapitulatif complet des élèves débiteurs avec contacts des parents et montants dus."
            }
          ],
          howToSteps: [
            "1. Cliquez sur 'Filtrer uniquement les retards' pour afficher les urgences.",
            "2. Cliquez sur la ligne d'un élève pour ouvrir sa fiche détaillée d'impayés.",
            "3. Cliquez sur l'icône WhatsApp pour relancer le parent en 1 clic.",
            "4. Téléchargez l'état en PDF pour vos réunions de recouvrement."
          ],
          tips: [
            "Les élèves dont les tranches sont à jour mais qui ont encore des échéances futures ne sont pas comptés en retard."
          ]
        };
      }

      if (currentTab === "DAILY_SUMMARY") {
        return {
          pageTitle: "Caisse du Jour & Clôture Quotidienne",
          roleBadge: "Caissier / Directeur",
          tabBadge: "Tab Caisse du Jour",
          helpCenterAnchorRole: "CASHIER",
          helpCenterAnchorTab: "daily_summary",
          summary: "Contrôle journalier des encaissements physiques et électroniques reçus au guichet pour clôturer la journée comptable sans écart.",
          elements: [
            {
              label: "Total Espèces en Caisse",
              type: "INDICATEUR",
              description: "Montant physique en liquide qui doit obligatoirement se trouver dans le tiroir-caisse de l'école."
            },
            {
              label: "Total Mobile Money & Banques",
              type: "INDICATEUR",
              description: "Cumul des transactions électroniques perçues dans la journée."
            },
            {
              label: "Bouton 'Imprimer le Point du Jour'",
              type: "BOUTON",
              description: "Génère la feuille de caisse journalière à signer par le caissier et le chef d'établissement."
            }
          ],
          howToSteps: [
            "1. En fin de journée, comptez l'argent liquide de la caisse.",
            "2. Comparez avec le montant 'Total Espèces' affiché à l'écran.",
            "3. Imprimez la feuille du jour pour archivage."
          ],
          tips: [
            "En cas d'écart, vérifiez si un encaissement a été enregistré par erreur en espèces au lieu de Mobile Money."
          ]
        };
      }

      if (currentTab === "EXPENSES") {
        return {
          pageTitle: "Charges & Dépenses d'Exploitation",
          roleBadge: "Caisse & Direction",
          tabBadge: "Tab Dépenses",
          helpCenterAnchorRole: "CASHIER",
          helpCenterAnchorTab: "expenses",
          summary: "Enregistrement des sorties d'argent nécessaires au fonctionnement de l'école avec justificatifs photos agrandissables.",
          elements: [
            {
              label: "Tableau modifiable des dépenses",
              type: "TABLEAU",
              description: "Permet de modifier directement les lignes de dépenses et d'en ajouter de nouvelles."
            },
            {
              label: "Bouton '+ Ajouter une dépense'",
              type: "BOUTON",
              description: "Ouvre le formulaire pour renseigner le motif, le montant, la catégorie et joindre la facture."
            },
            {
              label: "Agrandissement du Justificatif",
              type: "ACTION",
              description: "En cliquant sur la photo ou le document uploadé, l'image s'agrandit en plein écran pour vérifier sa netteté."
            }
          ],
          howToSteps: [
            "1. Cliquez sur 'Ajouter une dépense'.",
            "2. Sélectionnez la catégorie (ex: Facture Électricité, Carburant, Fournitures).",
            "3. Téléversez la photo du reçu ou de la facture.",
            "4. Enregistrez la dépense."
          ],
          tips: [
            "Toute dépense sans justificatif est signalée pour contrôle de gestion."
          ]
        };
      }

      if (currentTab === "SALARIES") {
        return {
          pageTitle: "Salaires & Rémunérations du Personnel",
          roleBadge: "Caisse & Direction",
          tabBadge: "Tab Salaires",
          helpCenterAnchorRole: "CASHIER",
          helpCenterAnchorTab: "salaries",
          summary: "Gestion des paies mensuelles des enseignants et employés administratifs.",
          elements: [
            {
              label: "Tableau modifiable des salaires",
              type: "TABLEAU",
              description: "Permet d'ajuster les salaires de base, les heures supplémentaires et les primes directement."
            },
            {
              label: "Bouton d'émargement / Paiement",
              type: "ACTION",
              description: "Bascule l'état en 'Payé' une fois le règlement remis au collaborateur."
            }
          ],
          howToSteps: [
            "1. Sélectionnez le mois concerné.",
            "2. Contrôlez les montants de paie par employé.",
            "3. Enregistrez le règlement et imprimez le bulletin ou le reçu de paie."
          ],
          tips: [
            "Les salaires sont comptabilisés séparément des charges générales dans la liste financière."
          ]
        };
      }

      if (currentTab === "PAYMENTS") {
        return {
          pageTitle: "Encaissements au Guichet (Nouveau Paiement)",
          roleBadge: "Caisse",
          tabBadge: "Tab Encaissements",
          helpCenterAnchorRole: "CASHIER",
          helpCenterAnchorTab: "payments",
          summary: "Enregistrement direct des versements effectués en mains propres à la caisse par les familles.",
          elements: [
            {
              label: "Recherche Élève (Nom / Matricule)",
              type: "CHAMP",
              description: "Retrouve instantanément le dossier scolaire et le solde restant de l'élève."
            },
            {
              label: "Sélection des Frais & Tranches",
              type: "ACTION",
              description: "Cochez la ou les tranches à encaisser (Tranche 1, Tranche 2, Cantine, Tenue...)."
            },
            {
              label: "Mode de Règlement",
              type: "CHAMP",
              description: "Choix entre Espèces, Mobile Money, Chèque bancaire ou Virement."
            },
            {
              label: "Bouton 'Valider & Imprimer le Reçu'",
              type: "BOUTON",
              description: "Enregistre l'encaissement et génère immédiatement le reçu officiel à deux volets avec tampon et signature."
            }
          ],
          howToSteps: [
            "1. Tapez le nom ou matricule de l'élève dans la recherche.",
            "2. Cochez les frais réglés et saisissez le montant versé.",
            "3. Choisissez le mode de règlement (Espèces, Mobile Money...).",
            "4. Validez l'opération et remettez le reçu imprimé au parent."
          ],
          tips: [
            "Le reçu porte un numéro unique inviolable généré par le système."
          ]
        };
      }

      // Default Dashboard Caisse
      return {
        pageTitle: "Tableau de Bord Caisse & Trésorerie",
        roleBadge: "Caisse & Direction",
        tabBadge: "Tab Tableau de bord Caisse",
        helpCenterAnchorRole: "CASHIER",
        helpCenterAnchorTab: "daily_summary",
        summary: "Vue synthétique de l'activité financière du jour : encaissements récents, règlements en attente et soldes.",
        elements: [
          {
            label: "Cartes KPI (Recettes du Jour, Mois, Restes à percevoir)",
            type: "INDICATEUR",
            description: "Aperçu chiffré instantané des flux d'argent."
          },
          {
            label: "Onglets de navigation Caisse",
            type: "ACTION",
            description: "Bascule rapide entre Liste financière, Vérifications, Encaissements, Créances, Dépenses et Salaires."
          }
        ],
        howToSteps: [
          "1. Consultez les KPIs du matin pour vérifier les encaissements.",
          "2. Accédez à l'onglet 'Vérifications' pour traiter les demandes de paiement en ligne.",
          "3. Utilisez 'Encaissements' pour les parents qui se présentent au guichet."
        ],
        tips: [
          "Toutes les actions de caisse sont tracées avec le nom de l'opérateur connecté."
        ]
      };
    }

    // 2. School Admin / Direction (/school-admin)
    if (path === "/school-admin") {
      if (currentTab === "FEES") {
        return {
          pageTitle: "Frais de Scolarité & Grille Tarifaire",
          roleBadge: "Directeur / Admin",
          tabBadge: "Tab Frais de scolarité",
          helpCenterAnchorRole: "SCHOOL_ADMIN",
          helpCenterAnchorTab: "fees",
          summary: "Tableau général de gestion des tarifs scolaires par classe : modification directe en grille tableur, ajout d'autres frais personnalisés et renommage à volonté.",
          elements: [
            {
              label: "Grille 'Tableau Général (Excel)'",
              type: "TABLEAU",
              description: "Affiche l'ensemble des classes en lignes et chaque type de frais en colonnes. Vous pouvez saisir les montants directement dans chaque case."
            },
            {
              label: "Auto-calcul Scolarité",
              type: "ACTION",
              description: "Lorsque vous saisissez ou modifiez les montants de la Tranche 1, Tranche 2 ou Tranche 3, la colonne 'Scolarité' s'auto-calcule immédiatement comme la somme des tranches."
            },
            {
              label: "Bouton '+ Ajouter d'autres frais'",
              type: "BOUTON",
              description: "Permet de créer une nouvelle colonne personnalisée (ex: Frais de dossier, Assurance, Voyage d'études, etc.) en choisissant si le frais est obligatoire ou optionnel."
            },
            {
              label: "Renommer un frais (Icône Crayon)",
              type: "ACTION",
              description: "Survolez n'importe quel titre de colonne de frais et cliquez sur le crayon pour lui donner le nom que vous souhaitez. Le nouveau libellé est sauvegardé pour votre école."
            },
            {
              label: "Bouton 'Reconduire depuis l'année précédente'",
              type: "BOUTON",
              description: "Importe les montants de l'année passée pour ne modifier que les changements éventuels sans tout ressaisir."
            },
            {
              label: "Bouton 'Sauvegarder les modifications'",
              type: "BOUTON",
              description: "Enregistre définitivement toute la grille tarifaire pour l'année scolaire sélectionnée."
            }
          ],
          howToSteps: [
            "1. Modifiez directement les chiffres dans les cases de la classe souhaitée.",
            "2. Pour ajouter un nouveau frais : Cliquez sur '+ Ajouter d'autres frais', entrez son nom et validez.",
            "3. Pour renommer un frais existant : Cliquez sur le crayon dans l'en-tête de sa colonne et écrivez le nouveau nom.",
            "4. Cliquez sur 'Sauvegarder les modifications' pour appliquer les tarifs."
          ],
          tips: [
            "Toutes les colonnes personnalisées et libellés renommés sont conservés de manière permanente.",
            "Vous pouvez basculer entre 'Tableau Général' et 'Vue par Catégorie' grâce au sélecteur en haut à droite."
          ]
        };
      }

      if (currentTab === "BACKUP") {
        return {
          pageTitle: "Sauvegarde & Restauration de l'Établissement",
          roleBadge: "Directeur / Admin",
          tabBadge: "Navigation Sauvegarde",
          helpCenterAnchorRole: "SCHOOL_ADMIN",
          helpCenterAnchorTab: "backup",
          summary: "Système de sauvegarde intégrale pour sécuriser vos données (élèves, paiements, dépenses, salaires, configurations, prospectus) et les restaurer en un clic.",
          elements: [
            {
              label: "Bouton 'Sauvegarde Complète (JSON)'",
              type: "BOUTON",
              description: "Télécharge un fichier sécurisé .json horodaté contenant l'ensemble complet de votre établissement."
            },
            {
              label: "Exports CSV Individuels",
              type: "BOUTON",
              description: "Téléchargement individuel des élèves, paiements, dépenses ou salaires pour analyse dans Excel."
            },
            {
              label: "Zone d'Importation & Restauration",
              type: "ACTION",
              description: "Permet de glisser-déposer un fichier .json de sauvegarde précédent pour restaurer l'école en mode Fusion ou Remplacement."
            }
          ],
          howToSteps: [
            "1. Cliquez sur 'Télécharger la Sauvegarde Complète (JSON)' pour créer votre archive.",
            "2. Conservez ce fichier sur une clé USB ou un disque externe.",
            "3. Pour restaurer, sélectionnez le fichier JSON et confirmez l'importation."
          ],
          tips: [
            "Il est recommandé de faire une sauvegarde complète à chaque clôture de trimestre ou avant les vacances scolaires."
          ]
        };
      }

      if (currentTab === "ANNOUNCEMENTS") {
        return {
          pageTitle: "Annonces & Communications de l'École",
          roleBadge: "Directeur / Admin",
          tabBadge: "Tab Annonces",
          helpCenterAnchorRole: "SCHOOL_ADMIN",
          helpCenterAnchorTab: "announcements",
          summary: "Publication de communiqués officiels, alertes et notes de service distribués instantanément aux utilisateurs concernés.",
          elements: [
            {
              label: "Formulaire de publication",
              type: "CHAMP",
              description: "Permet de rédiger le titre, le corps du message et de choisir la cible (Parents, Professeurs ou Tout le monde)."
            },
            {
              label: "Bouton 'Publier'",
              type: "BOUTON",
              description: "Enregistre l'annonce, l'affiche sur l'accueil des destinataires et déclenche une notification instantanée."
            }
          ],
          howToSteps: [
            "1. Saisissez le titre et le contenu de l'annonce.",
            "2. Sélectionnez le public cible.",
            "3. Cliquez sur 'Publier'."
          ],
          tips: [
            "Les annonces restent visibles jusqu'à ce que vous cliquiez sur la corbeille pour les supprimer."
          ]
        };
      }

      if (currentTab === "MEMBERS") {
        return {
          pageTitle: "Membres de l'Établissement & Invitations",
          roleBadge: "Directeur / Admin",
          tabBadge: "Tab Membres",
          helpCenterAnchorRole: "SCHOOL_ADMIN",
          helpCenterAnchorTab: "members",
          summary: "Gestion du personnel éducatif et administratif : invitation par email et attribution des rôles d'accès.",
          elements: [
            {
              label: "Formulaire d'invitation",
              type: "CHAMP",
              description: "Saisie de l'adresse email et choix du rôle (Directeur des études, Professeur, Caissier, Secrétaire, Surveillant)."
            },
            {
              label: "Liste des membres actifs",
              type: "TABLEAU",
              description: "Affiche tous les collaborateurs enregistrés avec leur rôle et statut."
            }
          ],
          howToSteps: [
            "1. Saisissez l'email du collaborateur.",
            "2. Choisissez son rôle dans le menu déroulant.",
            "3. Cliquez sur 'Inviter'."
          ],
          tips: [
            "Chaque collaborateur n'a accès qu'aux sections autorisées par son rôle."
          ]
        };
      }

      if (currentTab === "SETTINGS") {
        return {
          pageTitle: "Paramètres Officiels de l'Établissement",
          roleBadge: "Directeur / Admin",
          tabBadge: "Tab Paramètres",
          helpCenterAnchorRole: "SCHOOL_ADMIN",
          helpCenterAnchorTab: "settings",
          summary: "Personnalisation de l'école : nom, coordonnées, logo officiel et signature numérique du chef d'établissement.",
          elements: [
            {
              label: "Logo de l'école",
              type: "CHAMP",
              description: "Image qui apparaîtra sur l'entête national de tous les reçus de paiement et bulletins."
            },
            {
              label: "Zone de signature numérique",
              type: "CHAMP",
              description: "Permet au directeur de signer avec la souris ou au doigt pour authentifier les reçus."
            }
          ],
          howToSteps: [
            "1. Mettez à jour les coordonnées officielles.",
            "2. Uploadez votre logo.",
            "3. Signez dans le cadre et cliquez sur 'Enregistrer'."
          ],
          tips: [
            "Ces informations certifient tous les documents officiels émis par votre école."
          ]
        };
      }

      // Default School Admin Dashboard
      return {
        pageTitle: "Tableau de Bord Général de l'École",
        roleBadge: "Directeur / Admin",
        tabBadge: "Navigation Tableau de bord",
        helpCenterAnchorRole: "SCHOOL_ADMIN",
        helpCenterAnchorTab: "dashboard",
        summary: "Vue synthétique des indicateurs clés de votre établissement : effectif total des inscrits, cumul des recettes encaissées, classes actives et dernières inscriptions.",
        elements: [
          {
            label: "Cartes KPI (Élèves, Recettes, Classes, Inscriptions)",
            type: "INDICATEUR",
            description: "Synthèse chiffrée en temps réel de votre école."
          },
          {
            label: "Tableau des Inscriptions Récentes",
            type: "TABLEAU",
            description: "Derniers élèves admis avec niveau, date et agent d'enregistrement."
          },
          {
            label: "Onglets de Navigation Supérieurs",
            type: "ACTION",
            description: "Permet de basculer vers les Frais de scolarité, les Annonces, la Sauvegarde, les Membres ou les Paramètres."
          }
        ],
        howToSteps: [
          "1. Consultez les indicateurs en début de journée.",
          "2. Utilisez les onglets pour gérer les frais, les annonces ou la sauvegarde."
        ],
        tips: [
          "Les recettes indiquées prennent uniquement en compte les paiements validés par la caisse."
        ]
      };
    }

    // 3. Inscriptions & Dossiers Élèves (/school-admin/students)
    if (path === "/school-admin/students") {
      if (currentTab === "HR") {
        return {
          pageTitle: "Personnel & Ressources Humaines (RH)",
          roleBadge: "Secrétariat / Direction",
          tabBadge: "Tab Personnel & RH",
          helpCenterAnchorRole: "SECRETARY",
          helpCenterAnchorTab: "hr",
          summary: "Répertoire du personnel de l'école (enseignants, agents administratifs, chauffeurs, surveillants), gestion des contrats et fiches individuelles.",
          elements: [
            {
              label: "Liste du personnel actif",
              type: "TABLEAU",
              description: "Affiche nom, fonction, numéro de téléphone, statut et date de prise de service."
            },
            {
              label: "Bouton '+ Ajouter un agent'",
              type: "BOUTON",
              description: "Ouvre le formulaire pour créer une nouvelle fiche d'employé."
            }
          ],
          howToSteps: [
            "1. Cliquez sur 'Ajouter un agent' pour enregistrer un nouvel employé.",
            "2. Renseignez son poste, ses coordonnées et son salaire de base.",
            "3. Enregistrez la fiche."
          ],
          tips: ["Les fiches RH servent de base au module des salaires en caisse."]
        };
      }

      if (currentTab === "ABSENCES") {
        return {
          pageTitle: "Absences & Retards des Élèves",
          roleBadge: "Secrétariat / Surveillant",
          tabBadge: "Tab Absences",
          helpCenterAnchorRole: "SECRETARY",
          helpCenterAnchorTab: "absences",
          summary: "Enregistrement des absences scolaires journalières, justifications médicales et suivi du taux d'assiduité.",
          elements: [
            {
              label: "Sélecteur de date et de classe",
              type: "FILTRE",
              description: "Isole la promotion et le jour concernés par l'appel."
            },
            {
              label: "Tableau de pointage",
              type: "TABLEAU",
              description: "Permet de marquer 'Présent', 'Absent Justifié' ou 'Absent Non Justifié'."
            }
          ],
          howToSteps: [
            "1. Sélectionnez la classe et la date.",
            "2. Cochez les élèves absents.",
            "3. Enregistrez le pointage."
          ],
          tips: ["Les absences non justifiées sont portées sur les bulletins trimestriels."]
        };
      }

      if (currentTab === "DOCUMENTS") {
        return {
          pageTitle: "Certificats & Documents Officiels",
          roleBadge: "Secrétariat",
          tabBadge: "Tab Documents",
          helpCenterAnchorRole: "SECRETARY",
          helpCenterAnchorTab: "documents",
          summary: "Édition et impression instantanée des certificats de scolarité, attestations d'inscription et cartes scolaires aux armes officielles de l'établissement.",
          elements: [
            {
              label: "Choix du modèle de document",
              type: "CHAMP",
              description: "Certificat de scolarité, Attestation de radiation, Billet d'entrée, Carte d'élève."
            },
            {
              label: "Recherche de l'élève",
              type: "CHAMP",
              description: "Sélectionne l'élève pour remplir automatiquement son état civil complet."
            },
            {
              label: "Bouton 'Imprimer le document'",
              type: "BOUTON",
              description: "Génère le document PDF prêt pour signature et tamponnage."
            }
          ],
          howToSteps: [
            "1. Choisissez le type de document à éditer.",
            "2. Recherchez l'élève concerné.",
            "3. Cliquez sur 'Imprimer' pour délivrer l'attestation à la famille."
          ],
          tips: ["Le logo et les coordonnées de l'école sont automatiquement inclus."]
        };
      }

      if (currentTab === "MAILS") {
        return {
          pageTitle: "Registre des Courriers (Arrivées / Départs)",
          roleBadge: "Secrétariat",
          tabBadge: "Tab Courriers",
          helpCenterAnchorRole: "SECRETARY",
          helpCenterAnchorTab: "mails",
          summary: "Enregistrement administratif des courriers officiels reçus des ministères, inspections ou parents, et suivi des lettres expédiées.",
          elements: [
            {
              label: "Registre Arrivées / Départs",
              type: "TABLEAU",
              description: "Numéro d'ordre, date d'enregistrement, expéditeur, objet et état de traitement."
            },
            {
              label: "Bouton 'Nouveau Courrier'",
              type: "BOUTON",
              description: "Enregistre une correspondance avec numéro d'enregistrement chrono."
            }
          ],
          howToSteps: [
            "1. Cliquez sur 'Nouveau Courrier'.",
            "2. Notez l'expéditeur, l'objet et la référence.",
            "3. Enregistrez dans le registre pour archivage."
          ],
          tips: ["Permet de ne jamais égarer une correspondance officielle."]
        };
      }

      if (currentTab === "EXAMS") {
        return {
          pageTitle: "Épreuves & Organisation des Examens",
          roleBadge: "Secrétariat / Directeur des Études",
          tabBadge: "Tab Épreuves",
          helpCenterAnchorRole: "SECRETARY",
          helpCenterAnchorTab: "exams",
          summary: "Planification des devoirs surveillés communs, examens blancs (BEPC, BAC) et tirage des sujets d'évaluation.",
          elements: [
            {
              label: "Calendrier des épreuves",
              type: "TABLEAU",
              description: "Date, matière, niveau, salle d'examen et surveillants désignés."
            },
            {
              label: "Bouton 'Planifier une épreuve'",
              type: "BOUTON",
              description: "Ajoute une session d'évaluation avec consignes."
            }
          ],
          howToSteps: [
            "1. Renseignez la date et les matières de l'évaluation.",
            "2. Affectez les surveillants de salle.",
            "3. Imprimez le calendrier des épreuves."
          ],
          tips: ["Prévenez les enseignants au moins une semaine à l'avance."]
        };
      }

      if (currentTab === "PLANNING") {
        return {
          pageTitle: "Planning des Salles & Emploi du Temps",
          roleBadge: "Secrétariat / Directeur des Études",
          tabBadge: "Tab Planning",
          helpCenterAnchorRole: "SECRETARY",
          helpCenterAnchorTab: "planning",
          summary: "Consultation des emplois du temps des classes et occupation des salles de cours et laboratoires.",
          elements: [
            {
              label: "Grille hebdomadaire (Lundi au Samedi)",
              type: "TABLEAU",
              description: "Créneaux horaires de cours par classe et matière."
            }
          ],
          howToSteps: [
            "1. Choisissez la classe ou la salle.",
            "2. Consultez la grille horaire.",
            "3. Imprimez l'emploi du temps."
          ],
          tips: ["Évite les conflits de salles ou de cours simultanés."]
        };
      }

      // Default tab = STUDENTS
      return {
        pageTitle: "Inscriptions & Dossiers Élèves",
        roleBadge: "Secrétariat / Direction",
        tabBadge: "Tab Inscriptions",
        helpCenterAnchorRole: "SECRETARY",
        helpCenterAnchorTab: "enrollment",
        summary: "Enregistrement officiel des nouveaux élèves pour la rentrée, affectation des classes et génération automatique des matricules scolaires.",
        elements: [
          {
            label: "Bouton '+ Nouvel Élève'",
            type: "BOUTON",
            description: "Ouvre le formulaire complet d'admission (État civil, contacts parents, classe)."
          },
          {
            label: "Tableau des élèves inscrits",
            type: "TABLEAU",
            description: "Liste des élèves avec statut du dossier, classe et matricule."
          },
          {
            label: "Barre de recherche rapide",
            type: "FILTRE",
            description: "Recherche instantanée par nom, prénom ou matricule."
          }
        ],
        howToSteps: [
          "1. Cliquez sur 'Nouvel Élève'.",
          "2. Remplissez l'état civil de l'enfant et les numéros des parents.",
          "3. Attribuez la classe d'accueil et enregistrez."
        ],
        tips: ["Le numéro du parent est indispensable pour lui permettre de régler les frais par Mobile Money."]
      };
    }

    // 4. Liste générale des Élèves (/school-admin/students-list)
    if (path === "/school-admin/students-list") {
      return {
        pageTitle: "Annuaire & Liste Complète des Élèves",
        roleBadge: "Secrétariat / Direction / Caisse",
        tabBadge: "Navigation Liste des Élèves",
        helpCenterAnchorRole: "SECRETARY",
        helpCenterAnchorTab: "students_list",
        summary: "Annuaire complet de tous les élèves de l'école : recherche multi-critères, filtrage par classe, impression des listes de classe et export Excel.",
        elements: [
          {
            label: "Filtres par Classe et Niveau",
            type: "FILTRE",
            description: "Permet d'isoler une promotion (ex: 6ème A, Terminale D...)."
          },
          {
            label: "Bouton 'Imprimer la liste de classe'",
            type: "BOUTON",
            description: "Génère la liste d'appel officielle pour les professeurs et surveillants."
          },
          {
            label: "Bouton 'Exporter Excel'",
            type: "BOUTON",
            description: "Télécharge le fichier tableur contenant tous les élèves filtrés."
          },
          {
            label: "Action 'Voir / Modifier la fiche'",
            type: "ACTION",
            description: "Permet de modifier les coordonnées ou d'imprimer la fiche individuelle de l'élève."
          }
        ],
        howToSteps: [
          "1. Sélectionnez la classe souhaitée dans le filtre.",
          "2. Imprimez la liste d'appel pour la classe.",
          "3. Utilisez la barre de recherche pour retrouver un élève précis."
        ],
        tips: ["Les matricules générés sont uniques et suivent l'élève durant toute sa scolarité."]
      };
    }

    // 5. Professeurs (/school-admin/teachers)
    if (path === "/school-admin/teachers") {
      return {
        pageTitle: "Corps Professoral & Affectations",
        roleBadge: "Directeur / Directeur des Études",
        tabBadge: "Navigation Professeurs",
        helpCenterAnchorRole: "DIRECTOR_OF_STUDIES",
        helpCenterAnchorTab: "teachers",
        summary: "Gestion du corps enseignant, attribution des matières et des classes à chaque professeur pour lui donner accès à la saisie des notes.",
        elements: [
          {
            label: "Bouton '+ Ajouter un professeur'",
            type: "BOUTON",
            description: "Crée une fiche enseignant et lui envoie ses identifiants de connexion."
          },
          {
            label: "Tableau des Professeurs",
            type: "TABLEAU",
            description: "Affiche le nom, la discipline principale, les classes affectées et le statut."
          },
          {
            label: "Action 'Gérer les affectations'",
            type: "ACTION",
            description: "Permet de cocher les classes où l'enseignant dispense ses cours."
          }
        ],
        howToSteps: [
          "1. Cliquez sur 'Ajouter un professeur' ou ouvrez un professeur existant.",
          "2. Cochez les classes qui lui sont attribuées.",
          "3. Enregistrez. Le professeur retrouvera automatiquement ces classes sur son espace."
        ],
        tips: ["Un enseignant ne peut saisir des notes que pour les classes qui lui ont été expressément affectées."]
      };
    }

    // 6. Synthèse & Bilans (/school-admin/stats)
    if (path === "/school-admin/stats") {
      return {
        pageTitle: "Synthèse & Bilans Statistiques",
        roleBadge: "Directeur / Admin",
        tabBadge: "Navigation Synthèse & Bilans",
        helpCenterAnchorRole: "SCHOOL_ADMIN",
        helpCenterAnchorTab: "dashboard",
        summary: "Analyses chiffrées de l'établissement : évolution des effectifs, taux de recouvrement financier par classe et statistiques pédagogiques.",
        elements: [
          {
            label: "Graphique des Recouvrements",
            type: "INDICATEUR",
            description: "Taux de paiement de la scolarité par promotion."
          },
          {
            label: "Répartition Filles / Garçons",
            type: "INDICATEUR",
            description: "Statistiques démographiques conformes aux exigences du ministère."
          },
          {
            label: "Bouton 'Imprimer le Rapport Statistique'",
            type: "BOUTON",
            description: "Génère un bilan imprimable pour les conseils d'administration ou les inspections."
          }
        ],
        howToSteps: [
          "1. Examinez les indicateurs de performance.",
          "2. Identifiez les classes présentant un faible taux de recouvrement pour intensifier les relances.",
          "3. Imprimez le rapport de synthèse."
        ],
        tips: ["Les statistiques sont mises à jour automatiquement en temps réel."]
      };
    }

    // 7. Prospectus
    if (path.includes("/prospectus")) {
      return {
        pageTitle: "Prospectus Officiel de l'Établissement",
        roleBadge: "Tous profils",
        tabBadge: "Navigation Prospectus",
        helpCenterAnchorRole: "SCHOOL_ADMIN",
        helpCenterAnchorTab: "prospectus",
        summary: "Brochure numérique officielle présentant l'établissement, les conditions d'admission, les tarifs et les infrastructures avec photos permanentes.",
        elements: [
          {
            label: "Bouton 'Modifier le prospectus' (Directeur/Admin)",
            type: "BOUTON",
            description: "Permet d'éditer les textes et de téléverser des photos des infrastructures scolaires."
          },
          {
            label: "Conservation permanente des photos",
            type: "INDICATEUR",
            description: "Toutes les images uploadées sont conservées en base locale sécurisée et ne disparaissent pas au rafraîchissement."
          },
          {
            label: "Bouton 'Télécharger en PDF'",
            type: "BOUTON",
            description: "Génère la plaquette officielle imprimable pour les familles."
          }
        ],
        howToSteps: [
          "1. Pour modifier : Cliquez sur 'Modifier', changez les textes ou photos, puis cliquez sur 'Enregistrer'.",
          "2. Pour imprimer : Cliquez sur 'Télécharger en PDF'."
        ],
        tips: [
          "Les parents ont accès à cette brochure pour préparer la rentrée de leurs enfants."
        ]
      };
    }

    // 8. Bulletins de notes (/director/bulletins or /school-admin/bulletins)
    if (path.includes("/bulletins")) {
      return {
        pageTitle: "Génération des Bulletins Scolaires Trimestriels",
        roleBadge: "Directeur des Études / Admin",
        tabBadge: "Navigation Bulletins",
        helpCenterAnchorRole: "DIRECTOR_OF_STUDIES",
        helpCenterAnchorTab: "bulletins",
        summary: "Calcul automatique des moyennes pondérées par coefficient, rangs et impression groupée des bulletins officiels béninois.",
        elements: [
          {
            label: "Sélecteur de Classe & Trimestre",
            type: "FILTRE",
            description: "Choix de la division pour laquelle éditer les bulletins."
          },
          {
            label: "Bouton 'Calculer les moyennes et rangs'",
            type: "BOUTON",
            description: "Exécute le calcul officiel selon les coefficients configurés."
          },
          {
            label: "Bouton 'Imprimer les bulletins de la classe'",
            type: "BOUTON",
            description: "Génère l'ensemble des bulletins de la classe prêts à être signés et distribués."
          }
        ],
        howToSteps: [
          "1. Choisissez la classe et le trimestre.",
          "2. Contrôlez les moyennes et ajoutez les appréciations.",
          "3. Imprimez les bulletins complets de la classe."
        ],
        tips: [
          "Les bulletins portent l'entête national béninois officiel, la signature et le tampon de votre établissement."
        ]
      };
    }

    // 9. Planification académique (/director)
    if (path === "/director") {
      return {
        pageTitle: "Planification Académique & Trimestres",
        roleBadge: "Directeur des Études",
        tabBadge: "Navigation Planification",
        helpCenterAnchorRole: "DIRECTOR_OF_STUDIES",
        helpCenterAnchorTab: "academic",
        summary: "Découpage de l'année scolaire en trimestres, fixation des dates limites de saisie des notes et paramétrage des coefficients par matière.",
        elements: [
          {
            label: "Configuration des Trimestres",
            type: "CHAMP",
            description: "Dates d'ouverture et de clôture du 1er, 2ème et 3ème trimestre."
          },
          {
            label: "Tableau des Coefficients",
            type: "TABLEAU",
            description: "Poids officiel de chaque discipline selon les séries (A, B, C, D, Premier cycle)."
          }
        ],
        howToSteps: [
          "1. Définissez les dates des trimestres.",
          "2. Vérifiez la grille des coefficients des matières.",
          "3. Enregistrez les paramètres académiques."
        ],
        tips: ["Le calcul des moyennes sur les bulletins dépend directement des coefficients définis ici."]
      };
    }

    // 10. Surveillant Général (/supervisor)
    if (path === "/supervisor") {
      if (currentTab === "DISCIPLINE") {
        return {
          pageTitle: "Discipline & Registre des Sanctions",
          roleBadge: "Surveillant Général",
          tabBadge: "Tab Discipline",
          helpCenterAnchorRole: "SUPERVISOR",
          helpCenterAnchorTab: "discipline",
          summary: "Enregistrement des manquements disciplinaires, application des sanctions (avertissements, retenues, exclusions) et impression des billets de convocation.",
          elements: [
            {
              label: "Bouton '+ Nouvelle Sanction'",
              type: "BOUTON",
              description: "Ouvre le formulaire pour inscrire un manquement au dossier de l'élève."
            },
            {
              label: "Registre des Sanctions",
              type: "TABLEAU",
              description: "Historique des faits reprochés, gravité, sanction décidée et statut."
            }
          ],
          howToSteps: [
            "1. Cliquez sur 'Nouvelle Sanction' et sélectionnez l'élève.",
            "2. Précisez le motif (insolence, bagarre, retard répété) et la sanction.",
            "3. Enregistrez et imprimez la notification aux parents."
          ],
          tips: ["Le registre disciplinaire est consulté lors des conseils de classe."]
        };
      }

      if (currentTab === "ABSENCES") {
        return {
          pageTitle: "Pointage des Absences & Billets d'Entrée",
          roleBadge: "Surveillant Général",
          tabBadge: "Tab Absences Élèves",
          helpCenterAnchorRole: "SUPERVISOR",
          helpCenterAnchorTab: "absences",
          summary: "Contrôle des présences en classe, gestion des fiches d'appel et délivrance des billets d'entrée pour les élèves retardataires ou revenant d'absence.",
          elements: [
            {
              label: "Registre des absences du jour",
              type: "TABLEAU",
              description: "Élèves signalés absents par heure de cours."
            },
            {
              label: "Bouton 'Délivrer Billet d'Entrée'",
              type: "BOUTON",
              description: "Imprime le billet autorisant l'élève à réintégrer sa classe."
            }
          ],
          howToSteps: [
            "1. Enregistrez les fiches d'appel transmises par les professeurs.",
            "2. Lorsque l'élève se présente avec sa justification, délivrez le billet d'entrée.",
            "3. Mettez à jour le statut en 'Justifié'."
          ],
          tips: ["Aucun élève ne doit rentrer en classe après une absence sans billet visé par la surveillance."]
        };
      }

      if (currentTab === "TRIPS") {
        return {
          pageTitle: "Sorties & Mouvements Exceptionnels",
          roleBadge: "Surveillant Général",
          tabBadge: "Tab Sorties",
          helpCenterAnchorRole: "SUPERVISOR",
          helpCenterAnchorTab: "trips",
          summary: "Autorisations de sortie pendant les heures de cours (maladie, urgence familiale) et contrôle du portail.",
          elements: [
            {
              label: "Bouton 'Délivrer Billet de Sortie'",
              type: "BOUTON",
              description: "Enregistre la sortie avec identité de la personne accompagnatrice."
            }
          ],
          howToSteps: [
            "1. Vérifiez l'identité du parent venu chercher l'élève.",
            "2. Remplissez le motif et l'heure de sortie.",
            "3. Imprimez le bon de sortie à remettre au gardien au portail."
          ],
          tips: ["Sécurise l'établissement contre toute sortie non autorisée."]
        };
      }

      if (currentTab === "TEACHER_ABSENCES") {
        return {
          pageTitle: "Absences des Professeurs & Suppléances",
          roleBadge: "Surveillant Général",
          tabBadge: "Tab Absences Profs",
          helpCenterAnchorRole: "SUPERVISOR",
          helpCenterAnchorTab: "teacher_absences",
          summary: "Suivi des cours non assurés et organisation des salles d'étude ou des professeurs remplaçants.",
          elements: [
            {
              label: "Registre des absences du corps enseignant",
              type: "TABLEAU",
              description: "Professeur, matière, classe impactée et motif."
            }
          ],
          howToSteps: [
            "1. Pointez le professeur absent.",
            "2. Avertissez la classe et organisez la prise en charge en salle d'étude."
          ],
          tips: ["Transmettez le récapitulatif hebdomadaire au Directeur des Études."]
        };
      }

      if (currentTab === "MATERIALS") {
        return {
          pageTitle: "Matériel Scolaire & Inventaire",
          roleBadge: "Surveillant Général",
          tabBadge: "Tab Matériel",
          helpCenterAnchorRole: "SUPERVISOR",
          helpCenterAnchorTab: "materials",
          summary: "Inventaire des tables-bancs, matériel pédagogique, ballons de sport et fournitures de surveillance.",
          elements: [
            {
              label: "Inventaire du mobilier",
              type: "TABLEAU",
              description: "État des équipements par salle de cours."
            }
          ],
          howToSteps: [
            "1. Enregistrez les dotations en matériel.",
            "2. Signalez les réparations de menuiserie ou matériel endommagé."
          ],
          tips: ["Contrôlez les salles en fin de semaine."]
        };
      }

      // Default Supervisor
      return {
        pageTitle: "Tableau de Bord de la Surveillance Générale",
        roleBadge: "Surveillant Général",
        tabBadge: "Navigation Surveillance",
        helpCenterAnchorRole: "SUPERVISOR",
        helpCenterAnchorTab: "discipline",
        summary: "Supervision globale de la vie scolaire : discipline, pointage des présences, contrôle des accès et gestion du matériel.",
        elements: [
          {
            label: "Cartes KPI (Absences du jour, Retards, Sanctions en cours)",
            type: "INDICATEUR",
            description: "Vue instantanée de l'ordre au sein de l'école."
          }
        ],
        howToSteps: [
          "1. Vérifiez les absences signalées dès la première heure.",
          "2. Gérez les retards au portail.",
          "3. Utilisez les onglets supérieurs pour la discipline ou les autorisations de sortie."
        ],
        tips: ["Une rigueur quotidienne assure la tranquillité des cours."]
      };
    }

    // 11. Teacher Page (/teacher)
    if (path === "/teacher") {
      return {
        pageTitle: "Mes Classes & Saisie des Notes",
        roleBadge: "Enseignant / Professeur",
        tabBadge: "Navigation Mes Classes & Notes",
        helpCenterAnchorRole: "TEACHER",
        helpCenterAnchorTab: "classes_notes",
        summary: "Consultation de vos classes affectées et enregistrement des notes d'interrogations et de devoirs surveillés.",
        elements: [
          {
            label: "Sélecteur de Classe et Trimestre",
            type: "FILTRE",
            description: "Permet de choisir la classe (ex: 3ème M1) et la période d'évaluation."
          },
          {
            label: "Tableau de saisie des notes",
            type: "TABLEAU",
            description: "Saisie directe des notes sur 20 pour chaque élève de la classe."
          },
          {
            label: "Bouton 'Enregistrer et Valider les Notes'",
            type: "BOUTON",
            description: "Sauvegarde les notes et recalcule instantanément les moyennes des bulletins."
          }
        ],
        howToSteps: [
          "1. Choisissez votre classe et l'évaluation.",
          "2. Renseignez les notes sur 20.",
          "3. Cliquez sur 'Enregistrer et Valider les Notes'."
        ],
        tips: [
          "Vous pouvez modifier les notes tant que le trimestre n'est pas clôturé par le Directeur des Études."
        ]
      };
    }

    // 12. Parent Pages (/parent)
    if (path === "/parent") {
      return {
        pageTitle: "Espace Parent - Mes Enfants",
        roleBadge: "Parent d'Élève",
        tabBadge: "Navigation Mes Enfants",
        helpCenterAnchorRole: "PARENT",
        helpCenterAnchorTab: "children",
        summary: "Suivi de la scolarité de vos enfants : montant des frais, sommes déjà versées, solde restant et échéances.",
        elements: [
          {
            label: "Cartes des Enfants",
            type: "INDICATEUR",
            description: "Affiche chaque enfant avec sa classe, son matricule et sa jauge de paiement."
          },
          {
            label: "Bouton 'Payer les frais'",
            type: "BOUTON",
            description: "Bascule vers le module de paiement sécurisé par Mobile Money."
          }
        ],
        howToSteps: [
          "1. Consultez la situation de vos enfants.",
          "2. Cliquez sur 'Payer' pour régler une tranche par Mobile Money."
        ],
        tips: [
          "Téléchargez vos reçus directement après la validation par la caisse de l'école."
        ]
      };
    }

    if (path === "/parent/payments") {
      return {
        pageTitle: "Paiement en Ligne des Frais Scolaires",
        roleBadge: "Parent d'Élève",
        tabBadge: "Navigation Paiements",
        helpCenterAnchorRole: "PARENT",
        helpCenterAnchorTab: "payments",
        summary: "Règlement sécurisé de la scolarité et des services (cantine, transport) par Mobile Money (MTN, Moov, Celtiis, Wave) ou virement bancaire.",
        elements: [
          {
            label: "Choix de l'enfant et des frais",
            type: "CHAMP",
            description: "Cochez les frais ou la tranche que vous souhaitez régler."
          },
          {
            label: "Sélection de l'opérateur (MTN / Moov / Celtiis / Wave)",
            type: "CHAMP",
            description: "Affiche le numéro ou compte officiel de l'école vers lequel envoyer l'argent."
          },
          {
            label: "Saisie de la référence SMS",
            type: "CHAMP",
            description: "Renseignez la référence reçue par SMS de votre opérateur pour permettre à la caisse de vérifier le versement."
          },
          {
            label: "Bouton 'Confirmer le paiement'",
            type: "BOUTON",
            description: "Transmet la demande à la caisse de l'école. Votre reçu sera disponible dès validation."
          }
        ],
        howToSteps: [
          "1. Cochez les frais à régler.",
          "2. Faites le transfert Mobile Money vers le numéro officiel indiqué.",
          "3. Saisissez votre numéro émetteur et la référence SMS reçue.",
          "4. Cliquez sur 'Confirmer le paiement'."
        ],
        tips: [
          "Copiez fidèlement la référence de transaction SMS pour que la caisse valide votre reçu sans délai."
        ]
      };
    }

    if (path === "/parent/support") {
      return {
        pageTitle: "Assistance & Réclamations",
        roleBadge: "Parent d'Élève",
        tabBadge: "Navigation Assistance",
        helpCenterAnchorRole: "PARENT",
        helpCenterAnchorTab: "support",
        summary: "Canal de communication direct avec la direction et la caisse de l'établissement.",
        elements: [
          {
            label: "Formulaire de message",
            type: "CHAMP",
            description: "Saisissez l'objet, le nom de votre enfant et votre question."
          },
          {
            label: "Bouton 'Envoyer la demande'",
            type: "BOUTON",
            description: "Transmet votre requête aux équipes de l'école."
          }
        ],
        howToSteps: [
          "1. Précisez l'objet de votre réclamation.",
          "2. Rédigez votre demande avec précision.",
          "3. Cliquez sur 'Envoyer'."
        ],
        tips: ["Pour toute urgence financière, le numéro de téléphone direct de la caisse est disponible."]
      };
    }

    // 13. Super Admin (/super-admin)
    if (path.startsWith("/super-admin")) {
      return {
        pageTitle: "Supervision & Administration Nationale",
        roleBadge: "Super Admin",
        tabBadge: "Navigation Super Admin",
        helpCenterAnchorRole: "SUPER_ADMIN",
        helpCenterAnchorTab: "schools_mgmt",
        summary: "Supervision nationale des établissements scolaires partenaires, gestion des licences et du provisionnement.",
        elements: [
          {
            label: "Liste des Écoles Actives",
            type: "TABLEAU",
            description: "Nom de l'établissement, directeur référent, date de validité et effectif."
          },
          {
            label: "Bouton '+ Nouvelle École'",
            type: "BOUTON",
            description: "Provisionne un nouvel établissement et crée le compte du directeur."
          }
        ],
        howToSteps: [
          "1. Cliquez sur 'Nouvelle École' pour intégrer un établissement.",
          "2. Configurez les accès initiaux du directeur.",
          "3. Surveillez l'activité des licences."
        ],
        tips: ["Les données de chaque établissement sont isolées de manière hermétique."]
      };
    }

    // Generic fallback for any other registered page
    return {
      pageTitle: `Module de Gestion - ${path.replace('/', '')}`,
      roleBadge: user?.role || "Utilisateur",
      tabBadge: currentTab ? `Tab ${currentTab}` : "Section Active",
      helpCenterAnchorRole: user?.role || "SCHOOL_ADMIN",
      summary: "Module actif de l'application EduBénin. Utilisez les commandes à l'écran pour consulter et modifier les informations.",
      elements: [
        {
          label: "Barre d'actions et filtres",
          type: "ACTION",
          description: "Permet de filtrer, rechercher et exporter les données affichées."
        }
      ],
      howToSteps: [
        "1. Consultez les informations affichées dans les tableaux ou formulaires.",
        "2. Utilisez les boutons d'action pour enregistrer ou imprimer vos états."
      ],
      tips: [
        "Pour des explications complètes de chaque profil, consultez le Centre d'Aide officiel."
      ]
    };
  }, [location.pathname, currentTab, user?.role]);

  if (!guideData) return null;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-2 print:hidden">
      {/* Collapsed Bar State */}
      {!isOpen ? (
        <div 
          onClick={toggleOpen}
          className="bg-white hover:bg-emerald-50/50 p-3 sm:p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles size={14} />
            </span>
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold text-gray-900 truncate">
                💡 Guide & Fonctionnement : <span className="text-emerald-700">{guideData.pageTitle}</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase font-mono">
                {guideData.tabBadge}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-emerald-700 group-hover:underline hidden md:inline">
              Afficher le fonctionnement de chaque élément & la procédure
            </span>
            <button
              type="button"
              className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 group-hover:bg-emerald-200 transition"
            >
              <span>Comment ça marche ?</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Full Guide Card */
        <div className="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md overflow-hidden animate-in zoom-in-98 duration-200">
          
          {/* Card Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} /> Guide Contextuel Actif
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-200 font-mono">
                  {guideData.tabBadge}
                </span>
                <span className="text-xs text-slate-400">
                  {guideData.roleBadge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>💡 {guideData.pageTitle}</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                {guideData.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <Link
                to={`/help?role=${guideData.helpCenterAnchorRole || user?.role || "SCHOOL_ADMIN"}${guideData.helpCenterAnchorTab ? `&tab=${guideData.helpCenterAnchorTab}` : ""}`}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-white/10"
                title="Consulter le Centre d'Aide complet"
              >
                <BookOpen size={13} />
                <span>Documentation Complète</span>
              </Link>

              <button
                type="button"
                onClick={toggleOpen}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Masquer le guide de cette page"
              >
                <ChevronUp size={18} />
              </button>
            </div>
          </div>

          {/* Guide Content: Elements breakdown, procedure and tips */}
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* 1. How Each Element Works */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal size={15} className="text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Fonctionnement de chaque élément sur cette page :
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {guideData.elements.map((el, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-900 line-clamp-1">
                        {el.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 shrink-0">
                        {el.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {el.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Step by Step Procedure & Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
              
              {/* Steps (2 cols) */}
              <div className="lg:col-span-2 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  Comment procéder étape par étape (Procédure recommandée) :
                </h4>
                
                <div className="space-y-2">
                  {guideData.howToSteps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2.5 p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-100">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {sIdx + 1}
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & Rules (1 col) */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-600" />
                  Règles & Pièges à éviter :
                </h4>
                
                <ul className="space-y-2">
                  {guideData.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="text-xs text-amber-950 flex items-start gap-2 leading-relaxed">
                      <Check size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

          {/* Card Footer Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 px-5 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Info size={13} className="text-slate-400" />
              <span>Vous pouvez réduire ce guide à tout moment. Il reste accessible via le bouton 'Guide de la page' en haut.</span>
            </span>

            <button
              type="button"
              onClick={toggleOpen}
              className="text-xs font-bold text-slate-600 hover:text-gray-900 underline"
            >
              Réduire pour cette page
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

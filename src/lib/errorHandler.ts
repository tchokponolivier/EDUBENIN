/**
 * Transform technical Supabase, fetch, or database errors into clear, friendly French messages.
 */
export function formatErrorMessage(error: any): string {
  if (!error) return "Une erreur inattendue est survenue.";

  // If error is already a friendly string
  if (typeof error === 'string') {
    return translateErrorString(error);
  }

  const message = error.message || error.error_description || error.details || '';
  const code = error.code || '';

  // Specific Supabase error codes
  switch (code) {
    case '42501':
      return "Accès restreint (RLS) : Vous n'avez pas les permissions suffisantes pour effectuer cette modification.";
    case '23505':
      return "Cette donnée existe déjà dans la base (identifiant ou email déjà enregistré).";
    case '23503':
      return "Cette opération fait référence à un élément (école, classe, cours) qui n'existe plus ou a été supprimé.";
    case '22P02':
      return "Format d'identifiant ou de données invalide (syntaxe UUID incorrecte).";
    case 'PGRST116':
      return "Aucun enregistrement correspondant trouvé dans la base.";
    case 'PGRST204':
      return "Colonne introuvable dans la base de données.";
    default:
      break;
  }

  // Handle message patterns
  if (message) {
    return translateErrorString(message);
  }

  return "Une erreur technique s'est produite. Veuillez réessayer ou contacter le support.";
}

function translateErrorString(msg: string): string {
  const lower = msg.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid_grant")) {
    return "Email ou mot de passe incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Votre adresse email n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  if (lower.includes("networkerror") || lower.includes("failed to fetch") || lower.includes("network request failed")) {
    return "Erreur de connexion internet ou serveur injoignable. Vérifiez votre connexion.";
  }
  if (lower.includes("violates row-level security policy")) {
    return "Opération refusée par les règles de sécurité de l'établissement.";
  }
  if (lower.includes("jwt expired") || lower.includes("session expired")) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }
  if (lower.includes("foreign key")) {
    return "L'élément rattaché (école ou utilisateur) est introuvable ou a été supprimé.";
  }

  return msg;
}

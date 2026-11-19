// Le bouton « Contacter » des pages générées (hébergement Finistère).
//
// ⚠️ LA DESTINATION N'EST JAMAIS CHOISIE CÔTÉ CLIENT : le formulaire porte
//    l'identifiant de la fiche (`data-entite-id`), et c'est le serveur
//    (relais-courriel, clé service) qui résout l'adresse du destinataire.
//    Ne JAMAIS ajouter de champ « destinataire » ici — ce serait un émetteur
//    de courrier anonyme signé de notre domaine.
//
// La clé ci-dessous est la clé ANON publique : elle est livrée à tout
// navigateur du produit par construction, ce n'est pas un secret. Elle ne
// donne accès qu'aux RPC/fonctions explicitement ouvertes à `anon`.

export const RELAIS_URL =
  "https://db.temposystem.fr/functions/v1/relais-courriel";
export const CLE_ANON_PUBLIQUE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg0NzUzODA3LCJleHAiOjE5NDI0MzM4MDd9.vn2mcmhK6396qYlhDAC7_bBbKIHs8jPyUxww0ZYbHCo";

/**
 * Le corps exact attendu par relais-courriel. Sept champs, pas un de plus :
 * `botcheck` est le piège à robots (rempli = on répond « envoyé », rien ne
 * part). Un test verrouille cette liste de clés.
 */
export function construireCorpsRelais({ entiteId, nom, expediteur, message, titre, lien, botcheck }) {
  if (!entiteId) throw new Error("entite_id manquant : pas de relais sans identifiant de fiche");
  return JSON.stringify({
    entite_id: entiteId,
    nom: String(nom ?? "").trim().slice(0, 120),
    expediteur: String(expediteur ?? "").trim().toLowerCase(),
    message: String(message ?? "").trim(),
    titre: String(titre ?? "").trim().slice(0, 200),
    lien: String(lien ?? "").trim().slice(0, 400),
    botcheck: String(botcheck ?? "").trim(),
  });
}

const ADRESSE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;
const MIN_MESSAGE = 20;
const MAX_MESSAGE = 4000;

async function envoyerRelais(form) {
  const statut = form.querySelector(".relais-statut");
  const dire = (texte, role) => {
    if (statut) {
      statut.textContent = texte;
      statut.setAttribute("role", role);
    }
  };
  const entiteId = form.getAttribute("data-entite-id") ?? "";
  const nom = form.elements.nom?.value ?? "";
  const expediteur = form.elements.expediteur?.value ?? "";
  const message = form.elements.message?.value ?? "";
  const botcheck = form.elements.botcheck?.value ?? "";

  if (!nom.trim()) return dire("Dites qui vous êtes.", "alert"), false;
  if (!ADRESSE.test(expediteur.trim())) return dire("Indiquez une adresse où l'on peut vous répondre.", "alert"), false;
  if (message.trim().length < MIN_MESSAGE) return dire("Écrivez quelques mots de plus.", "alert"), false;
  if (message.trim().length > MAX_MESSAGE) return dire("Votre message dépasse 4 000 caractères.", "alert"), false;

  const corps = construireCorpsRelais({
    entiteId,
    nom,
    expediteur,
    message,
    titre: form.getAttribute("data-titre") ?? "",
    lien: form.getAttribute("data-lien") ?? window.location.href,
    botcheck,
  });

  try {
    const r = await fetch(RELAIS_URL, {
      method: "POST",
      headers: {
        apikey: CLE_ANON_PUBLIQUE,
        Authorization: `Bearer ${CLE_ANON_PUBLIQUE}`,
        "Content-Type": "application/json",
      },
      body: corps,
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && (d.envoye || d.ok)) {
      // ⚠️ On affiche ce que le serveur dit, ou la confirmation standard —
      //    jamais un « envoyé » que le serveur n'a pas renvoyé.
      dire(d.message ?? "Votre message est parti. La structure vous répondra directement par courriel.", "status");
      form.reset();
      return true;
    }
    // Les messages d'erreur du relais sont rédigés pour un lecteur humain
    // (429 trop de messages, 404 pas de destination, 502/503 indisponible) :
    // on les affiche tels quels.
    dire(d.message ?? "Le message n'a pas pu partir. Réessayez dans un instant.", "alert");
    return false;
  } catch {
    dire("Le relais n'a pas répondu. Réessayez dans un instant.", "alert");
    return false;
  }
}

if (typeof document !== "undefined") {
  for (const form of document.querySelectorAll("form[data-relais]")) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bouton = form.querySelector("button[type=submit]");
      if (bouton) bouton.disabled = true;
      envoyerRelais(form).finally(() => {
        if (bouton) bouton.disabled = false;
      });
    });
  }
}

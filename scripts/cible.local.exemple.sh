# MODÈLE — copiez-moi en `scripts/cible.local.sh` et remplissez les deux lignes.
#
#     cp scripts/cible.local.exemple.sh scripts/cible.local.sh
#
# 🔴 POURQUOI CE DÉTOUR PLUTÔT QU'UNE VALEUR PAR DÉFAUT DANS LE SCRIPT.
#    Ce dépôt est PUBLIC. `scripts/deployer.sh` portait
#    `HOTE="${MANA_HOTE:-debian@…}"` : aucun secret — l'accès est par clé —
#    mais une adresse, un compte et des chemins de production offerts sur une
#    page indexée.
# ⭐ ET LA VALEUR PAR DÉFAUT EST LE PIÈGE, pas l'adresse. Un `${VAR:-valeur}`
#    a l'air paramétrable et publie quand même : il rend la variable
#    FACULTATIVE, donc personne ne la pose, donc c'est la valeur écrite qui
#    sert — et elle reste dans le dépôt. Les deux sont désormais EXIGÉES, ce
#    qui est la seule façon qu'un paramètre soit vraiment un paramètre.
#    (Même parade que `~/mana/deploiement/cible.local.sh`, posée le 5/11.)

MANA_HOTE=utilisateur@adresse
MANA_CIBLE=/chemin/servi/par/le/serveur/

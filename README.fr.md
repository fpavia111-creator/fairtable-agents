# Agents Fairtable pour la restauration

*Traduit par Claude ; relecture par un locuteur natif à venir. La [README](README.md) anglaise fait foi.*

Trente-deux petits agents MCP pour le back-office des restaurants, bars, cafés et groupes multi-établissements. Chacun est chargé d’**une seule tâche**, par exemple le coût matière réel face au théorique, le pool de pourboires, les versements des applis de livraison ou la matrice des allergènes, et ne peut pas agir au-delà. Ils lisent les fichiers que vous exportez déjà de votre caisse, de votre planning, de vos factures fournisseurs, des applis de livraison et du système de réservation, écrivent leurs rapports sur votre ordinateur et attendent une personne nommée avant tout ce qui déplace de l’argent, envoie un message ou modifie un système en production.

Fait partie de Fair Agents par Mythos Machines. Licence MIT · Node 20 ou plus · fichiers locaux uniquement · aucun identifiant · aucune dépendance. Le logiciel est gratuit ; ce qui est payant, c’est la mise en place à prix fixe sur vos propres fichiers.

## Essayer

```bash
npx -y apricot-of-food-cost demo            # coût matière réel face au théorique, données fictives
npx -y jackfruit-of-delivery-payouts demo   # versements des applis de livraison face aux commandes
```

Chaque agent a une `demo` sur des fichiers fictifs, un `eval` avec ses propres cas de test et un serveur MCP (`npx -y <agent> mcp --root <dossier>`).

## Les agents

**Matières, achats et bar (9) :** `apricot-of-food-cost` (coût matière réel et théorique), `banana-of-recipe-costs` (coût des recettes aux derniers prix), `blackberry-of-price-creep` (hausses de prix rampantes), `blueberry-of-deliveries` (factures face aux réceptions et aux avoirs), `cherry-of-counts` (écarts d’inventaire), `clementine-of-waste` (registre des pertes), `coconut-of-pours` (coût de service au bar), `lime-of-menu-mix` (ingénierie de menu), `lychee-of-stockouts` (articles épuisés).

**Salle et caisse (6) :** `cranberry-of-voids` (annulations et offerts), `date-of-discounts` (remises et promotions), `elderberry-of-drawers` (écarts de caisse), `kumquat-of-gift-cards` (cartes-cadeaux), `mango-of-no-shows` (réservations non honorées), `melon-of-catering` (acomptes traiteur).

**Personnel (5) :** `fig-of-tip-pools` (pool de pourboires), `grape-of-overtime` (heures supplémentaires, services coupés), `guava-of-schedules` (planifié face au réel), `huckleberry-of-dayparts` (main-d’œuvre par service), `raspberry-of-breaks` (pauses et mineurs).

**Livraison, frais, taxes et factures (6) :** `jackfruit-of-delivery-payouts` (versements), `kiwi-of-marketing-fees` (frais marketing), `plum-of-card-fees` (frais de carte), `lemon-of-sales-tax` (taxe sur les ventes), `quince-of-invoices` (factures en double, imputation), `nectarine-of-utilities` (énergie et eau).

**Conformité et multi-sites (6) :** `olive-of-equipment` (entretien des équipements), `orange-of-inspections` (inspections et permis), `papaya-of-food-handlers` (attestations d’hygiène), `peach-of-allergens` (matrice des allergènes), `mulberry-of-prime-cost` (coût principal), `pear-of-locations` (comparaison des établissements).

## Sécurité

- **Une tâche par agent.** Tout autre nom d’outil est bloqué.
- **Rien d’engageant ne se fait tout seul.** Aucun agent ne paie, ne rembourse, ne modifie la caisse, ne publie de planning, ne lance la paie, ne déclare d’impôt ni n’envoie de message. Les brouillons sont enregistrés comme DRAFT ; leur validation exige toujours le clic d’une personne nommée, même en mode Auto.
- **Données personnelles masquées.** Les noms, téléphones et e-mails du personnel et des clients n’apparaissent dans les résultats pour le modèle que sous forme de jetons comme `A.R.#3f9a2c` ; les fichiers sur votre ordinateur gardent les vraies valeurs.
- **Fichiers locaux uniquement**, aucun réseau, journal d’audit chaîné par hachage dans `.fairtable/`.
- **Vos règles.** Objectifs, seuils, salaires, taux de taxe, règles de pause et listes d’allergènes sont des paramètres dans votre propre fichier.

## Tests

807 tests et 703 cas d’évaluation passent sous Windows avec Node 24 (au moins 21 par agent) ; les passes d’entrées hostiles ne trouvent rien. Détails dans [REVIEW-ver1.md](REVIEW-ver1.md).

## Limites

Les colonnes des exports nommés ont été écrites d’après la connaissance de ces systèmes, sans compte réel. Les règles de salaire, de taxe, de pause et d’hygiène varient selon le pays et la région ; un professionnel les confirme. Ce n’est pas un conseil juridique, fiscal, social ou sanitaire.

MIT © 2026 Kurt Francisco

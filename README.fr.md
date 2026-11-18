# Agents Fairtable pour la restauration

*Traduit par Claude ; relecture par un locuteur natif à venir. La [README](README.md) anglaise fait foi.*

Trente-deux petits agents MCP pour le back-office des restaurants, bars, cafés et groupes multi-établissements. Chacun est chargé d’**une seule tâche**, par exemple le coût matière réel face au théorique, le pool de pourboires, les versements des applis de livraison ou la matrice des allergènes, et ne peut pas agir au-delà. Ils lisent les fichiers que vous exportez déjà de votre caisse, de votre planning, de vos factures fournisseurs, des applis de livraison et du système de réservation, écrivent leurs rapports sur votre ordinateur et attendent une personne nommée avant tout ce qui déplace de l’argent, envoie un message ou modifie un système en production.

Fait partie de Fair Agents par Mythos Machines. Licence MIT · Node 20 ou plus · fichiers locaux uniquement · aucun identifiant · aucune dépendance. Le logiciel est gratuit ; ce qui est payant, c’est la mise en place à prix fixe sur vos propres fichiers.

## Essayer

```bash
npx -y fairtable-food-cost demo            # coût matière réel face au théorique, données fictives
npx -y fairtable-delivery-payouts demo   # versements des applis de livraison face aux commandes
```

Chaque agent a une `demo` sur des fichiers fictifs, un `eval` avec ses propres cas de test et un serveur MCP (`npx -y <agent> mcp --root <dossier>`).

## Les agents

**Matières, achats et bar (9) :** `fairtable-food-cost` (coût matière réel et théorique), `fairtable-recipe-costs` (coût des recettes aux derniers prix), `fairtable-price-creep` (hausses de prix rampantes), `fairtable-receiving-credits` (factures face aux réceptions et aux avoirs), `fairtable-inventory-counts` (écarts d’inventaire), `fairtable-waste-log` (registre des pertes), `fairtable-pour-cost` (coût de service au bar), `fairtable-menu-engineering` (ingénierie de menu), `fairtable-stockouts` (articles épuisés).

**Salle et caisse (6) :** `fairtable-voids-comps` (annulations et offerts), `fairtable-discounts-promos` (remises et promotions), `fairtable-cash-drawers` (écarts de caisse), `fairtable-gift-cards` (cartes-cadeaux), `fairtable-no-shows` (réservations non honorées), `fairtable-catering-deposits` (acomptes traiteur).

**Personnel (5) :** `fairtable-tip-pooling` (pool de pourboires), `fairtable-overtime` (heures supplémentaires, services coupés), `fairtable-schedule-vs-actual` (planifié face au réel), `fairtable-labor-dayparts` (main-d’œuvre par service), `fairtable-meal-breaks` (pauses et mineurs).

**Livraison, frais, taxes et factures (6) :** `fairtable-delivery-payouts` (versements), `fairtable-delivery-marketing` (frais marketing), `fairtable-card-fees` (frais de carte), `fairtable-sales-tax` (taxe sur les ventes), `fairtable-duplicate-invoices` (factures en double, imputation), `fairtable-utility-bills` (énergie et eau).

**Conformité et multi-sites (6) :** `fairtable-equipment-maintenance` (entretien des équipements), `fairtable-health-inspections` (inspections et permis), `fairtable-food-handler-cards` (attestations d’hygiène), `fairtable-allergen-matrix` (matrice des allergènes), `fairtable-prime-cost` (coût principal), `fairtable-location-comparison` (comparaison des établissements).

## Sécurité

- **Une tâche par agent.** Tout autre nom d’outil est bloqué.
- **Rien d’engageant ne se fait tout seul.** Aucun agent ne paie, ne rembourse, ne modifie la caisse, ne publie de planning, ne lance la paie, ne déclare d’impôt ni n’envoie de message. Les brouillons sont enregistrés comme DRAFT ; leur validation exige toujours le clic d’une personne nommée, même en mode Auto.
- **Données personnelles masquées.** Les noms, téléphones et e-mails du personnel et des clients n’apparaissent dans les résultats pour le modèle que sous forme de jetons comme `A.R.#3f9a2c` ; les fichiers sur votre ordinateur gardent les vraies valeurs.
- **Fichiers locaux uniquement**, aucun réseau, journal d’audit chaîné par hachage dans `.fairtable/`.
- **Vos règles.** Objectifs, seuils, salaires, taux de taxe, règles de pause et listes d’allergènes sont des paramètres dans votre propre fichier.

## Tests

808 tests et 703 cas d’évaluation passent sous Windows avec Node 24 (au moins 21 par agent) ; les passes d’entrées hostiles ne trouvent rien. Détails dans [REVIEW-ver1.md](REVIEW-ver1.md).

## Limites

Les colonnes des exports nommés ont été écrites d’après la connaissance de ces systèmes, sans compte réel. Les règles de salaire, de taxe, de pause et d’hygiène varient selon le pays et la région ; un professionnel les confirme. Ce n’est pas un conseil juridique, fiscal, social ou sanitaire.

MIT © 2026 Kurt Francisco

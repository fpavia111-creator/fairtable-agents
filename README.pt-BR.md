# Agentes Fairtable para restaurantes

*Traduzido pelo Claude; revisão por falante nativo pendente. A [README](README.md) em inglês é a referência.*

Trinta e dois pequenos agentes MCP para o administrativo de restaurantes, bares, cafés e grupos com várias unidades. Cada um cuida de **uma única tarefa**, como custo de alimentos real frente ao teórico, rateio de gorjetas, repasses dos apps de entrega ou a matriz de alérgenos, e não consegue agir fora dela. Eles leem os arquivos que você já exporta do PDV, da escala, das notas dos fornecedores, dos apps de entrega e do sistema de reservas, gravam relatórios no seu computador e esperam por uma pessoa nomeada antes de movimentar dinheiro, enviar uma mensagem ou alterar um sistema em uso.

Parte do Fair Agents da Mythos Machines. Licença MIT · Node 20 ou mais recente · só arquivos locais · sem credenciais · sem dependências. O software é gratuito; o que se paga é a implantação a preço fixo nos seus próprios arquivos.

## Experimente

```bash
npx -y fairtable-food-cost demo            # custo de alimentos real frente ao teórico, dados fictícios
npx -y fairtable-delivery-payouts demo   # repasses dos apps de entrega frente aos pedidos
```

Cada agente tem uma `demo` com arquivos fictícios, um `eval` com casos de teste próprios e um servidor MCP (`npx -y <agente> mcp --root <pasta>`).

## Os agentes

**Alimentos, compras e bar (9):** `fairtable-food-cost` (custo real frente ao teórico), `fairtable-recipe-costs` (custo das receitas aos últimos preços), `fairtable-price-creep` (aumentos graduais de preço), `fairtable-receiving-credits` (notas frente ao recebimento e créditos), `fairtable-inventory-counts` (variação de estoque), `fairtable-waste-log` (registro de desperdício), `fairtable-pour-cost` (custo de dose no bar), `fairtable-menu-engineering` (engenharia de cardápio), `fairtable-stockouts` (itens esgotados).

**Salão e caixa (6):** `fairtable-voids-comps` (cancelamentos e cortesias), `fairtable-discounts-promos` (descontos e promoções), `fairtable-cash-drawers` (sobras e faltas de caixa), `fairtable-gift-cards` (cartões-presente), `fairtable-no-shows` (reservas não comparecidas), `fairtable-catering-deposits` (sinais de catering).

**Equipe (5):** `fairtable-tip-pooling` (rateio de gorjetas), `fairtable-overtime` (horas extras, turnos divididos), `fairtable-schedule-vs-actual` (escala frente ao real), `fairtable-labor-dayparts` (mão de obra por período), `fairtable-meal-breaks` (intervalos e menores).

**Entrega, taxas, impostos e contas (6):** `fairtable-delivery-payouts` (repasses), `fairtable-delivery-marketing` (marketing), `fairtable-card-fees` (taxas de cartão), `fairtable-sales-tax` (imposto sobre vendas), `fairtable-duplicate-invoices` (notas duplicadas, classificação contábil), `fairtable-utility-bills` (contas de serviços).

**Conformidade e várias unidades (6):** `fairtable-equipment-maintenance` (manutenção de equipamentos), `fairtable-health-inspections` (inspeções e licenças), `fairtable-food-handler-cards` (carteiras de manipulador), `fairtable-allergen-matrix` (matriz de alérgenos), `fairtable-prime-cost` (custo primário), `fairtable-location-comparison` (comparação de unidades).

## Segurança

- **Uma tarefa por agente.** Qualquer outro nome de ferramenta é bloqueado.
- **Nada vinculante acontece sozinho.** Nenhum agente paga, reembolsa, altera o PDV, publica escalas, roda a folha, entrega impostos ou envia mensagens. Rascunhos são salvos como DRAFT; aprovar sempre exige o clique de uma pessoa nomeada, mesmo no modo Auto.
- **Dados pessoais mascarados.** Nomes, telefones e e-mails da equipe e dos clientes chegam ao modelo apenas como códigos como `A.R.#3f9a2c`; os arquivos no seu computador mantêm os valores reais.
- **Só arquivos locais**, sem rede, com registro de auditoria encadeado por hash em `.fairtable/`.
- **Suas regras.** Metas, limites, salários, alíquotas, regras de intervalo e listas de alérgenos são configurações no seu próprio arquivo.

## Testes

808 testes e 703 casos de avaliação passam no Windows com Node 24 (pelo menos 21 por agente); as rodadas com entradas hostis não encontram nada. Detalhes em [REVIEW-ver1.md](REVIEW-ver1.md).

## Limites

As colunas das exportações nomeadas foram escritas a partir do conhecimento desses sistemas, sem conta real. Regras de salário, impostos, intervalos e vigilância sanitária variam por país e região; um profissional as confirma. Não é aconselhamento jurídico, fiscal, trabalhista ou sanitário.

MIT © 2026 Kurt Francisco

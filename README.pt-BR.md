# Agentes Fairtable para restaurantes

*Traduzido pelo Claude; revisão por falante nativo pendente. A [README](README.md) em inglês é a referência.*

Trinta e dois pequenos agentes MCP para o administrativo de restaurantes, bares, cafés e grupos com várias unidades. Cada um cuida de **uma única tarefa**, como custo de alimentos real frente ao teórico, rateio de gorjetas, repasses dos apps de entrega ou a matriz de alérgenos, e não consegue agir fora dela. Eles leem os arquivos que você já exporta do PDV, da escala, das notas dos fornecedores, dos apps de entrega e do sistema de reservas, gravam relatórios no seu computador e esperam por uma pessoa nomeada antes de movimentar dinheiro, enviar uma mensagem ou alterar um sistema em uso.

Parte do Fair Agents da Mythos Machines. Licença MIT · Node 20 ou mais recente · só arquivos locais · sem credenciais · sem dependências. O software é gratuito; o que se paga é a implantação a preço fixo nos seus próprios arquivos.

## Experimente

```bash
npx -y apricot-of-food-cost demo            # custo de alimentos real frente ao teórico, dados fictícios
npx -y jackfruit-of-delivery-payouts demo   # repasses dos apps de entrega frente aos pedidos
```

Cada agente tem uma `demo` com arquivos fictícios, um `eval` com casos de teste próprios e um servidor MCP (`npx -y <agente> mcp --root <pasta>`).

## Os agentes

**Alimentos, compras e bar (9):** `apricot-of-food-cost` (custo real frente ao teórico), `banana-of-recipe-costs` (custo das receitas aos últimos preços), `blackberry-of-price-creep` (aumentos graduais de preço), `blueberry-of-deliveries` (notas frente ao recebimento e créditos), `cherry-of-counts` (variação de estoque), `clementine-of-waste` (registro de desperdício), `coconut-of-pours` (custo de dose no bar), `lime-of-menu-mix` (engenharia de cardápio), `lychee-of-stockouts` (itens esgotados).

**Salão e caixa (6):** `cranberry-of-voids` (cancelamentos e cortesias), `date-of-discounts` (descontos e promoções), `elderberry-of-drawers` (sobras e faltas de caixa), `kumquat-of-gift-cards` (cartões-presente), `mango-of-no-shows` (reservas não comparecidas), `melon-of-catering` (sinais de catering).

**Equipe (5):** `fig-of-tip-pools` (rateio de gorjetas), `grape-of-overtime` (horas extras, turnos divididos), `guava-of-schedules` (escala frente ao real), `huckleberry-of-dayparts` (mão de obra por período), `raspberry-of-breaks` (intervalos e menores).

**Entrega, taxas, impostos e contas (6):** `jackfruit-of-delivery-payouts` (repasses), `kiwi-of-marketing-fees` (marketing), `plum-of-card-fees` (taxas de cartão), `lemon-of-sales-tax` (imposto sobre vendas), `quince-of-invoices` (notas duplicadas, classificação contábil), `nectarine-of-utilities` (contas de serviços).

**Conformidade e várias unidades (6):** `olive-of-equipment` (manutenção de equipamentos), `orange-of-inspections` (inspeções e licenças), `papaya-of-food-handlers` (carteiras de manipulador), `peach-of-allergens` (matriz de alérgenos), `mulberry-of-prime-cost` (custo primário), `pear-of-locations` (comparação de unidades).

## Segurança

- **Uma tarefa por agente.** Qualquer outro nome de ferramenta é bloqueado.
- **Nada vinculante acontece sozinho.** Nenhum agente paga, reembolsa, altera o PDV, publica escalas, roda a folha, entrega impostos ou envia mensagens. Rascunhos são salvos como DRAFT; aprovar sempre exige o clique de uma pessoa nomeada, mesmo no modo Auto.
- **Dados pessoais mascarados.** Nomes, telefones e e-mails da equipe e dos clientes chegam ao modelo apenas como códigos como `A.R.#3f9a2c`; os arquivos no seu computador mantêm os valores reais.
- **Só arquivos locais**, sem rede, com registro de auditoria encadeado por hash em `.fairtable/`.
- **Suas regras.** Metas, limites, salários, alíquotas, regras de intervalo e listas de alérgenos são configurações no seu próprio arquivo.

## Testes

807 testes e 703 casos de avaliação passam no Windows com Node 24 (pelo menos 21 por agente); as rodadas com entradas hostis não encontram nada. Detalhes em [REVIEW-ver1.md](REVIEW-ver1.md).

## Limites

As colunas das exportações nomeadas foram escritas a partir do conhecimento desses sistemas, sem conta real. Regras de salário, impostos, intervalos e vigilância sanitária variam por país e região; um profissional as confirma. Não é aconselhamento jurídico, fiscal, trabalhista ou sanitário.

MIT © 2026 Kurt Francisco

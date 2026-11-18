// The words on a report page, in the nine report languages: page headings, section
// headings and the common column names. `--lang` (or FAIRTABLE_LANG) picks the language.
//
// What does not change with the language: the CSV file (its column names are read by
// scripts), finding codes and status values, the finding sentences and the notes under
// "Limits". A page in another language says so in its footer.
//
// Translations are written by Claude and marked for review by a native speaker.
// A string with no translation is shown in English, never left blank.
import { normLang } from './lang.js';

const ORDER = ['de', 'fr', 'es', 'pt', 'it', 'ja', 'zh', 'ko'];

// English: [de, fr, es, pt, it, ja, zh, ko]. {d} is a date, {1} {2} are numbers.
const PAGE = {
  'All rows ({1})': ['Alle Zeilen ({1})', 'Toutes les lignes ({1})', 'Todas las filas ({1})', 'Todas as linhas ({1})', 'Tutte le righe ({1})', '全行（{1}）', '全部行（{1}）', '전체 행 ({1})'],
  Limits: ['Grenzen', 'Limites', 'Límites', 'Limites', 'Limiti', '制限事項', '限制说明', '한계'],
  'None.': ['Keine.', 'Aucun.', 'Ninguno.', 'Nenhum.', 'Nessuno.', 'なし。', '无。', '없음.'],
  'Written by a Fairtable agent from your files. Nothing was sent or paid.': [
    'Von einem Fairtable-Agenten aus Ihren Dateien erstellt. Es wurde nichts gesendet oder bezahlt.',
    'Rédigé par un agent Fairtable à partir de vos fichiers. Rien n’a été envoyé ni payé.',
    'Escrito por un agente Fairtable a partir de sus archivos. No se envió ni se pagó nada.',
    'Escrito por um agente Fairtable a partir dos seus arquivos. Nada foi enviado nem pago.',
    'Scritto da un agente Fairtable a partire dai vostri file. Nulla è stato inviato o pagato.',
    'Fairtable エージェントがお客様のファイルから作成しました。送信も支払いも行っていません。',
    '由 Fairtable 智能体根据您的文件生成。未发送任何内容，也未付款。',
    'Fairtable 에이전트가 귀사의 파일로 작성했습니다. 아무것도 전송하거나 지급하지 않았습니다.'],
  'The summary line, finding texts, codes and the notes under Limits are in English. This page was translated by Claude; a native speaker has not reviewed it yet.': [
    'Die Zusammenfassung, die Befundtexte, die Codes und die Hinweise unter „Grenzen“ sind auf Englisch. Diese Seite wurde von Claude übersetzt; eine Prüfung durch Muttersprachler steht noch aus.',
    'La ligne de synthèse, les textes des constats, les codes et les notes sous « Limites » sont en anglais. Cette page a été traduite par Claude ; elle n’a pas encore été relue par un locuteur natif.',
    'La línea de resumen, los textos de los hallazgos, los códigos y las notas de «Límites» están en inglés. Esta página fue traducida por Claude; todavía no la ha revisado un hablante nativo.',
    'A linha de resumo, os textos dos apontamentos, os códigos e as notas em “Limites” estão em inglês. Esta página foi traduzida pelo Claude; ainda não foi revisada por um falante nativo.',
    'La riga di sintesi, i testi dei rilievi, i codici e le note sotto «Limiti» sono in inglese. Questa pagina è stata tradotta da Claude; non è ancora stata rivista da un madrelingua.',
    '概要行、指摘の本文、コード、「制限事項」の注記は英語です。このページは Claude が翻訳しました。ネイティブによる確認はまだ行われていません。',
    '摘要行、发现项的文字、代码以及“限制说明”下的备注为英文。本页由 Claude 翻译，尚未经母语人士审校。',
    '요약 문장, 지적 사항의 문구, 코드와 “한계” 아래의 주석은 영어입니다. 이 페이지는 Claude가 번역했으며 원어민 검토는 아직 이루어지지 않았습니다.'],
};

// Report titles, one per Fairtable agent.
const TITLES = {
  'Actual against theoretical food cost': ['Ist- gegenüber Soll-Wareneinsatz', 'Coût matière réel face au théorique', 'Costo de alimentos real frente al teórico', 'Custo de alimentos real frente ao teórico', 'Food cost effettivo rispetto al teorico', '実際原価と理論原価の比較', '实际食材成本与理论成本对比', '실제 식재료 원가 대 이론 원가'],
  'Recipe costs at latest invoice prices': ['Rezeptkosten zu den letzten Rechnungspreisen', 'Coût des recettes aux derniers prix facturés', 'Costo de recetas a los últimos precios facturados', 'Custo das receitas aos últimos preços faturados', 'Costo delle ricette agli ultimi prezzi fatturati', '最新の請求単価によるレシピ原価', '按最新发票价格计算的配方成本', '최근 송장 단가 기준 레시피 원가'],
  'Vendor price creep': ['Schleichende Preiserhöhungen der Lieferanten', 'Hausses de prix rampantes des fournisseurs', 'Aumentos graduales de precios de proveedores', 'Aumentos graduais de preços dos fornecedores', 'Aumenti di prezzo graduali dei fornitori', '仕入先のじわじわ値上げ', '供应商价格逐步上涨', '공급업체 단가 슬금슬금 인상'],
  'Invoices against deliveries and credit memos': ['Rechnungen gegenüber Lieferungen und Gutschriften', 'Factures face aux livraisons et aux avoirs', 'Facturas frente a entregas y notas de crédito', 'Faturas frente a entregas e notas de crédito', 'Fatture rispetto a consegne e note di credito', '請求書と納品・クレジットメモの照合', '发票与送货及贷项通知单核对', '송장 대 납품 및 대변 메모'],
  'Inventory count variance': ['Inventurabweichungen', 'Écarts d’inventaire', 'Variación del conteo de inventario', 'Variação da contagem de estoque', 'Scostamenti dell’inventario', '棚卸差異', '盘点差异', '재고 실사 차이'],
  'Waste log': ['Abfallprotokoll', 'Registre des pertes', 'Registro de mermas', 'Registro de desperdício', 'Registro degli scarti', '廃棄記録', '损耗记录', '폐기 기록'],
  'Bar pour cost and liquor variance': ['Ausschankkosten und Spirituosenabweichung', 'Coût de service au bar et écart sur les alcools', 'Costo de servicio en barra y variación de licores', 'Custo de dose no bar e variação de bebidas', 'Costo di mescita e scostamento dei liquori', 'バーの注ぎ原価と酒類の差異', '酒吧倒酒成本与酒水差异', '바 푸어 코스트와 주류 차이'],
  'Voids and comps by employee': ['Stornos und Einladungen nach Mitarbeiter', 'Annulations et offerts par employé', 'Anulaciones e invitaciones por empleado', 'Cancelamentos e cortesias por funcionário', 'Storni e omaggi per dipendente', '従業員別の取消と無料提供', '按员工的作废与招待', '직원별 취소 및 서비스 제공'],
  'Discounts and promotions': ['Rabatte und Aktionen', 'Remises et promotions', 'Descuentos y promociones', 'Descontos e promoções', 'Sconti e promozioni', '値引きとプロモーション', '折扣与促销', '할인과 프로모션'],
  'Cash over and short by drawer': ['Kassendifferenzen nach Kassenlade', 'Écarts de caisse par tiroir', 'Sobrantes y faltantes de caja por cajón', 'Sobras e faltas de caixa por gaveta', 'Ammanchi ed eccedenze di cassa per cassetto', 'ドロワー別の現金過不足', '按钱箱的现金长短款', '서랍별 현금 과부족'],
  'Tip pool and tip credit': ['Trinkgeldpool und Trinkgeldanrechnung', 'Pool de pourboires et crédit de pourboire', 'Fondo de propinas y crédito por propinas', 'Rateio de gorjetas e crédito de gorjeta', 'Pool delle mance e credito di mancia', 'チッププールとチップクレジット', '小费池与小费抵扣', '팁 풀과 팁 크레딧'],
  'Overtime and split shifts': ['Überstunden und geteilte Schichten', 'Heures supplémentaires et services coupés', 'Horas extra y turnos partidos', 'Horas extras e turnos divididos', 'Straordinari e turni spezzati', '残業と分割シフト', '加班与分段班次', '초과근무와 분할 근무'],
  'Scheduled against actual labor': ['Geplante gegenüber geleisteter Arbeitszeit', 'Heures planifiées face aux heures réelles', 'Horas programadas frente a reales', 'Horas escaladas frente às reais', 'Ore pianificate rispetto a quelle effettive', '予定労働時間と実績の比較', '排班工时与实际工时对比', '계획 근무 대 실제 근무'],
  'Labor percentage by daypart': ['Personalkostenquote nach Tageszeit', 'Ratio de main-d’œuvre par service', 'Porcentaje de mano de obra por franja horaria', 'Percentual de mão de obra por período do dia', 'Incidenza del personale per fascia oraria', '時間帯別の人件費率', '按时段的人工成本率', '시간대별 인건비율'],
  'Delivery app payouts against orders': ['Auszahlungen der Liefer-Apps gegenüber Bestellungen', 'Versements des applis de livraison face aux commandes', 'Pagos de apps de reparto frente a pedidos', 'Repasses dos apps de entrega frente aos pedidos', 'Pagamenti delle app di consegna rispetto agli ordini', 'デリバリーアプリの入金と注文の照合', '外卖平台结算与订单核对', '배달 앱 정산 대 주문'],
  'Delivery app marketing fees': ['Marketinggebühren der Liefer-Apps', 'Frais marketing des applis de livraison', 'Tarifas de marketing de apps de reparto', 'Taxas de marketing dos apps de entrega', 'Costi di marketing delle app di consegna', 'デリバリーアプリの販促費', '外卖平台营销费用', '배달 앱 마케팅 수수료'],
  'Gift card liability': ['Verbindlichkeiten aus Geschenkkarten', 'Passif des cartes-cadeaux', 'Pasivo por tarjetas de regalo', 'Passivo de cartões-presente', 'Passività delle gift card', 'ギフトカードの未使用残高', '礼品卡负债', '기프트카드 부채'],
  'Sales tax by jurisdiction': ['Umsatzsteuer nach Steuergebiet', 'Taxe sur les ventes par juridiction', 'Impuesto sobre ventas por jurisdicción', 'Imposto sobre vendas por jurisdição', 'Imposta sulle vendite per giurisdizione', '課税地域別の売上税', '按辖区的销售税', '관할 지역별 판매세'],
  'Menu engineering': ['Menü-Engineering', 'Ingénierie de menu', 'Ingeniería de menú', 'Engenharia de cardápio', 'Menu engineering (analisi del menù)', 'メニューエンジニアリング', '菜单工程分析', '메뉴 엔지니어링'],
  'Items 86ed and stockouts': ['Ausverkaufte Artikel und Fehlbestände', 'Articles épuisés et ruptures', 'Artículos agotados y quiebres de stock', 'Itens esgotados e rupturas', 'Articoli esauriti e rotture di stock', '品切れ（86）と欠品', '售罄菜品与缺货', '품절(86) 및 재고 부족'],
  'Reservation no-shows': ['Nicht erschienene Reservierungen', 'Réservations non honorées', 'Reservas no presentadas', 'Reservas não comparecidas', 'Prenotazioni non presentate', '予約の無断キャンセル', '预订未到店', '예약 노쇼'],
  'Catering deposits and balances': ['Catering-Anzahlungen und Restbeträge', 'Acomptes et soldes de traiteur', 'Depósitos y saldos de catering', 'Sinais e saldos de catering', 'Acconti e saldi del catering', 'ケータリングの前受金と残額', '宴会外烩订金与尾款', '케이터링 예약금과 잔액'],
  'Prime cost': ['Prime Cost (Waren- und Personalkosten)', 'Coût principal (matières et main-d’œuvre)', 'Costo primo (alimentos y mano de obra)', 'Custo primário (alimentos e mão de obra)', 'Costo primo (merci e personale)', 'プライムコスト（原価と人件費）', '主要成本（食材与人工）', '프라임 코스트 (식재료비와 인건비)'],
  'Utility bills': ['Versorgerrechnungen', 'Factures d’énergie et d’eau', 'Facturas de servicios públicos', 'Contas de serviços públicos', 'Bollette delle utenze', '水道光熱費の請求書', '水电燃气账单', '공과금 청구서'],
  'Equipment maintenance schedule': ['Wartungsplan der Geräte', 'Calendrier d’entretien des équipements', 'Calendario de mantenimiento de equipos', 'Cronograma de manutenção de equipamentos', 'Calendario di manutenzione delle attrezzature', '設備保守スケジュール', '设备维护计划', '장비 유지보수 일정'],
  'Health inspection calendar': ['Kalender der Lebensmittelkontrollen', 'Calendrier des inspections sanitaires', 'Calendario de inspecciones sanitarias', 'Calendário de inspeções sanitárias', 'Calendario delle ispezioni sanitarie', '保健所の立入検査カレンダー', '卫生检查日历', '위생 점검 일정'],
  'Food handler cards': ['Gesundheitszeugnisse und Hygieneschulungen', 'Attestations d’hygiène alimentaire', 'Carnés de manipulador de alimentos', 'Carteiras de manipulador de alimentos', 'Attestati HACCP degli addetti', '食品取扱者証', '食品从业人员健康证', '식품위생 교육 이수증'],
  'Allergen matrix against recipes': ['Allergenmatrix gegenüber Rezepten', 'Matrice des allergènes face aux recettes', 'Matriz de alérgenos frente a recetas', 'Matriz de alérgenos frente às receitas', 'Matrice degli allergeni rispetto alle ricette', 'アレルゲン表とレシピの照合', '过敏原矩阵与配方核对', '알레르기 매트릭스 대 레시피'],
  'Location comparison': ['Standortvergleich', 'Comparaison des établissements', 'Comparación de locales', 'Comparação de unidades', 'Confronto tra i locali', '店舗比較', '门店对比', '매장 비교'],
  'Card processing fees': ['Kartenzahlungsgebühren', 'Frais de traitement des cartes', 'Comisiones de procesamiento de tarjetas', 'Taxas de processamento de cartões', 'Commissioni di elaborazione delle carte', 'カード決済手数料', '刷卡手续费', '카드 결제 수수료'],
  'Duplicate invoices and GL coding': ['Doppelte Rechnungen und Kontierung', 'Factures en double et imputation comptable', 'Facturas duplicadas y codificación contable', 'Faturas duplicadas e classificação contábil', 'Fatture duplicate e imputazione contabile', '重複請求書と勘定科目の割当', '重复发票与会计科目编码', '중복 송장과 계정 코드'],
  'Meal and rest breaks': ['Essens- und Ruhepausen', 'Pauses repas et pauses de repos', 'Descansos para comer y de reposo', 'Intervalos de refeição e descanso', 'Pause pasto e pause di riposo', '食事休憩と小休憩', '用餐与休息时间', '식사 및 휴식 시간'],
};

// Section headings the agents use.
const SECTIONS = {
  'By finding': ['Nach Befund', 'Par constat', 'Por hallazgo', 'Por apontamento', 'Per rilievo', '指摘別', '按发现项', '지적 사항별'],
  Totals: ['Summen', 'Totaux', 'Totales', 'Totais', 'Totali', '合計', '合计', '합계'],
  'By vendor': ['Nach Lieferant', 'Par fournisseur', 'Por proveedor', 'Por fornecedor', 'Per fornitore', '仕入先別', '按供应商', '공급업체별'],
  'By employee': ['Nach Mitarbeiter', 'Par employé', 'Por empleado', 'Por funcionário', 'Per dipendente', '従業員別', '按员工', '직원별'],
  'By location': ['Nach Standort', 'Par établissement', 'Por local', 'Por unidade', 'Per locale', '店舗別', '按门店', '매장별'],
  'By day': ['Nach Tag', 'Par jour', 'Por día', 'Por dia', 'Per giorno', '日別', '按日', '일별'],
  'By daypart': ['Nach Tageszeit', 'Par service', 'Por franja horaria', 'Por período do dia', 'Per fascia oraria', '時間帯別', '按时段', '시간대별'],
  'By week': ['Nach Woche', 'Par semaine', 'Por semana', 'Por semana', 'Per settimana', '週別', '按周', '주별'],
  'By platform': ['Nach Plattform', 'Par plateforme', 'Por plataforma', 'Por plataforma', 'Per piattaforma', 'プラットフォーム別', '按平台', '플랫폼별'],
  'By jurisdiction': ['Nach Steuergebiet', 'Par juridiction', 'Por jurisdicción', 'Por jurisdição', 'Per giurisdizione', '課税地域別', '按辖区', '관할 지역별'],
  'By drawer': ['Nach Kassenlade', 'Par tiroir', 'Por cajón', 'Por gaveta', 'Per cassetto', 'ドロワー別', '按钱箱', '서랍별'],
  'By category': ['Nach Kategorie', 'Par catégorie', 'Por categoría', 'Por categoria', 'Per categoria', 'カテゴリ別', '按类别', '카테고리별'],
  'By reason': ['Nach Grund', 'Par motif', 'Por motivo', 'Por motivo', 'Per motivo', '理由別', '按原因', '사유별'],
  'By role': ['Nach Funktion', 'Par poste', 'Por puesto', 'Por função', 'Per mansione', '職種別', '按岗位', '직무별'],
  'By quadrant': ['Nach Quadrant', 'Par quadrant', 'Por cuadrante', 'Por quadrante', 'Per quadrante', '区分別', '按象限', '사분면별'],
  'By month': ['Nach Monat', 'Par mois', 'Por mes', 'Por mês', 'Per mese', '月別', '按月', '월별'],
  'By account': ['Nach Konto', 'Par compte', 'Por cuenta', 'Por conta', 'Per conto', '口座・契約別', '按账户', '계정별'],
  'By card brand': ['Nach Kartenmarke', 'Par réseau de carte', 'Por marca de tarjeta', 'Por bandeira', 'Per circuito', 'カードブランド別', '按卡组织', '카드 브랜드별'],
  'By recipe': ['Nach Rezept', 'Par recette', 'Por receta', 'Por receita', 'Per ricetta', 'レシピ別', '按配方', '레시피별'],
  'By item': ['Nach Artikel', 'Par article', 'Por artículo', 'Por item', 'Per articolo', '品目別', '按品项', '품목별'],
  'By promotion': ['Nach Aktion', 'Par promotion', 'Por promoción', 'Por promoção', 'Per promozione', 'プロモーション別', '按促销活动', '프로모션별'],
  'By campaign': ['Nach Kampagne', 'Par campagne', 'Por campaña', 'Por campanha', 'Per campagna', 'キャンペーン別', '按营销活动', '캠페인별'],
  'By event': ['Nach Veranstaltung', 'Par événement', 'Por evento', 'Por evento', 'Per evento', 'イベント別', '按活动', '행사별'],
  'Next 30 days': ['Nächste 30 Tage', 'Les 30 prochains jours', 'Próximos 30 días', 'Próximos 30 dias', 'Prossimi 30 giorni', '今後30日', '未来30天', '향후 30일'],
  'Due in the next {1} days': ['Fällig in den nächsten {1} Tagen', 'À échéance dans les {1} prochains jours', 'Vence en los próximos {1} días', 'Vence nos próximos {1} dias', 'In scadenza nei prossimi {1} giorni', '今後{1}日以内に期限', '未来{1}天内到期', '향후 {1}일 내 마감'],
  'Open on {d}': ['Offen am {d}', 'Ouverts au {d}', 'Abiertos al {d}', 'Em aberto em {d}', 'Aperti al {d}', '{d} 時点の未完了', '截至 {d} 未结', '{d} 기준 미결'],
  'Settings used': ['Verwendete Einstellungen', 'Paramètres utilisés', 'Configuración utilizada', 'Configurações utilizadas', 'Impostazioni utilizzate', '使用した設定', '使用的设置', '사용한 설정'],
};

// Column names used by two or more agents. A column with no entry keeps its English name on the page.
const COLUMNS = {
  item: ['Artikel', 'Article', 'Artículo', 'Item', 'Articolo', '品目', '品项', '품목'],
  vendor: ['Lieferant', 'Fournisseur', 'Proveedor', 'Fornecedor', 'Fornitore', '仕入先', '供应商', '공급업체'],
  employee: ['Mitarbeiter', 'Employé', 'Empleado', 'Funcionário', 'Dipendente', '従業員', '员工', '직원'],
  location: ['Standort', 'Établissement', 'Local', 'Unidade', 'Locale', '店舗', '门店', '매장'],
  status: ['Status', 'Statut', 'Estado', 'Status', 'Stato', 'ステータス', '状态', '상태'],
  amount: ['Betrag', 'Montant', 'Importe', 'Valor', 'Importo', '金額', '金额', '금액'],
  count: ['Anzahl', 'Nombre', 'Cantidad', 'Quantidade', 'Numero', '件数', '数量', '건수'],
  code: ['Code', 'Code', 'Código', 'Código', 'Codice', 'コード', '代码', '코드'],
  date: ['Datum', 'Date', 'Fecha', 'Data', 'Data', '日付', '日期', '날짜'],
  role: ['Funktion', 'Poste', 'Puesto', 'Função', 'Mansione', '職種', '岗位', '직무'],
  category: ['Kategorie', 'Catégorie', 'Categoría', 'Categoria', 'Categoria', 'カテゴリ', '类别', '카테고리'],
  platform: ['Plattform', 'Plateforme', 'Plataforma', 'Plataforma', 'Piattaforma', 'プラットフォーム', '平台', '플랫폼'],
  reasons: ['Gründe', 'Motifs', 'Motivos', 'Motivos', 'Motivi', '理由', '原因', '사유'],
  reason: ['Grund', 'Motif', 'Motivo', 'Motivo', 'Motivo', '理由', '原因', '사유'],
  qty: ['Menge', 'Quantité', 'Cantidad', 'Quantidade', 'Quantità', '数量', '数量', '수량'],
  unit: ['Einheit', 'Unité', 'Unidad', 'Unidade', 'Unità', '単位', '单位', '단위'],
  net_sales: ['Nettoumsatz', 'Ventes nettes', 'Ventas netas', 'Vendas líquidas', 'Vendite nette', '純売上', '净销售额', '순매출'],
  invoice_number: ['Rechnungsnummer', 'N° de facture', 'N.º de factura', 'N.º da fatura', 'N. fattura', '請求書番号', '发票号', '송장 번호'],
  hours: ['Stunden', 'Heures', 'Horas', 'Horas', 'Ore', '時間', '小时', '시간'],
  week: ['Woche', 'Semaine', 'Semana', 'Semana', 'Settimana', '週', '周', '주'],
  day: ['Tag', 'Jour', 'Día', 'Dia', 'Giorno', '日', '日', '일'],
  daypart: ['Tageszeit', 'Service', 'Franja horaria', 'Período do dia', 'Fascia oraria', '時間帯', '时段', '시간대'],
  due_date: ['Fällig am', 'Échéance', 'Vencimiento', 'Vencimento', 'Scadenza', '期限', '到期日', '마감일'],
  days_left: ['Tage übrig', 'Jours restants', 'Días restantes', 'Dias restantes', 'Giorni rimanenti', '残り日数', '剩余天数', '남은 일수'],
  owner: ['Verantwortlich', 'Responsable', 'Responsable', 'Responsável', 'Responsabile', '担当者', '负责人', '담당자'],
  decision: ['Entscheidung', 'Décision', 'Decisión', 'Decisão', 'Decisione', '判断', '决定', '결정'],
  findings: ['Befunde', 'Constats', 'Hallazgos', 'Apontamentos', 'Rilievi', '指摘', '发现项', '지적 사항'],
  variance_cost: ['Abweichung (Kosten)', 'Écart (coût)', 'Variación (costo)', 'Variação (custo)', 'Scostamento (costo)', '差異（金額）', '差异（成本）', '차이 (금액)'],
  variance_pct: ['Abweichung %', 'Écart %', 'Variación %', 'Variação %', 'Scostamento %', '差異 %', '差异 %', '차이 %'],
  unit_cost: ['Stückkosten', 'Coût unitaire', 'Costo unitario', 'Custo unitário', 'Costo unitario', '単価', '单位成本', '단가'],
  food_cost_pct: ['Wareneinsatz %', 'Coût matière %', 'Costo de alimentos %', 'Custo de alimentos %', 'Food cost %', '原価率 %', '食材成本率 %', '식재료 원가율 %'],
  labor_pct: ['Personalkosten %', 'Main-d’œuvre %', 'Mano de obra %', 'Mão de obra %', 'Personale %', '人件費率 %', '人工成本率 %', '인건비율 %'],
};

// Labels an agent passes for its own measures.
const LABELS = {
  'Food cost %': ['Wareneinsatz %', 'Coût matière %', 'Costo de alimentos %', 'Custo de alimentos %', 'Food cost %', '原価率 %', '食材成本率 %', '식재료 원가율 %'],
  'Labor %': ['Personalkosten %', 'Main-d’œuvre %', 'Mano de obra %', 'Mão de obra %', 'Costo del personale %', '人件費率 %', '人工成本率 %', '인건비율 %'],
  'Prime cost %': ['Prime Cost %', 'Coût principal %', 'Costo primo %', 'Custo primário %', 'Costo primo %', 'プライムコスト率 %', '主要成本率 %', '프라임 코스트율 %'],
};
/** Every catalog, for the tests: { name: { english: [8 translations] } }. */
export const REPORT_TEXT = Object.freeze({ page: PAGE, titles: TITLES, sections: SECTIONS, columns: COLUMNS, labels: LABELS });
export const ENGLISH_NOTE = 'The summary line, finding texts, codes and the notes under Limits are in English. This page was translated by Claude; a native speaker has not reviewed it yet.';

const DATE = /\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?/;
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : vars[k]));

/** Find a phrase in a catalog: as written, then with its date as {d}, then with its numbers as {1} {2}. */
function lookup(cat, s) {
  if (Object.hasOwn(cat, s)) return [cat[s], {}];
  const d = DATE.exec(s);
  if (d) { const k = s.replace(DATE, '{d}'); if (Object.hasOwn(cat, k)) return [cat[k], { d: d[0] }]; }
  const vars = {}; let n = 0; const k = s.replace(/\d+(?:\.\d+)?/g, (m) => { vars[++n] = m; return `{${n}}`; });
  return n && Object.hasOwn(cat, k) ? [cat[k], vars] : [null, {}];
}

/**
 * Text for a report page in one language:
 *   t.page(s), t.title(s), t.section(s)  a phrase, translated when the catalog has it;
 *   t.column(name, label)                a column heading (label is the agent's own, when it set one);
 *   t.english                            true when nothing is translated.
 */
export function reportText(lang) {
  const l = normLang(lang); const i = ORDER.indexOf(l);
  const tr = (cat) => (s) => { if (i < 0) return s; const [hit, vars] = lookup(cat, String(s)); return hit && hit[i] ? fill(hit[i], vars) : s; };
  const label = tr(LABELS);
  return {
    lang: l, english: i < 0, page: tr(PAGE), title: tr(TITLES), section: tr(SECTIONS),
    column: (name, own) => { if (own) return label(own); if (i >= 0 && Object.hasOwn(COLUMNS, name) && COLUMNS[name][i]) return COLUMNS[name][i]; return String(name).replace(/_/g, ' '); },
  };
}

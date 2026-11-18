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

const TITLES = {
  'Accessorial charges': ['Nebenkosten', 'Frais accessoires', 'Cargos accesorios', 'Taxas acessórias', 'Costi accessori', '付帯料金', '附加费', '부대 요금'],
  'Air freight audit': ['Prüfung der Luftfracht', 'Audit du fret aérien', 'Auditoría de flete aéreo', 'Auditoria de frete aéreo', 'Verifica del trasporto aereo', '航空運賃の監査', '空运运费审核', '항공 운임 감사'],
  'Carrier scorecard': ['Frachtführer-Scorecard', 'Tableau de bord des transporteurs', 'Cuadro de mando de transportistas', 'Scorecard de transportadoras', 'Scorecard dei vettori', '運送会社スコアカード', '承运商评分卡', '운송사 스코어카드'],
  'Carrier settlements': ['Frachtführer-Abrechnungen', 'Règlements des transporteurs', 'Liquidaciones a transportistas', 'Acertos com transportadoras', 'Liquidazioni ai vettori', '運送会社への支払精算', '承运商结算', '운송사 정산'],
  'Carrier warning signs': ['Warnzeichen bei Frachtführern', 'Signaux d’alerte sur les transporteurs', 'Señales de alerta de transportistas', 'Sinais de alerta de transportadoras', 'Segnali di allarme sui vettori', '運送会社の注意サイン', '承运商警示信号', '운송사 경고 신호'],
  'Carton fit': ['Kartonauswahl', 'Choix des cartons', 'Ajuste de cajas', 'Ajuste de caixas', 'Scelta dei cartoni', 'カートンの適合', '纸箱匹配', '상자 적합성'],
  'Container free time': ['Container-Freizeit', 'Franchise des conteneurs', 'Tiempo libre de contenedores', 'Tempo livre de contêineres', 'Franchigia dei container', 'コンテナのフリータイム', '集装箱免费期', '컨테이너 프리타임'],
  'Customs entry review': ['Prüfung der Zollanmeldungen', 'Revue des déclarations en douane', 'Revisión de entradas aduaneras', 'Revisão de declarações aduaneiras', 'Verifica delle dichiarazioni doganali', '通関申告の確認', '报关单复核', '통관 신고 검토'],
  'Detention, layover and lumper review': ['Prüfung von Standgeld, Übernachtung und Entladehelfern', 'Revue des frais d’attente, d’immobilisation et de manutention', 'Revisión de detención, pernocta y descarga', 'Revisão de estadia, pernoite e descarga', 'Verifica di soste, pernottamenti e scarico', '待機料・滞留料・荷役料の確認', '滞留费、过夜费和装卸费复核', '대기료·체류료·하역료 검토'],
  'Dock plan, {d}': ['Rampenplan, {d}', 'Plan des quais, {d}', 'Plan de muelles, {d}', 'Plano de docas, {d}', 'Piano delle banchine, {d}', 'ドック計画 {d}', '月台计划 {d}', '도크 계획 {d}'],
  'Freight EDI reconciliation': ['Abgleich der Fracht-EDI', 'Rapprochement des EDI de fret', 'Conciliación de EDI de fletes', 'Conciliação de EDI de fretes', 'Riconciliazione EDI dei trasporti', '運賃EDIの照合', '货运EDI对账', '화물 EDI 대사'],
  'Freight accrual, period ending {d}': ['Frachtabgrenzung, Periodenende {d}', 'Provision de fret, période close le {d}', 'Provisión de fletes, periodo cerrado el {d}', 'Provisão de fretes, período encerrado em {d}', 'Accantonamento trasporti, periodo chiuso il {d}', '運賃の未払計上（期末 {d}）', '运费预提（期末 {d}）', '운임 미지급 계상 (기말 {d})'],
  'Freight allocation': ['Frachtkostenverteilung', 'Répartition du fret', 'Asignación de fletes', 'Rateio de fretes', 'Ripartizione dei costi di trasporto', '運賃の配賦', '运费分摊', '운임 배분'],
  'Freight bill audit': ['Frachtrechnungsprüfung', 'Audit des factures de transport', 'Auditoría de facturas de flete', 'Auditoria de faturas de frete', 'Verifica delle fatture di trasporto', '運賃請求書の監査', '运费账单审核', '운임 청구서 감사'],
  'Freight charged against freight cost': ['Berechnete Fracht gegenüber Frachtkosten', 'Fret facturé face au coût du fret', 'Flete cobrado frente al coste del flete', 'Frete cobrado frente ao custo do frete', 'Trasporto addebitato rispetto al costo', '請求した運賃と運賃原価', '向客户收取的运费与运费成本', '청구 운임 대 운임 원가'],
  'Freight claims as of {d}': ['Frachtschäden, Stand {d}', 'Réclamations transport au {d}', 'Reclamaciones de transporte al {d}', 'Reclamações de frete em {d}', 'Reclami di trasporto al {d}', '貨物クレーム（{d} 時点）', '货运索赔（截至 {d}）', '화물 클레임 ({d} 기준)'],
  'Freight invoices paid twice': ['Doppelt bezahlte Frachtrechnungen', 'Factures de transport payées deux fois', 'Facturas de flete pagadas dos veces', 'Faturas de frete pagas em duplicidade', 'Fatture di trasporto pagate due volte', '二重払いの運賃請求書', '重复支付的运费发票', '이중 지급된 운임 청구서'],
  'Freight standards against actual': ['Frachtstandards gegenüber Ist', 'Standards de fret face au réel', 'Estándares de flete frente al real', 'Padrões de frete frente ao real', 'Standard di trasporto rispetto al consuntivo', '運賃標準と実績', '运费标准与实际', '운임 표준 대 실적'],
  'Fuel surcharge check': ['Prüfung des Dieselzuschlags', 'Contrôle de la surcharge carburant', 'Revisión del recargo por combustible', 'Verificação da sobretaxa de combustível', 'Verifica del supplemento carburante', '燃油サーチャージの確認', '燃油附加费核对', '유류할증료 점검'],
  'LTL weight and class corrections': ['Stückgut: Gewichts- und Klassenkorrekturen', 'LTL : corrections de poids et de classe', 'LTL: correcciones de peso y clase', 'LTL: correções de peso e classe', 'LTL: correzioni di peso e classe', 'LTLの重量・クラス訂正', '零担重量和等级更正', 'LTL 중량·등급 정정'],
  'Lanes and consolidation': ['Relationen und Bündelung', 'Axes et consolidation', 'Rutas y consolidación', 'Rotas e consolidação', 'Tratte e consolidamento', 'レーンと混載', '线路与拼货', '구간 및 혼적'],
  'Ocean freight audit': ['Prüfung der Seefracht', 'Audit du fret maritime', 'Auditoría de flete marítimo', 'Auditoria de frete marítimo', 'Verifica del trasporto marittimo', '海上運賃の監査', '海运运费审核', '해상 운임 감사'],
  'Open loads at {d}': ['Offene Ladungen, Stand {d}', 'Chargements en cours au {d}', 'Cargas abiertas al {d}', 'Cargas em aberto em {d}', 'Carichi aperti al {d}', '未完了の積荷（{d} 時点）', '未完成货载（截至 {d}）', '미완료 화물 ({d} 기준)'],
  'Parcel invoice audit': ['Prüfung der Paketrechnungen', 'Audit des factures colis', 'Auditoría de facturas de paquetería', 'Auditoria de faturas de encomendas', 'Verifica delle fatture pacchi', '小口配送請求書の監査', '包裹账单审核', '소포 청구서 감사'],
  'Proof of delivery as of {d}': ['Ablieferbelege, Stand {d}', 'Preuves de livraison au {d}', 'Pruebas de entrega al {d}', 'Comprovantes de entrega em {d}', 'Prove di consegna al {d}', '配達証明（{d} 時点）', '签收单（截至 {d}）', '인수증 ({d} 기준)'],
  'RFP award scenario': ['Vergabeszenario der Ausschreibung', 'Scénario d’attribution de l’appel d’offres', 'Escenario de adjudicación de la licitación', 'Cenário de adjudicação da concorrência', 'Scenario di aggiudicazione della gara', '入札の落札シナリオ', '招标授标方案', '입찰 낙찰 시나리오'],
  'Returns from label to credit': ['Retouren vom Etikett bis zur Gutschrift', 'Retours, de l’étiquette à l’avoir', 'Devoluciones, de la etiqueta al abono', 'Devoluções, da etiqueta ao crédito', 'Resi, dall’etichetta alla nota di credito', '返品：ラベルから返金まで', '退货：从标签到退款', '반품: 라벨에서 환불까지'],
  'Shipment emissions (estimate)': ['Sendungsemissionen (Schätzung)', 'Émissions des expéditions (estimation)', 'Emisiones de los envíos (estimación)', 'Emissões dos embarques (estimativa)', 'Emissioni delle spedizioni (stima)', '輸送の排出量（推定）', '运输排放（估算）', '운송 배출량 (추정)'],
  'Shipment history re-rated under every contract': ['Sendungshistorie, neu berechnet nach jedem Vertrag', 'Historique des expéditions retarifé selon chaque contrat', 'Historial de envíos recalculado con cada contrato', 'Histórico de embarques recalculado em cada contrato', 'Storico delle spedizioni ricalcolato con ogni contratto', '出荷履歴を各契約で再計算', '按每份合同重新计价的发货历史', '모든 계약으로 재산정한 출하 이력'],
  'Spot quotes as of {d}': ['Spot-Angebote, Stand {d}', 'Cotations spot au {d}', 'Cotizaciones spot al {d}', 'Cotações spot em {d}', 'Quotazioni spot al {d}', 'スポット見積（{d} 時点）', '即期报价（截至 {d}）', '스팟 견적 ({d} 기준)'],
};

const SECTIONS = {
  'Booked loads': ['Gebuchte Ladungen', 'Chargements réservés', 'Cargas reservadas', 'Cargas contratadas', 'Carichi prenotati', '手配済みの積荷', '已订货载', '예약된 화물'],
  'By GL account and cost center': ['Nach Sachkonto und Kostenstelle', 'Par compte général et centre de coûts', 'Por cuenta contable y centro de coste', 'Por conta contábil e centro de custo', 'Per conto contabile e centro di costo', '勘定科目・コストセンター別', '按总账科目和成本中心', '계정과목 및 코스트센터별'],
  'By SKU': ['Nach Artikel', 'Par référence', 'Por SKU', 'Por SKU', 'Per SKU', 'SKU別', '按SKU', 'SKU별'],
  'By carrier': ['Nach Frachtführer', 'Par transporteur', 'Por transportista', 'Por transportadora', 'Per vettore', '運送会社別', '按承运商', '운송사별'],
  'By customer': ['Nach Kunde', 'Par client', 'Por cliente', 'Por cliente', 'Per cliente', '顧客別', '按客户', '고객별'],
  'By finding': ['Nach Befund', 'Par constat', 'Por hallazgo', 'Por apontamento', 'Per rilievo', '指摘別', '按发现项', '지적 사항별'],
  'By freight terms': ['Nach Frachtkondition', 'Par conditions de fret', 'Por condiciones de flete', 'Por condições de frete', 'Per condizioni di trasporto', '運賃条件別', '按运费条款', '운임 조건별'],
  'By lane': ['Nach Relation', 'Par axe', 'Por ruta', 'Por rota', 'Per tratta', 'レーン別', '按线路', '구간별'],
  'By line': ['Nach Position', 'Par ligne', 'Por línea', 'Por linha', 'Per riga', '明細別', '按明细行', '라인별'],
  'By location': ['Nach Standort', 'Par site', 'Por ubicación', 'Por local', 'Per sede', '拠点別', '按地点', '위치별'],
  'By mode': ['Nach Verkehrsträger', 'Par mode', 'Por modo', 'Por modal', 'Per modalità', '輸送モード別', '按运输方式', '운송 모드별'],
  'By reason': ['Nach Grund', 'Par motif', 'Por motivo', 'Por motivo', 'Per motivo', '理由別', '按原因', '사유별'],
  'By type': ['Nach Art', 'Par type', 'Por tipo', 'Por tipo', 'Per tipo', '種類別', '按类型', '유형별'],
  'By vendor': ['Nach Lieferant', 'Par fournisseur', 'Por proveedor', 'Por fornecedor', 'Per fornitore', '仕入先別', '按供应商', '공급업체별'],
  'Carrier shares': ['Anteile der Frachtführer', 'Parts des transporteurs', 'Cuotas de transportistas', 'Participação das transportadoras', 'Quote dei vettori', '運送会社のシェア', '承运商份额', '운송사 점유율'],
  Carriers: ['Frachtführer', 'Transporteurs', 'Transportistas', 'Transportadoras', 'Vettori', '運送会社', '承运商', '운송사'],
  'Carriers by tracking': ['Frachtführer nach Sendungsverfolgung', 'Transporteurs selon le suivi', 'Transportistas por seguimiento', 'Transportadoras por rastreamento', 'Vettori per tracciamento', '追跡状況別の運送会社', '按跟踪情况的承运商', '추적 기준 운송사'],
  'Carton use': ['Kartonnutzung', 'Utilisation des cartons', 'Uso de cajas', 'Uso de caixas', 'Uso dei cartoni', 'カートンの使用状況', '纸箱使用情况', '상자 사용 현황'],
  'Charges checked': ['Geprüfte Kosten', 'Frais contrôlés', 'Cargos revisados', 'Cobranças verificadas', 'Addebiti verificati', '確認した料金', '已核对费用', '확인한 요금'],
  'Cost per hundredweight by month': ['Kosten je 100 lb nach Monat', 'Coût par 100 lb par mois', 'Coste por 100 lb por mes', 'Custo por 100 lb por mês', 'Costo per 100 lb per mese', '月別の100ポンド当たりコスト', '按月的每百磅成本', '월별 100파운드당 비용'],
  'Could have shared a truck': ['Hätten einen Lkw teilen können', 'Auraient pu partager un camion', 'Podrían haber compartido camión', 'Poderiam ter dividido um caminhão', 'Avrebbero potuto condividere un camion', '同じトラックにまとめられた出荷', '本可合并装车的货', '한 트럭에 함께 실을 수 있었던 화물'],
  Doors: ['Tore', 'Portes', 'Puertas', 'Portas', 'Porte', 'ドア', '月台门', '도어'],
  Entries: ['Zollanmeldungen', 'Déclarations', 'Entradas', 'Declarações', 'Dichiarazioni', '申告', '报关单', '신고'],
  'Every return': ['Alle Retouren', 'Tous les retours', 'Todas las devoluciones', 'Todas as devoluções', 'Tutti i resi', 'すべての返品', '全部退货', '전체 반품'],
  'Facilities, worst first': ['Standorte, schlechteste zuerst', 'Sites, les plus mauvais d’abord', 'Instalaciones, las peores primero', 'Instalações, as piores primeiro', 'Sedi, le peggiori per prime', '施設（悪い順）', '设施（最差在前）', '시설 (나쁜 순)'],
  'Filed claims to chase': ['Eingereichte Reklamationen zum Nachfassen', 'Réclamations déposées à relancer', 'Reclamaciones presentadas por seguir', 'Reclamações abertas a cobrar', 'Reclami presentati da sollecitare', '督促が必要な提出済みクレーム', '需跟进的已提交索赔', '독촉할 접수된 클레임'],
  Files: ['Dateien', 'Fichiers', 'Archivos', 'Arquivos', 'File', 'ファイル', '文件', '파일'],
  'Fix your own product data': ['Eigene Produktdaten korrigieren', 'Corrigez vos propres données produit', 'Corrija sus propios datos de producto', 'Corrija seus próprios dados de produto', 'Correggete i vostri dati di prodotto', '自社の商品データを修正', '修正自己的产品数据', '자사 제품 데이터 수정'],
  'Free-shipping threshold, enforced (estimate)': ['Schwelle für kostenlosen Versand, durchgesetzt (Schätzung)', 'Seuil de franco de port, appliqué (estimation)', 'Umbral de envío gratis, aplicado (estimación)', 'Limite de frete grátis, aplicado (estimativa)', 'Soglia di spedizione gratuita, applicata (stima)', '送料無料の基準額を適用した場合（推定）', '严格执行包邮门槛（估算）', '무료 배송 기준 적용 시 (추정)'],
  'Fuel tables on a {1} linehaul, {2}-mile load': ['Dieseltabellen bei {1} Grundfracht und {2} Meilen', 'Barèmes carburant pour un fret de base de {1} sur {2} miles', 'Tablas de combustible para un flete base de {1} y {2} millas', 'Tabelas de combustível para um frete base de {1} e {2} milhas', 'Tabelle carburante per un nolo base di {1} su {2} miglia', '基本運賃 {1}・{2} マイルの積荷での燃油テーブル', '基本运费 {1}、{2} 英里货载的燃油表', '기본 운임 {1}, {2}마일 화물 기준 유류 테이블'],
  'Heavy LTL to quote as truckload': ['Schweres Stückgut, als Komplettladung anzufragen', 'LTL lourd à coter en camion complet', 'LTL pesado para cotizar como camión completo', 'LTL pesado para cotar como carga completa', 'LTL pesante da quotare come carico completo', 'トラック貸切で見積もるべき重量LTL', '应按整车询价的重型零担', '트럭 단위로 견적할 중량 LTL'],
  Lanes: ['Relationen', 'Axes', 'Rutas', 'Rotas', 'Tratte', 'レーン', '线路', '구간'],
  'Last period accrual': ['Abgrenzung der Vorperiode', 'Provision de la période précédente', 'Provisión del periodo anterior', 'Provisão do período anterior', 'Accantonamento del periodo precedente', '前期の未払計上', '上期预提', '전기 미지급 계상'],
  'Loads working by hour': ['Ladungen in Arbeit je Stunde', 'Chargements en cours par heure', 'Cargas en proceso por hora', 'Cargas em operação por hora', 'Carichi in lavorazione per ora', '時間帯別の作業中の積荷', '按小时的在作业货载', '시간대별 작업 중 화물'],
  'Mode-shift what-if': ['Was-wäre-wenn: Verkehrsträgerwechsel', 'Simulation de report modal', 'Simulación de cambio de modo', 'Simulação de troca de modal', 'Simulazione di cambio modale', 'モーダルシフトの試算', '运输方式转换测算', '운송 모드 전환 가정'],
  'Next batch by payee': ['Nächster Zahllauf nach Empfänger', 'Prochain lot par bénéficiaire', 'Próximo lote por beneficiario', 'Próximo lote por favorecido', 'Prossimo lotto per beneficiario', '支払先別の次回バッチ', '按收款方的下一批付款', '수취인별 다음 배치'],
  'On-time delivery by quarter': ['Pünktliche Zustellung nach Quartal', 'Livraisons à l’heure par trimestre', 'Entrega a tiempo por trimestre', 'Entrega no prazo por trimestre', 'Consegne puntuali per trimestre', '四半期別の定時配達', '按季度的准时交付', '분기별 정시 배송'],
  'Points found': ['Gefundene Punkte', 'Points relevés', 'Puntos encontrados', 'Pontos encontrados', 'Punti rilevati', '見つかった点', '发现的问题点', '발견된 사항'],
  Problems: ['Probleme', 'Problèmes', 'Problemas', 'Problemas', 'Problemi', '問題', '问题', '문제'],
  'Repeats to fix at the source': ['Wiederholungen, an der Quelle zu beheben', 'Répétitions à corriger à la source', 'Repeticiones a corregir en origen', 'Repetições a corrigir na origem', 'Ripetizioni da correggere all’origine', '発生元で直すべき繰り返し', '应从源头解决的重复项', '원인에서 고쳐야 할 반복 항목'],
  'Rules used': ['Verwendete Regeln', 'Règles utilisées', 'Reglas utilizadas', 'Regras utilizadas', 'Regole utilizzate', '使用したルール', '使用的规则', '사용한 규칙'],
  'Savings by SKU': ['Einsparungen nach Artikel', 'Économies par référence', 'Ahorros por SKU', 'Economia por SKU', 'Risparmi per SKU', 'SKU別の削減額', '按SKU的节省', 'SKU별 절감액'],
  'Weights used': ['Verwendete Gewichtungen', 'Pondérations utilisées', 'Ponderaciones utilizadas', 'Pesos utilizados', 'Pesi utilizzati', '使用した重み', '使用的权重', '사용한 가중치'],
};

// Column names used by two or more agents, plus the scorecard measures. A column with no
// entry keeps its English name on the page.
const COLUMNS = {
  carrier: ['Frachtführer', 'Transporteur', 'Transportista', 'Transportadora', 'Vettore', '運送会社', '承运商', '운송사'],
  carriers: ['Frachtführer', 'Transporteurs', 'Transportistas', 'Transportadoras', 'Vettori', '運送会社', '承运商', '운송사'],
  status: ['Status', 'Statut', 'Estado', 'Status', 'Stato', 'ステータス', '状态', '상태'],
  invoice_number: ['Rechnungsnummer', 'N° de facture', 'N.º de factura', 'N.º da fatura', 'N. fattura', '請求書番号', '发票号', '청구서 번호'],
  invoices: ['Rechnungen', 'Factures', 'Facturas', 'Faturas', 'Fatture', '請求書', '发票', '청구서'],
  detail: ['Einzelheiten', 'Détail', 'Detalle', 'Detalhe', 'Dettaglio', '詳細', '详情', '상세'],
  shipment_id: ['Sendungsnummer', 'N° d’expédition', 'N.º de envío', 'N.º do embarque', 'N. spedizione', '出荷番号', '货件编号', '출하 번호'],
  shipments: ['Sendungen', 'Expéditions', 'Envíos', 'Embarques', 'Spedizioni', '出荷数', '货件数', '출하 건수'],
  amount: ['Betrag', 'Montant', 'Importe', 'Valor', 'Importo', '金額', '金额', '금액'],
  lane: ['Relation', 'Axe', 'Ruta', 'Rota', 'Tratta', 'レーン', '线路', '구간'],
  billed: ['Berechnet', 'Facturé', 'Facturado', 'Faturado', 'Fatturato', '請求額', '账单金额', '청구액'],
  code: ['Code', 'Code', 'Código', 'Código', 'Codice', 'コード', '代码', '코드'],
  sku: ['Artikel', 'Référence', 'SKU', 'SKU', 'SKU', 'SKU', 'SKU', 'SKU'],
  customer: ['Kunde', 'Client', 'Cliente', 'Cliente', 'Cliente', '顧客', '客户', '고객'],
  pro: ['PRO-Nummer', 'N° PRO', 'N.º PRO', 'N.º PRO', 'N. PRO', 'PRO番号', 'PRO号', 'PRO 번호'],
  loads: ['Ladungen', 'Chargements', 'Cargas', 'Cargas', 'Carichi', '積荷数', '货载数', '화물 수'],
  load_id: ['Ladungsnummer', 'N° de chargement', 'N.º de carga', 'N.º da carga', 'N. carico', '積荷番号', '货载编号', '화물 번호'],
  reason: ['Grund', 'Motif', 'Motivo', 'Motivo', 'Motivo', '理由', '原因', '사유'],
  reasons: ['Gründe', 'Motifs', 'Motivos', 'Motivos', 'Motivi', '理由', '原因', '사유'],
  count: ['Anzahl', 'Nombre', 'Cantidad', 'Quantidade', 'Numero', '件数', '数量', '건수'],
  notes: ['Notizen', 'Notes', 'Notas', 'Notas', 'Note', 'メモ', '备注', '메모'],
  ship_date: ['Versanddatum', 'Date d’expédition', 'Fecha de envío', 'Data de embarque', 'Data di spedizione', '出荷日', '发货日期', '출하일'],
  pickup_date: ['Abholdatum', 'Date d’enlèvement', 'Fecha de recogida', 'Data de coleta', 'Data di ritiro', '集荷日', '提货日期', '픽업일'],
  date: ['Datum', 'Date', 'Fecha', 'Data', 'Data', '日付', '日期', '날짜'],
  age_days: ['Alter (Tage)', 'Âge (jours)', 'Antigüedad (días)', 'Idade (dias)', 'Età (giorni)', '経過日数', '账龄（天）', '경과 일수'],
  days_left: ['Verbleibende Tage', 'Jours restants', 'Días restantes', 'Dias restantes', 'Giorni rimanenti', '残り日数', '剩余天数', '남은 일수'],
  weight: ['Gewicht', 'Poids', 'Peso', 'Peso', 'Peso', '重量', '重量', '중량'],
  disputable: ['Strittig', 'Contestable', 'Disputable', 'Contestável', 'Contestabile', '異議申立て可能額', '可争议金额', '이의 제기 가능액'],
  flags: ['Hinweise', 'Signalements', 'Avisos', 'Alertas', 'Segnalazioni', '注意点', '提示', '주의 사항'],
  freight: ['Fracht', 'Fret', 'Flete', 'Frete', 'Trasporto', '運賃', '运费', '운임'],
  units: ['Einheiten', 'Unités', 'Unidades', 'Unidades', 'Unità', '数量', '件数', '수량'],
  issues: ['Auffälligkeiten', 'Anomalies', 'Incidencias', 'Ocorrências', 'Anomalie', '問題点', '问题', '이슈'],
  from: ['Von', 'De', 'Origen', 'Origem', 'Da', '発地', '起点', '출발지'],
  to: ['Nach', 'Vers', 'Destino', 'Destino', 'A', '着地', '终点', '도착지'],
  type: ['Art', 'Type', 'Tipo', 'Tipo', 'Tipo', '種類', '类型', '유형'],
  spend: ['Ausgaben', 'Dépenses', 'Gasto', 'Gasto', 'Spesa', '支出', '支出', '지출'],
  share_pct: ['Anteil %', 'Part %', 'Cuota %', 'Participação %', 'Quota %', 'シェア %', '份额 %', '점유율 %'],
  finding: ['Befund', 'Constat', 'Hallazgo', 'Apontamento', 'Rilievo', '指摘', '发现项', '지적 사항'],
  findings: ['Befunde', 'Constats', 'Hallazgos', 'Apontamentos', 'Rilievi', '指摘', '发现项', '지적 사항'],
  rank: ['Rang', 'Rang', 'Puesto', 'Posição', 'Posizione', '順位', '排名', '순위'],
  score: ['Punktzahl', 'Score', 'Puntuación', 'Pontuação', 'Punteggio', 'スコア', '得分', '점수'],
  variance: ['Abweichung', 'Écart', 'Variación', 'Variação', 'Scostamento', '差異', '差异', '차이'],
  difference: ['Differenz', 'Différence', 'Diferencia', 'Diferença', 'Differenza', '差額', '差额', '차액'],
  description: ['Beschreibung', 'Description', 'Descripción', 'Descrição', 'Descrizione', '内容', '描述', '설명'],
  action: ['Maßnahme', 'Action', 'Acción', 'Ação', 'Azione', '対応', '措施', '조치'],
  fix: ['Abhilfe', 'Correction', 'Solución', 'Correção', 'Rimedio', '是正策', '解决办法', '해결 방법'],
  mode: ['Verkehrsträger', 'Mode', 'Modo', 'Modal', 'Modalità', '輸送モード', '运输方式', '운송 모드'],
  over: ['Zu viel', 'Excédent', 'Exceso', 'Excedente', 'Eccedenza', '超過額', '超出金额', '초과액'],
  late: ['Verspätet', 'En retard', 'Con retraso', 'Atrasadas', 'In ritardo', '遅延', '延误', '지연'],
  value: ['Wert', 'Valeur', 'Valor', 'Valor', 'Valore', '金額', '价值', '가액'],
  credited: ['Gutgeschrieben', 'Crédité', 'Abonado', 'Creditado', 'Accreditato', '返金済み額', '已退款', '환불액'],
  paid: ['Bezahlt', 'Payé', 'Pagado', 'Pago', 'Pagato', '支払済み', '已付', '지급액'],
  rule: ['Regel', 'Règle', 'Regla', 'Regra', 'Regola', 'ルール', '规则', '규칙'],
  savings: ['Einsparung', 'Économies', 'Ahorro', 'Economia', 'Risparmio', '削減額', '节省', '절감액'],
  line: ['Position', 'Ligne', 'Línea', 'Linha', 'Riga', '明細', '行', '라인'],
  lines: ['Positionen', 'Lignes', 'Líneas', 'Linhas', 'Righe', '明細数', '行数', '라인 수'],
  expected: ['Erwartet', 'Attendu', 'Esperado', 'Esperado', 'Atteso', '期待値', '应为', '예상'],
  cost: ['Kosten', 'Coût', 'Coste', 'Custo', 'Costo', 'コスト', '成本', '비용'],
  cost_center: ['Kostenstelle', 'Centre de coûts', 'Centro de coste', 'Centro de custo', 'Centro di costo', 'コストセンター', '成本中心', '코스트센터'],
  gl_account: ['Sachkonto', 'Compte général', 'Cuenta contable', 'Conta contábil', 'Conto contabile', '勘定科目', '总账科目', '계정과목'],
  basis: ['Basis', 'Base', 'Base', 'Base', 'Base', '基準', '依据', '기준'],
  order_id: ['Auftragsnummer', 'N° de commande', 'N.º de pedido', 'N.º do pedido', 'N. ordine', '注文番号', '订单号', '주문 번호'],
  freight_pct_of_value: ['Fracht in % des Werts', 'Fret en % de la valeur', 'Flete en % del valor', 'Frete em % do valor', 'Trasporto in % del valore', '運賃の対金額比 %', '运费占货值 %', '가액 대비 운임 %'],
  delivered: ['Zugestellt', 'Livré', 'Entregado', 'Entregue', 'Consegnato', '配達日', '已送达', '배송 완료'],
  pallets: ['Paletten', 'Palettes', 'Palés', 'Paletes', 'Pallet', 'パレット数', '托盘数', '팔레트 수'],
  cost_per_mile: ['Kosten je Meile', 'Coût par mile', 'Coste por milla', 'Custo por milha', 'Costo per miglio', 'マイル当たりコスト', '每英里成本', '마일당 비용'],
  tracking: ['Sendungsverfolgungsnummer', 'N° de suivi', 'N.º de seguimiento', 'Código de rastreamento', 'N. di tracciamento', '追跡番号', '运单号', '송장 번호'],
  vendor: ['Lieferant', 'Fournisseur', 'Proveedor', 'Fornecedor', 'Fornitore', '仕入先', '供应商', '공급업체'],
  refundable: ['Erstattungsfähig', 'Remboursable', 'Reembolsable', 'Reembolsável', 'Rimborsabile', '返金可能額', '可退款金额', '환불 가능액'],
  total: ['Summe', 'Total', 'Total', 'Total', 'Totale', '合計', '合计', '합계'],
};

// The scorecard's measure names, which the agent passes as labels.
const LABELS = {
  'Tender acceptance %': ['Auftragsannahme %', 'Acceptation des offres %', 'Aceptación de cargas %', 'Aceitação de cargas %', 'Accettazione dei carichi %', '受託率 %', '接单率 %', '수락률 %'],
  'Billing accuracy %': ['Rechnungsgenauigkeit %', 'Exactitude de la facturation %', 'Exactitud de facturación %', 'Precisão do faturamento %', 'Accuratezza della fatturazione %', '請求の正確性 %', '开票准确率 %', '청구 정확도 %'],
  'Claim-free loads %': ['Schadenfreie Ladungen %', 'Chargements sans sinistre %', 'Cargas sin reclamación %', 'Cargas sem sinistro %', 'Carichi senza reclami %', 'クレームなしの積荷 %', '无索赔货载 %', '무클레임 화물 %'],
  'Cost per mile (relative) %': ['Kosten je Meile (relativ) %', 'Coût par mile (relatif) %', 'Coste por milla (relativo) %', 'Custo por milha (relativo) %', 'Costo per miglio (relativo) %', 'マイル当たりコスト（相対）%', '每英里成本（相对）%', '마일당 비용 (상대) %'],
  'On-time delivery %': ['Pünktliche Zustellung %', 'Livraisons à l’heure %', 'Entrega a tiempo %', 'Entrega no prazo %', 'Consegne puntuali %', '定時配達 %', '准时交付 %', '정시 배송 %'],
  'On-time pickup %': ['Pünktliche Abholung %', 'Enlèvements à l’heure %', 'Recogida a tiempo %', 'Coleta no prazo %', 'Ritiri puntuali %', '定時集荷 %', '准时提货 %', '정시 픽업 %'],
  'Tracking %': ['Sendungsverfolgung %', 'Suivi %', 'Seguimiento %', 'Rastreamento %', 'Tracciamento %', '追跡 %', '跟踪 %', '추적 %'],
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

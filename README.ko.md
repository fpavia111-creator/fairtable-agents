# Fairtable 외식업 에이전트

*Claude가 번역했으며 원어민 검토는 아직입니다. 영어 [README](README.md)가 기준입니다.*

레스토랑, 바, 카페, 다점포 외식 그룹의 백오피스를 위한 32개의 작은 MCP 에이전트입니다. 각 에이전트는 실제 대 이론 식재료 원가, 팁 풀, 배달 앱 정산, 알레르기 매트릭스처럼 **한 가지 업무**만 맡으며 그 밖의 일은 할 수 없습니다. POS, 근무표, 공급업체 송장, 배달 앱, 예약 시스템에서 이미 내보내는 파일을 읽고, 보고서를 사용자의 컴퓨터에 저장하며, 돈을 움직이거나 메시지를 보내거나 운영 중인 시스템을 바꾸기 전에는 이름이 확인된 담당자를 기다립니다.

Mythos Machines의 Fair Agents에 속합니다. MIT 라이선스 · Node 20 이상 · 로컬 파일만 · 자격 증명 불필요 · 의존성 없음. 소프트웨어는 무료이며, 유료인 것은 사용자의 파일에 맞춘 정액 설치 작업입니다.

## 사용해 보기

```bash
npx -y fairtable-food-cost demo            # 실제 대 이론 식재료 원가 (가상 데이터)
npx -y fairtable-delivery-payouts demo   # 배달 앱 정산 대 주문
```

모든 에이전트에는 가상 파일로 실행하는 `demo`, 자체 테스트 케이스가 있는 `eval`, MCP 서버(`npx -y <에이전트> mcp --root <폴더>`)가 있습니다.

## 에이전트

**식재료·구매·바 (9):** `fairtable-food-cost`(실제 대 이론 원가), `fairtable-recipe-costs`(최신 단가 기준 레시피 원가), `fairtable-price-creep`(공급업체 단가 인상), `fairtable-receiving-credits`(송장 대 입고·반품), `fairtable-inventory-counts`(재고 실사 차이), `fairtable-waste-log`(폐기 기록), `fairtable-pour-cost`(바 원가), `fairtable-menu-engineering`(메뉴 엔지니어링), `fairtable-stockouts`(품절).

**홀과 현금 (6):** `fairtable-voids-comps`(취소와 서비스 제공), `fairtable-discounts-promos`(할인과 프로모션), `fairtable-cash-drawers`(현금 과부족), `fairtable-gift-cards`(기프트카드), `fairtable-no-shows`(예약 노쇼), `fairtable-catering-deposits`(케이터링 예약금).

**인력 (5):** `fairtable-tip-pooling`(팁 풀), `fairtable-overtime`(초과근무, 분할 근무), `fairtable-schedule-vs-actual`(계획 대 실제), `fairtable-labor-dayparts`(시간대별 인건비율), `fairtable-meal-breaks`(휴게와 미성년자).

**배달·수수료·세금·청구서 (6):** `fairtable-delivery-payouts`(정산), `fairtable-delivery-marketing`(마케팅 비용), `fairtable-card-fees`(카드 수수료), `fairtable-sales-tax`(판매세), `fairtable-duplicate-invoices`(중복 송장, 계정 코드), `fairtable-utility-bills`(공과금).

**규정 준수와 다점포 (6):** `fairtable-equipment-maintenance`(장비 유지보수), `fairtable-health-inspections`(위생 점검과 허가), `fairtable-food-handler-cards`(위생 교육 이수증), `fairtable-allergen-matrix`(알레르기 매트릭스), `fairtable-prime-cost`(프라임 코스트), `fairtable-location-comparison`(매장 비교).

## 안전 장치

- **에이전트당 한 가지 업무.** 다른 도구 이름은 모두 차단됩니다.
- **구속력 있는 일은 저절로 일어나지 않습니다.** 결제, 환불, POS 변경, 근무표 게시, 급여 처리, 세금 신고, 메시지 발송을 하지 않습니다. 초안은 DRAFT로 저장되며, 승인은 Auto 모드에서도 항상 이름이 확인된 담당자의 클릭이 필요합니다.
- **개인정보는 가립니다.** 직원과 고객의 이름, 전화번호, 이메일은 AI 모델에 돌려주는 결과에서 `A.R.#3f9a2c` 같은 코드로만 나타나며, 컴퓨터에 저장되는 파일에는 실제 값이 남습니다.
- **로컬 파일만** 사용하고 네트워크는 쓰지 않으며, `.fairtable/`에 해시 체인 감사 로그를 남깁니다.
- **규칙은 사용자가 정합니다.** 목표, 기준값, 임금, 세율, 휴게 규칙, 알레르기 목록은 사용자의 설정 파일에 있습니다.

## 테스트

Windows와 Node 24에서 테스트 807개와 평가 케이스 703개(에이전트당 21개 이상)가 모두 통과했으며, 악의적 입력 테스트에서도 문제가 발견되지 않았습니다. 자세한 내용은 [REVIEW-ver1.md](REVIEW-ver1.md)를 참고하세요.

## 한계

이름이 있는 내보내기 파일의 열 구성은 해당 시스템에 대한 지식으로 작성했으며 실제 계정으로 확인하지 않았습니다. 임금, 세금, 휴게, 위생 규칙은 국가와 지역마다 다르므로 전문가의 확인이 필요합니다. 법률, 세무, 노무, 식품위생 자문이 아닙니다.

MIT © 2026 Kurt Francisco

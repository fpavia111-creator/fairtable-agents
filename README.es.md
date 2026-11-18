# Agentes Fairtable para restaurantes

*Traducido por Claude; pendiente de revisión por un hablante nativo. La [README](README.md) en inglés es la de referencia.*

Treinta y dos pequeños agentes MCP para la administración de restaurantes, bares, cafeterías y grupos con varios locales. Cada uno se encarga de **una sola tarea**, como el costo de alimentos real frente al teórico, el fondo de propinas, los pagos de las apps de reparto o la matriz de alérgenos, y no puede actuar fuera de ella. Leen los archivos que ya exporta desde su punto de venta, su sistema de turnos, sus facturas de proveedores, las apps de reparto y el sistema de reservas, escriben sus informes en su ordenador y esperan a una persona con nombre antes de mover dinero, enviar un mensaje o cambiar un sistema en uso.

Parte de Fair Agents de Mythos Machines. Licencia MIT · Node 20 o superior · solo archivos locales · sin credenciales · sin dependencias. El software es gratuito; lo que se paga es la puesta en marcha a precio fijo sobre sus propios archivos.

## Probar uno

```bash
npx -y apricot-of-food-cost demo            # costo de alimentos real frente al teórico, datos ficticios
npx -y jackfruit-of-delivery-payouts demo   # pagos de apps de reparto frente a pedidos
```

Cada agente tiene una `demo` con archivos ficticios, un `eval` con sus propios casos de prueba y un servidor MCP (`npx -y <agente> mcp --root <carpeta>`).

## Los agentes

**Alimentos, compras y barra (9):** `apricot-of-food-cost` (costo real frente al teórico), `banana-of-recipe-costs` (costo de recetas a los últimos precios), `blackberry-of-price-creep` (aumentos graduales de precios), `blueberry-of-deliveries` (facturas frente a recepciones y notas de crédito), `cherry-of-counts` (variación de inventario), `clementine-of-waste` (registro de mermas), `coconut-of-pours` (costo de servicio en barra), `lime-of-menu-mix` (ingeniería de menú), `lychee-of-stockouts` (artículos agotados).

**Sala y caja (6):** `cranberry-of-voids` (anulaciones e invitaciones), `date-of-discounts` (descuentos y promociones), `elderberry-of-drawers` (sobrantes y faltantes de caja), `kumquat-of-gift-cards` (tarjetas de regalo), `mango-of-no-shows` (reservas no presentadas), `melon-of-catering` (depósitos de catering).

**Personal (5):** `fig-of-tip-pools` (fondo de propinas), `grape-of-overtime` (horas extra, turnos partidos), `guava-of-schedules` (programado frente a real), `huckleberry-of-dayparts` (mano de obra por franja), `raspberry-of-breaks` (descansos y menores).

**Reparto, comisiones, impuestos y facturas (6):** `jackfruit-of-delivery-payouts` (pagos), `kiwi-of-marketing-fees` (marketing), `plum-of-card-fees` (comisiones de tarjeta), `lemon-of-sales-tax` (impuesto sobre ventas), `quince-of-invoices` (facturas duplicadas, codificación contable), `nectarine-of-utilities` (servicios públicos).

**Normativa y varios locales (6):** `olive-of-equipment` (mantenimiento de equipos), `orange-of-inspections` (inspecciones y permisos), `papaya-of-food-handlers` (carnés de manipulador), `peach-of-allergens` (matriz de alérgenos), `mulberry-of-prime-cost` (costo primo), `pear-of-locations` (comparación de locales).

## Seguridad

- **Una tarea por agente.** Cualquier otro nombre de herramienta se bloquea.
- **Nada vinculante ocurre solo.** Ningún agente paga, reembolsa, cambia el punto de venta, publica turnos, ejecuta nóminas, presenta impuestos ni envía mensajes. Los borradores se guardan como DRAFT; aprobarlos siempre requiere el clic de una persona con nombre, incluso en modo Auto.
- **Datos personales enmascarados.** Los nombres, teléfonos y correos del personal y de los clientes llegan al modelo solo como códigos como `A.R.#3f9a2c`; los archivos en su ordenador conservan los valores reales.
- **Solo archivos locales**, sin red, con un registro de auditoría encadenado por hash en `.fairtable/`.
- **Sus reglas.** Objetivos, umbrales, salarios, tasas de impuesto, reglas de descanso y listas de alérgenos son ajustes en su propio archivo.

## Pruebas

806 pruebas y 703 casos de evaluación pasan en Windows con Node 24 (al menos 21 por agente); las pasadas con entradas hostiles no encuentran nada. Detalles en [REVIEW-ver1.md](REVIEW-ver1.md).

## Límites

Las columnas de las exportaciones con nombre se escribieron a partir del conocimiento de esos sistemas, sin una cuenta real. Las reglas de salario, impuestos, descansos e higiene cambian según el país y la región; un profesional las confirma. No es asesoramiento legal, fiscal, laboral ni sanitario.

MIT © 2026 Kurt Francisco

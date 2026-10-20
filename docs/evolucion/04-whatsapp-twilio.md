# Auditoría conceptual · WhatsApp con Twilio y Reymen App

Fecha: 2026-10-20. Alcance: lectura de ReymenApp (`main` `3d2a6ab`), ReymenPOS y Reymen-Web. No se solicitaron ni se vieron credenciales, y no se tocó la mensajería.
Leyenda: **V** verificado en código o pruebas · **D** documentado · **N** no verificable desde los repos.

## Resultado principal
**No hay ninguna mención de Twilio** en ReymenApp, ReymenPOS ni Reymen-Web (código, documentación, esquema, ejemplos de entorno ni los dos flujos de n8n incluidos). La integración con Twilio no está construida ni documentada en estos repos: si existe, vive en una instancia de n8n que no está versionada aquí, o está por construirse.
Lo que sí existe es el **contrato de canal** de Reymen App, al que Twilio se conectaría. Ese contrato no es Meta Cloud API directa ni Twilio: es un contrato propio, neutral al proveedor.

## Recorrido real definido hoy (V)
```
Cliente (WhatsApp)
   │
[ Proveedor + capa de integración ]   ← hoy: flujos de n8n (fuera del repo). Twilio ocuparía el papel de proveedor.
   │  POST /api/webhooks/n8n/conversations   (JSON, firmado por organización)
   ▼
Reymen App
   ├─ valida firma, frescura, límite y duplicados
   ├─ crea o reutiliza conversación y contacto del CRM
   └─ decide qué hace el Agente IA según el modo del canal (Apagado / Sugerir / Automático)
   │  POST {N8N_BASE_URL}/webhook/whatsapp-outbound   (firmado, 5 s)
   ▼
[ Capa de integración → proveedor ]  envía por WhatsApp
   │  POST /api/webhooks/n8n/message-status   (estado de entrega)
   ▼
Reymen App actualiza el estado del mensaje
```
**n8n no decide nada**: ni genera la respuesta ni elige el agente. Solo transporta mensajes entrantes, salientes y estados. La IA corre dentro de Reymen App (decisión, reglas y presupuesto).

## Punto por punto
| Tema | Estado | Detalle |
|---|---|---|
| Recepción de mensajes | V (contrato) | `POST /api/webhooks/n8n/conversations`: `channel`, `contactPhone`, `message{role,content,externalId}`. Alias de canal (`wa`, `whatsapp business`…). |
| Validación y firmas | V | HMAC-SHA256 de `"<timestamp>.<cuerpo>"` con el secreto **de cada organización**; ventana de ±5 min (30 s hacia adelante); comparación en tiempo constante; en producción no se acepta el secreto plano. **No** valida `X-Twilio-Signature` (HMAC-SHA1 de URL y parámetros con el token de Twilio, cuerpo form-encoded). Si Twilio llamara directo a Reymen App, haría falta un adaptador nuevo. |
| Identificar tenant y canal | V / N | El tenant llega en `x-reymen-orgid` (es un identificador, no una credencial: sin el secreto de esa organización no entra). El canal llega en el cuerpo. **No existe** una tabla que resuelva «número de WhatsApp → organización»; `WhatsAppAssistant.phoneNumber` es informativo. Esa resolución tendría que hacerla la capa de integración. |
| Procesamiento de conversaciones | V | `processConversationEvent`: reutiliza la conversación abierta por teléfono, crea el contacto en el CRM (respeta módulo CRM y tope del plan). |
| Ejecución del agente | V | Modo por canal en `AgentChannelSetting`: **Apagado** (nada), **Sugerir** (borrador que una persona envía), **Automático** (responde solo lo rutinario). Requiere módulo `AI_WHATSAPP`, proveedor de IA configurado y presupuesto vigente. |
| Modo automático: salvaguardas | V | Máx. 3 respuestas automáticas por hora por conversación; no interviene si una persona respondió en las últimas 24 h; escala si el cliente pide una persona o hay tema delicado (queja, reembolso, abogado…); no envía enlaces ni datos de pago; máx. 1 000 caracteres; ante duda o presupuesto agotado, pasa a persona con el motivo. |
| Envío de respuestas | V (contrato) | Reymen App llama `POST {N8N_BASE_URL}/webhook/whatsapp-outbound` con `message.send` (conversación, mensaje, teléfono, contenido, adjunto). La entrega real depende del flujo del proveedor. |
| Estados de entrega | V (modelo) | `PENDING`, `SENT`, `DELIVERED`, `READ`, `FAILED` y el webhook `message.status`. Los estados de Twilio (`queued`, `sent`, `delivered`, `read`, `undelivered`, `failed`) deben mapearse en la capa de integración. |
| Errores y reintentos | V / parcial | Entrantes: cada evento se guarda (`WebhookEvent`) con estado e intentos; hasta 5 reintentos por cron (`/api/cron/retry-webhooks`) con recuperación de eventos «en proceso» abandonados. Salientes: si la llamada a la capa de integración falla, el mensaje queda **`FAILED`**; **no hay reintento automático de envío** (se reenvía a mano). |
| Logs y trazabilidad | V | `WebhookEvent` (carga, estado, intentos), bitácora de auditoría, métricas de mensajes, ledger de consumo de IA por cliente, acciones del pipeline con motivo. |
| Duplicados | V | Único `(organización, fuente, id de evento)` y huella de firma; además `Message` único por `(conversación, externalId)`. Un reenvío del mismo evento se descarta. |
| Límites y costos | V / N | Límite de 120 solicitudes por minuto por organización y ruta; presupuesto duro de IA por cliente (`BUDGET_EXHAUSTED` pausa el agente) y tope de agentes por plan. **El costo de mensajería (Twilio por mensaje o conversación) no se registra en Reymen App.** |
| Plantillas y ventana de 24 h de WhatsApp | N | Conocimiento general de WhatsApp Business: fuera de la ventana de atención solo se pueden enviar plantillas aprobadas. Reymen App tiene `templateKey` en las automatizaciones, pero el flujo incluido usa un **proveedor ficticio**. Hay que verificarlo con la documentación vigente de Twilio. |
| Consentimiento | V (en App) | Las automatizaciones respetan consentimiento y enfriamiento; la captura del opt-in de WhatsApp para cada contacto debe confirmarse en el diseño de Twilio. |

## Brechas para que Twilio quede «verificado»
1. Capa de integración Twilio ↔ Reymen App versionada y documentada (flujo o adaptador), con la firma de Reymen en ambos sentidos y validación de `X-Twilio-Signature` si Twilio llama primero.
2. Resolución número → organización.
3. Mapeo de estados de Twilio a los de Reymen y manejo de `undelivered`.
4. Reintento de envíos fallidos (hoy manual) y respuesta rápida al webhook de Twilio.
5. Plantillas aprobadas y manejo de la ventana de 24 h.
6. Registro del costo de mensajería por cliente (si se quiere cobrar o limitar).
7. Pruebas de extremo a extremo con un número de pruebas y luego con el de producción aprobado.

## Qué puede decir la web hoy
| Se puede decir | No se puede decir |
|---|---|
| «Bandeja unificada» y «respuesta sugerida por el Agente IA que tu equipo revisa» (demostración con datos ficticios) | «WhatsApp responde al instante» |
| «La conexión con WhatsApp está en desarrollo» | «Los agentes atienden mensajes reales de WhatsApp» |
| El Agente IA tiene reglas, presupuesto y escala a una persona | «Automatizaciones de WhatsApp operativas» |
| Chat del sitio como canal propio (si está activo) | «Integración completa con WhatsApp» ni logotipos del proveedor |

## Cómo queda preparada la web
En los datos de producto (P1) el canal se declara así, sin tocar código al cambiar el estado:
```json
{ "channel": "whatsapp", "provider": "twilio", "status": "planned",
  "evidence": { "code": ["ReymenApp docs/crm/INBOX-CANALES.md (contrato de canal)"], "production": false } }
```
Pasa a `beta` cuando haya integración verificada en un entorno de prueba y a `live` solo con las pruebas de extremo a extremo y confirmación de producción. Mientras tanto, la prueba automática del repositorio impide que reaparezcan frases como «al instante».

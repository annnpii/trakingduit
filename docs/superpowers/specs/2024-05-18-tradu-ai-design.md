# Tradu AI Assistant & Minor UI Polish

## 1. Overview
The goal is to implement "Tradu" (Trakingduit), an AI financial buddy targeting Gen Z (20-30yo). Tradu will use the `hermes` model to roast, advise, and banter with the user about their spending habits in a casual, highly relatable language.
Additionally, this spec includes user-requested UI polish tasks (Dashboard text changes, Bill payment status UI, and replacing/updating icon libraries to `better-icons`).

## 2. Tradu AI Chat Feature
### 2.1 Entry Point (Dashboard)
- Below the total balance on the Dashboard, add an interactive fake input or pill button (e.g., "Tanya Tradu soal duit lo...").
- Clicking this element triggers a Bottom Sheet containing the Chat UI.

### 2.2 Chat UI (Bottom Sheet)
- A conversational interface similar to modern chat apps.
- Features horizontal scrollable "Quick Prompts" above the text input to reduce typing friction. Examples:
  - "Roast pengeluaran gw bulan ini"
  - "Boros di mana aja gw?"
  - "Sisa duit segini cukup buat foya-foya gak?"
- Messages will alternate between User (right) and Tradu (left).

### 2.3 Data Flow & Integration
- Uses standard OpenAI-style fetch calls to the defined custom Cloudflare endpoint.
- Context injection: Before hitting the API, the system will inject:
  - Total Income & Expense for the current month.
  - Remaining balance.
  - Top 3 spending categories or latest heavy transactions.
- Model Configuration:
  - Endpoint: `https://thursday-punk-colour-consolidated.trycloudflare.com/v1`
  - Model: `hermes`
  - Auth: API key disimpan di environment variable (jangan pernah commit secret).

### 2.4 Persona
- "Tradu" will act as a frank, slightly savage Gen Z friend.
- Language style: Slang, informal Indonesian ("lo", "gw", "boncos", "anjir").
- Attitude: Playfully roasts bad financial decisions, but always grounds the response with actionable advice.

## 3. UI Feedback (Dashboard & Icons)
- **Bills Payment Status:** In the Dashboard "Tagihan" list, correctly reflect if a bill has been paid this month (show "Lunas" or paid vibe instead of "Belum dibayar").
- **Balance Text:** Change string "Total saldo lo" to "Total saldo".
- **Better Icons:** Evaluate swapping standard lucide icons with `better-icons` (https://github.com/better-auth/better-icons) across the app to achieve the desired visual update.

## 4. Future Scope
- Chat history persistence (IndexedDB).
- Voice support.
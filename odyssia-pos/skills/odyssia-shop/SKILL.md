---
name: odyssia-shop
description: Work with the user's Odyssia POS shop (stock, sales, purchases, debts, profit). Use when the user asks about their shop's products, stock levels, low stock, sales, debts, profit and loss, staff summary, or wants to enter a purchase invoice by dictation or photo.
---

# Odyssia POS shop

The `odyssia` MCP server talks to the Odyssia POS program running on the user's own computer. Nothing goes through Oudina Labs servers.

1. Call `get_shop_context` first: it says which trade the shop is and what to ask.
2. Read tools (`list_products`, `get_low_stock`, `get_business_summary`, `get_debts`, `get_profit_and_loss`, `get_staff_summary`, `stock_health_report`) only read. Cost and profit need the owner's permission inside Odyssia: if a tool says it is refused, tell the user to allow it in Odyssia, Settings, AI assistants.
3. Purchase invoices: call `preview_purchase` with the dictated or photographed lines (writes nothing), show the user what was understood and every problem found, and only after the user says yes call `create_purchase_draft`. A draft is approved by the owner inside Odyssia; never claim it is posted.
4. Profit figures are management figures, not a tax statement. Never invent numbers: if a tool returns nothing, say so.
5. The user pays for their own AI account; do not suggest sending shop data anywhere else.

If a tool answers that Odyssia is not running, the connector is off, or the token is wrong, tell the user to open Odyssia, switch on Settings, AI assistants, and copy the port and token again.

const complaintWebhook = import.meta.env.VITE_N8N_COMPLAINT_WEBHOOK
const directCopilotWebhook = import.meta.env.VITE_N8N_COPILOT_WEBHOOK
const isLocalPreview = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
const copilotWebhook = isLocalPreview ? '/api/campus-copilot' : directCopilotWebhook

async function postJson(url, payload) {
  if (!url || url.includes('YOUR_N8N_HOST')) {
    throw new Error('Webhook is not configured yet. Add its URL to .env.local.')
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('n8n returned 404. Activate the workflow and use its Production webhook URL.')
    }
    if (response.status === 500) {
      throw new Error('n8n returned HTTP 500. The request reached the workflow, but an n8n node failed. Check the latest failed execution in n8n.')
    }
    throw new Error(`Workflow returned HTTP ${response.status}`)
  }
  const text = await response.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { answer: text } }
}

/** Call only after the complaint has been saved in Supabase. */
export function notifyComplaintWorkflow(complaint) {
  return postJson(complaintWebhook, {
    event: 'complaint.created',
    source: 'smart-campus-hub',
    sent_at: new Date().toISOString(),
    complaint
  })
}

/** Expected n8n response: { answer: "..." } or { output: "..." }. */
export function askCampusCopilot(message, conversation = []) {
  return postJson(copilotWebhook, {
    message,
    conversation: conversation.slice(-8),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    current_date: new Date().toISOString().slice(0, 10),
    source: 'smart-campus-hub'
  })
}
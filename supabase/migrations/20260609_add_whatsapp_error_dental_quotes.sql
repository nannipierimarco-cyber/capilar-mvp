-- Add whatsapp_error column to track WhatsApp delivery failures
ALTER TABLE public.dental_quote_requests
  ADD COLUMN IF NOT EXISTS whatsapp_error text;

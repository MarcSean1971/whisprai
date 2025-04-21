
-- Add call_type column to active_calls table
ALTER TABLE public.active_calls ADD COLUMN call_type TEXT NOT NULL DEFAULT 'vonage';

-- Add signaling_data column for p2p connection
ALTER TABLE public.active_calls ADD COLUMN signaling_data JSONB;

-- Add comment for clarity
COMMENT ON COLUMN public.active_calls.call_type IS 'The type of call: "vonage" or "p2p"';
COMMENT ON COLUMN public.active_calls.signaling_data IS 'Signaling data for p2p connections (offer/answer)';

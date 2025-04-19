
import { Device } from 'twilio-client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeviceSetup() {
  const setupPolyfills = () => {
    if (typeof window !== 'undefined') {
      (window as any).EventEmitter = null;
      
      if (!window.global) {
        window.global = window;
      }
      
      if (!(window as any).process) {
        (window as any).process = { 
          nextTick: (fn: Function) => setTimeout(fn, 0),
          env: {},
          version: '',
          versions: {},
          platform: 'browser'
        };
      }
    }
  };

  const initializeDevice = async (userId: string): Promise<Device> => {
    const { data, error: tokenError } = await supabase.functions.invoke('twilio-token', {
      body: { identity: userId }
    });

    if (tokenError || !data?.token) {
      throw new Error(tokenError?.message || 'Failed to get access token');
    }

    const device = new Device();
    await device.setup(data.token, {
      debug: true,
      allowIncomingWhileBusy: true,
      codecPreferences: ['opus', 'pcmu'] as any
    });

    return device;
  };

  return {
    setupPolyfills,
    initializeDevice
  };
}

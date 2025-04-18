import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface AISettingsType {
  model: string;
  temperature: number;
  max_tokens: number;
}

export function AISettings() {
  const [settings, setSettings] = useState<AISettingsType>({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'openai_settings')
          .single();

        if (error) throw error;
        if (data && data.value) {
          const settingsData = data.value as unknown as AISettingsType;
          setSettings(settingsData);
        }
      } catch (error) {
        console.error('Error loading AI settings:', error);
        toast.error('Failed to load AI settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: settings as unknown as Json })
        .eq('key', 'openai_settings');

      if (error) throw error;
      toast.success('AI settings saved successfully');
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast.error('Failed to save AI settings');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 w-full">
      <h2 className="text-xl font-semibold">AI Settings</h2>
      
      <div className="space-y-4 w-full">
        <div className="w-full">
          <label className="text-sm font-medium">Model</label>
          <Select
            value={settings.model}
            onValueChange={(value) => setSettings(prev => ({ ...prev, model: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4 Mini</SelectItem>
              <SelectItem value="gpt-4o">GPT-4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full">
          <label className="text-sm font-medium">Temperature</label>
          <Input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full"
          />
        </div>

        <div className="w-full">
          <label className="text-sm font-medium">Max Tokens</label>
          <Input
            type="number"
            min="1"
            value={settings.max_tokens}
            onChange={(e) => setSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        <Button onClick={handleSave} className="w-full">Save Settings</Button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { APIManager, defaultConfig, APIConfig, Provider } from '../apiManager';
import { Input } from './input';
import { Button } from './button';
import { Select } from './select';

const PROVIDERS: { label: string; value: Provider }[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'Custom', value: 'custom' },
];

export function ModelSettings() {
  const [config, setConfig] = useState<APIConfig>({ ...defaultConfig });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof APIConfig, value: any) => {
    setConfig((c) => ({ ...c, [field]: value }));
    setError(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    const mgr = new APIManager(config);
    const err = mgr.validateConfig();
    if (err) {
      setError(err);
      setTesting(false);
      return;
    }
    const result = await mgr.testConnection();
    setTesting(false);
    if (result.ok) setTestResult('✅ Connection successful!');
    else setTestResult(`❌ ${result.error}`);
  };

  const handleSave = () => {
    localStorage.setItem('apiConfig', JSON.stringify(config));
    setTestResult('✅ Saved!');
  };

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Model Configuration</h2>
      <Select
        label="Provider"
        value={config.provider}
        onChange={(e: any) => handleChange('provider', e.target.value)}
        options={PROVIDERS.map((p) => ({ label: p.label, value: p.value }))}
      />
      <Input label="Base URL" value={config.baseUrl} onChange={(e: any) => handleChange('baseUrl', e.target.value)} />
      <Input label="API Key" value={config.apiKey} onChange={(e: any) => handleChange('apiKey', e.target.value)} type="password" />
      <Input label="Model" value={config.model} onChange={(e: any) => handleChange('model', e.target.value)} />
      <Input label="Temperature" value={config.temperature} type="number" min={0} max={2} step={0.01} onChange={(e: any) => handleChange('temperature', parseFloat(e.target.value))} />
      <Input label="Top P" value={config.top_p} type="number" min={0} max={1} step={0.01} onChange={(e: any) => handleChange('top_p', parseFloat(e.target.value))} />
      <Input label="Max Tokens" value={config.max_tokens} type="number" min={1} max={32768} step={1} onChange={(e: any) => handleChange('max_tokens', parseInt(e.target.value))} />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button onClick={handleTest} disabled={testing}>Test Connection</Button>
        <Button onClick={handleSave} disabled={!!(new APIManager(config).validateConfig())}>Save</Button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {testResult && <div style={{ color: testResult.startsWith('✅') ? 'green' : 'red', marginTop: 8 }}>{testResult}</div>}
    </div>
  );
}

import React, { useState, useMemo, useCallback } from 'react';
import { convertAtomToOpml } from './services/geminiService';

type InputMode = 'file' | 'url';

const UploadTab: React.FC<any> = ({ file, setFile }) => (
  <div>
    <input type="file" accept=".xml,.atom" onChange={e =>
      setFile(e.target.files?. ?? null)} />
    {file && <p>已选择文件：{file.name}</p>}
  </div>
);

const UrlTab: React.FC<any> = ({ url, setUrl }) => (
  <input type="url" value={url}
    onChange={e => setUrl(e.target.value)}
    placeholder="输入 Atom Feed URL" />
);

const ResultDisplay: React.FC<any> = ({ result, error, onDownload }) => (
  <>
    {result &&
      <button onClick={onDownload}>下载 OPML 文件</button>
    }
    {error && <div style={{ color: 'red' }}>{error}</div>}
  </>
);

export default function App() {
  const [mode, setMode] = useState<InputMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = useCallback(async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      let atom: string;
      if (mode === 'file' && file) atom = await file.text();
      else if (mode === 'url' && url) {
        const res = await fetch(url); atom = await res.text();
      } else throw new Error('未提供输入');

      const opml = await convertAtomToOpml(atom);
      setResult(opml);
    } catch (e: any) {
      setError(e.message ?? '未知错误');
    } finally { setLoading(false); }
  }, [mode, file, url]);

  const downloadOpml = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (file?.name ?? 'feed') + '.opml';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <button onClick={() => setMode('file')}>文件上传</button>
      <button onClick={() => setMode('url')}>URL 输入</button>
      {mode === 'file'
        ? <UploadTab file={file} setFile={setFile} />
        : <UrlTab url={url} setUrl={setUrl} />
      }
      <button onClick={handleConvert} disabled={loading}>
        {loading ? '处理中...' : '转换为 OPML'}
      </button>
      <ResultDisplay result={result} error={error} onDownload={downloadOpml} />
    </div>
  );
}

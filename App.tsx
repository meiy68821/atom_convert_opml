
import React, { useState, useCallback, useMemo } from 'react';
import { convertAtomToOpml } from './services/geminiService';

type InputMode = 'file' | 'url';

// Helper Icon Components (defined outside App to prevent re-creation on render)
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


export default function App() {
    const [mode, setMode] = useState<InputMode>('file');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState<string>('');
    const [opmlResult, setOpmlResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const isConvertButtonDisabled = useMemo(() => {
        if (isLoading) return true;
        if (mode === 'file' && !file) return true;
        if (mode === 'url' && !url.trim()) return true;
        return false;
    }, [isLoading, mode, file, url]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setOpmlResult(null);
            setError(null);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        setOpmlResult(null);
        setError(null);
    };

    const handleConvert = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setOpmlResult(null);

        try {
            let atomContent: string;
            if (mode === 'file' && file) {
                atomContent = await file.text();
            } else if (mode === 'url' && url) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    atomContent = await response.text();
                } catch (fetchError) {
                    console.error("Fetch error:", fetchError);
                    throw new Error("Failed to fetch from URL. This may be due to browser security restrictions (CORS). Try downloading the feed and uploading it as a file instead.");
                }
            } else {
                throw new Error("No input provided.");
            }

            const result = await convertAtomToOpml(atomContent);
            setOpmlResult(result);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [mode, file, url]);

    const handleDownload = () => {
        if (!opmlResult) return;
        const blob = new Blob([opmlResult], { type: 'application/xml;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const fileName = file?.name.replace(/\.[^/.]+$/, "") || "feed";
        link.download = `${fileName}.opml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const handleModeChange = (newMode: InputMode) => {
        setMode(newMode);
        setError(null);
        setOpmlResult(null);
        setFile(null);
        setUrl('');
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 font-sans">
            <div className="w-full max-w-2xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-800">Atom to OPML Converter</h1>
                    <p className="text-slate-500 mt-2">Instantly convert Atom feeds to OPML format for your favorite RSS reader.</p>
                </header>

                <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                    <div className="flex border-b border-slate-200 mb-6">
                        <TabButton icon={<UploadIcon />} text="Upload File" isActive={mode === 'file'} onClick={() => handleModeChange('file')} />
                        <TabButton icon={<LinkIcon />} text="Enter URL" isActive={mode === 'url'} onClick={() => handleModeChange('url')} />
                    </div>

                    <div className="min-h-[120px]">
                        {mode === 'file' && (
                             <div className="flex flex-col items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
                                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-500">ATOM or XML file</p>
                                    </div>
                                    <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xml,.atom" />
                                </label>
                                {file && <p className="mt-4 text-sm text-slate-600 font-medium">Selected: {file.name}</p>}
                            </div>
                        )}
                        {mode === 'url' && (
                             <input
                                type="url"
                                value={url}
                                onChange={handleUrlChange}
                                placeholder="https://example.com/feed.atom"
                                className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <button
                            onClick={handleConvert}
                            disabled={isConvertButtonDisabled}
                            className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold text-lg py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Converting...
                                </>
                            ) : (
                                'Convert to OPML'
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-6 flex items-start p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                           <AlertTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-red-500" />
                            <div>
                                <h3 className="font-bold">Conversion Failed</h3>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {opmlResult && (
                        <div className="mt-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
                            <div className="flex items-center mb-4">
                                <CheckCircleIcon className="h-6 w-6 mr-2 text-green-600" />
                                <h3 className="text-lg font-bold">Conversion Successful!</h3>
                            </div>
                            <p className="text-sm text-green-700 mb-4">Your OPML file is ready to be downloaded.</p>
                             <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <DownloadIcon className="h-5 w-5 mr-2" />
                                Download .opml file
                            </button>
                        </div>
                    )}

                </main>
                <footer className="text-center text-slate-400 text-sm mt-6">
                    <p>Powered by Google Gemini</p>
                </footer>
            </div>
        </div>
    );
}


interface TabButtonProps {
    icon: React.ReactNode;
    text: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, text, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center px-4 py-3 font-semibold text-sm sm:text-base border-b-2 transition-colors duration-200 ${
                isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
        >
            <span className="mr-2">{icon}</span>
            {text}
        </button>
    );
};

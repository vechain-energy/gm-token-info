import React, { useState, useEffect } from 'react';
import { Search, Loader2, Share2 } from 'lucide-react';
import Footer from './Footer';

interface NodeCheckResult {
  tokenId: string;
  nodeId: string;
  level: string;
  owner: string;
  loading: boolean;
}

interface LevelInfo {
  name: string;
  b3tr: string;
}

const LEVEL_MAP: Record<string, LevelInfo> = {
  '0': { name: 'None', b3tr: '0' },
  '1': { name: 'Earth', b3tr: '0' },
  '2': { name: 'Moon', b3tr: '10,000' },
  '3': { name: 'Mercury', b3tr: '25,000' },
  '4': { name: 'Venus', b3tr: '50,000' },
  '5': { name: 'Mars', b3tr: '100,000' },
  '6': { name: 'Jupiter', b3tr: '250,000' },
  '7': { name: 'Saturn', b3tr: '500,000' },
  '8': { name: 'Uranus', b3tr: '2,500,000' },
  '9': { name: 'Neptune', b3tr: '5,000,000' },
  '10': { name: 'Galaxy', b3tr: '25,000,000' }
};

function App() {
  const [tokenId, setTokenId] = useState('');
  const [results, setResults] = useState<NodeCheckResult[]>([]);

  useEffect(() => {
    // Check URL parameters on load
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      checkToken(tokenParam);
    }
  }, []);

  const checkToken = async (tokenId: string) => {
    // Add to results with loading state
    setResults(prev => [...prev, {
      tokenId,
      nodeId: '',
      level: '',
      owner: '',
      loading: true
    }]);

    try {
      const response = await fetch("https://api.vechain.energy/v1/call/main", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clauses: [
            {
              to: "0x93B8cD34A7Fc4f53271b9011161F7A2B5fEA9D1F",
              signature: `getNodeIdAttached(uint256 ${tokenId}) returns (uint256 value)`
            },
            {
              to: "0x93B8cD34A7Fc4f53271b9011161F7A2B5fEA9D1F",
              signature: `levelOf(uint256 ${tokenId}) returns (uint256 value)`
            },
            {
              to: "0x93B8cD34A7Fc4f53271b9011161F7A2B5fEA9D1F",
              signature: `ownerOf(uint256 ${tokenId}) returns (address value)`
            }
          ]
        })
      });

      const data = await response.json();
      const [nodeId, level, owner] = data.map((result: { value: string }) => result.value);

      setResults(prev => prev.map(result =>
        result.tokenId === tokenId
          ? { ...result, nodeId, level, owner, loading: false }
          : result
      ));
    } catch (error) {
      setResults(prev => prev.map(result =>
        result.tokenId === tokenId
          ? { ...result, nodeId: 'Error', level: 'Error', owner: 'Error', loading: false }
          : result
      ));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenId.trim()) {
      checkToken(tokenId);
      setTokenId('');
    }
  };

  const handleShare = (tokenId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('token', tokenId);
    navigator.clipboard.writeText(url.toString());
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          GalaxyMember Token Info
        </h1>

        <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter Token ID"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Search size={20} />
            Check
          </button>
        </form>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${result.loading
                ? 'bg-gray-100'
                : result.nodeId === '0'
                  ? 'bg-green-100'
                  : 'bg-yellow-100'
                }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Token ID: {result.tokenId}</span>
                  <div className="flex items-center gap-2">
                    {result.loading ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="animate-spin" size={16} />
                        Checking...
                      </div>
                    ) : (
                      <button
                        onClick={() => handleShare(result.tokenId)}
                        className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors"
                        title="Copy shareable link"
                      >
                        <Share2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {!result.loading && (
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Node Status:</span>
                      {result.nodeId === '0' ? (
                        <span className="text-green-600">No node attached</span>
                      ) : (
                        <span className="text-yellow-600">
                          Attached to ThorNode #{result.nodeId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Level:</span>
                      <span className="text-orange-600">
                        {result.level} ({LEVEL_MAP[result.level]?.name || 'Unknown'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Owner:</span>
                      <span className="text-gray-600 font-mono text-xs break-all">
                        {result.owner}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default App;
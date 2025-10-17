'use client';

import { useState, useEffect } from 'react';
import { sessionManager, ResumeVersion } from '../lib/session';

interface VersionHistoryProps {
  onLoadVersion: (version: any) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function VersionHistory({ onLoadVersion, isVisible, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadVersions();
    }
  }, [isVisible]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const history = await sessionManager.getResumeHistory();
      setVersions(history);
    } catch (error) {
      console.error('Error loading version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVersion = async (versionId: string) => {
    try {
      const resume = await sessionManager.getResumeById(versionId);
      if (resume) {
        onLoadVersion(resume.content);
        onClose();
      }
    } catch (error) {
      console.error('Error loading version:', error);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const success = await sessionManager.restoreResumeVersion(versionId);
      if (success) {
        await loadVersions(); // Refresh the list
        const resume = await sessionManager.getCurrentResume();
        if (resume) {
          onLoadVersion(resume.content);
        }
      }
    } catch (error) {
      console.error('Error restoring version:', error);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (confirm('Are you sure you want to delete this version?')) {
      try {
        const success = await sessionManager.deleteResume(versionId);
        if (success) {
          await loadVersions(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting version:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Version History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading versions...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No saved versions found. Your first save will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`border rounded-lg p-4 ${
                  version.is_current ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {version.title}
                      {version.is_current && (
                        <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded">
                          Current
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">Version {version.version}</p>
                    <p className="text-xs text-gray-500">
                      Created: {formatDate(version.created_at)}
                    </p>
                    {version.updated_at !== version.created_at && (
                      <p className="text-xs text-gray-500">
                        Updated: {formatDate(version.updated_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!version.is_current && (
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => handleLoadVersion(version.id)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    {!version.is_current && versions.length > 1 && (
                      <button
                        onClick={() => handleDeleteVersion(version.id)}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
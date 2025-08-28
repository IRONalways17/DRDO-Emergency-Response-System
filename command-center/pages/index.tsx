import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamic imports to avoid SSR issues
const IncidentMap = dynamic(() => import('../components/IncidentMap'), { ssr: false });
const RealTimeStats = dynamic(() => import('../components/RealTimeStats'), { ssr: false });
const IncidentList = dynamic(() => import('../components/IncidentList'), { ssr: false });
const ResponderTracker = dynamic(() => import('../components/ResponderTracker'), { ssr: false });

export default function CommandCenter() {
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <>
      <Head>
        <title>DRDO Emergency Response - Command Center</title>
        <meta name="description" content="DRDO Emergency Response Command Center Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        {/* Header */}
        <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🔒</span>
                  </div>
                  <h1 className="text-xl font-bold text-white">DRDO Emergency Response</h1>
                </div>
                <span className="text-gray-400">Command Center</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-300">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Alert Bar */}
          {alerts.length > 0 && (
            <div className="mb-6 bg-red-600/90 backdrop-blur-sm rounded-lg p-4 border border-red-500">
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold">🚨 ACTIVE ALERTS:</span>
                <div className="flex-1 text-white">
                  {alerts[0]?.message || 'Emergency situation active'}
                </div>
                <button className="text-red-200 hover:text-white">
                  Acknowledge
                </button>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Incidents</p>
                  <p className="text-2xl font-bold text-white">{activeIncidents.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-red-400 text-xl">🚨</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Available Responders</p>
                  <p className="text-2xl font-bold text-white">{responders.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-xl">👮‍♂️</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Response Time</p>
                  <p className="text-2xl font-bold text-white">4.2<span className="text-base text-gray-400">min</span></p>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-xl">⏱️</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Threat Level</p>
                  <p className="text-2xl font-bold text-yellow-400">MEDIUM</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-400 text-xl">⚠️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Map */}
            <div className="xl:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Tactical Map</h2>
                </div>
                <div className="p-4">
                  <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🗺️</div>
                      <p className="text-gray-400">Interactive Map Loading...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Real-time incident locations and responder positions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Stats */}
              <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Real-time Analytics</h2>
                </div>
                <div className="p-4">
                  <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-gray-400">Analytics Dashboard Loading...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Response times, incident patterns, and performance metrics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Incidents & Responders */}
            <div className="space-y-6">
              {/* Active Incidents */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Active Incidents</h2>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                  {activeIncidents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">✅</div>
                      <p className="text-gray-400">No active incidents</p>
                      <p className="text-sm text-gray-500">All systems operational</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeIncidents.map((incident, index) => (
                        <div key={index} className="border border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">
                              {incident.title || `Incident #${index + 1}`}
                            </span>
                            <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded">
                              {incident.severity || 'HIGH'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {incident.description || 'Emergency situation requiring immediate attention'}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>📍 {incident.location || 'Location TBD'}</span>
                            <span className="ml-4">🕐 {incident.time || '5 min ago'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Responder Status */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Responder Status</h2>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                  {responders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">👮‍♂️</div>
                      <p className="text-gray-400">Connecting to responders...</p>
                      <p className="text-sm text-gray-500">Real-time status updating</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {responders.map((responder, index) => (
                        <div key={index} className="border border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">
                              {responder.name || `Team ${index + 1}`}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              responder.status === 'AVAILABLE' ? 'bg-green-600/20 text-green-400' :
                              responder.status === 'BUSY' ? 'bg-yellow-600/20 text-yellow-400' :
                              'bg-red-600/20 text-red-400'
                            }`}>
                              {responder.status || 'AVAILABLE'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {responder.type || 'Security Team'}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>📍 {responder.location || 'On patrol'}</span>
                            <span className="ml-4">📞 {responder.contact || 'Radio: Alpha-1'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Emergency Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                🚨 Emergency Alert
              </button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                ⚠️ Security Breach
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                📢 Broadcast
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Last Update: {new Date().toLocaleTimeString()}
              </div>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

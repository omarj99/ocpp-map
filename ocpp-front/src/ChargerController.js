import React, { useState, useEffect, useRef } from 'react';

const OCPPChargerController = () => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [chargerStatus, setChargerStatus] = useState('Available');
  const [isTransactionActive, setIsTransactionActive] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [connectorId, setConnectorId] = useState(1);
  const [chargerId, setChargerId] = useState('test');
  const [idTag, setIdTag] = useState('123456');
  const [centralSystemUrl, setCentralSystemUrl] = useState('ws://localhost:8080');
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({
    username: '',
    password: ''
  });

  const wsRef = useRef(null);
  const maxLogs = 50;

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => {
      const newLogs = [...prev, { timestamp, message, type }];
      return newLogs.slice(-maxLogs);
    });
  };

  const connectToCharger = async () => {
    try {
      setConnectionStatus('Connecting...');
      addLog('Attempting to connect to charger simulator...', 'info');
      
      setTimeout(() => {
        setConnectionStatus('Connected');
        setChargerStatus('Available');
        addLog('Connected to OCPP Central System', 'success');
        addLog('Charger ID: ' + chargerId, 'info');
        addLog('Connector ID: ' + connectorId, 'info');
      }, 2000);
      
    } catch (error) {
      setConnectionStatus('Error');
      addLog(`Connection failed: ${error.message}`, 'error');
    }
  };

  const disconnectFromCharger = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnectionStatus('Disconnected');
    setChargerStatus('Offline');
    setIsTransactionActive(false);
    setTransactionId(null);
    addLog('Disconnected from charger simulator', 'info');
  };

  const sendStatusUpdate = (status) => {
    if (connectionStatus !== 'Connected') {
      addLog('Not connected to charger', 'error');
      return;
    }

    setChargerStatus(status);
    addLog(`Sent ${status} status for connector ${connectorId}`, 'info');
    addLog(`→ StatusNotification: ${status}`, 'ocpp');
  };

  const startTransaction = async () => {
    if (connectionStatus !== 'Connected') {
      addLog('Not connected to charger', 'error');
      return;
    }

    if (isTransactionActive) {
      addLog('Transaction already active', 'warning');
      return;
    }

    try {
      const newTransactionId = Math.floor(Math.random() * 10000);
      setTransactionId(newTransactionId);
      setIsTransactionActive(true);
      setChargerStatus('Charging');
      
      addLog(`Starting transaction with ID Tag: ${idTag}`, 'info');
      addLog(`→ StartTransaction: TransactionId ${newTransactionId}`, 'ocpp');
      addLog('Transaction started successfully', 'success');
      
      const meterInterval = setInterval(() => {
        if (isTransactionActive) {
          const meterValue = Math.floor(Math.random() * 1000) + 1000;
          addLog(`→ MeterValues: ${meterValue} Wh`, 'ocpp');
        } else {
          clearInterval(meterInterval);
        }
      }, 5000);
      
    } catch (error) {
      addLog(`Failed to start transaction: ${error.message}`, 'error');
    }
  };

  const stopTransaction = async () => {
    if (!isTransactionActive) {
      addLog('No active transaction to stop', 'warning');
      return;
    }

    try {
      addLog(`Stopping transaction ${transactionId}`, 'info');
      addLog(`→ StopTransaction: TransactionId ${transactionId}`, 'ocpp');
      
      setIsTransactionActive(false);
      setTransactionId(null);
      setChargerStatus('Available');
      
      addLog('Transaction stopped successfully', 'success');
    } catch (error) {
      addLog(`Failed to stop transaction: ${error.message}`, 'error');
    }
  };

  const getStatusColor = () => {
    switch (chargerStatus) {
      case 'Available': return 'text-green-500';
      case 'Preparing': return 'text-yellow-500';
      case 'Charging': return 'text-blue-500';
      case 'Finishing': return 'text-orange-500';
      case 'Offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (chargerStatus) {
      case 'Available': return '✅';
      case 'Preparing': return '⚙️';
      case 'Charging': return '⚡';
      case 'Finishing': return '🔄';
      case 'Offline': return '❌';
      default: return '❓';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'Connected': return 'text-green-500';
      case 'Connecting...': return 'text-yellow-500';
      case 'Disconnected': return 'text-gray-500';
      case 'Error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'Connected': return '📶';
      case 'Connecting...': return '🔄';
      case 'Disconnected': return '📵';
      case 'Error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-6">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">OCPP Charger Simulator Controller</h1>
        <p className="text-sm text-gray-600">Interface for vasyas/charger-simulator</p>
      </div>

      {/* Configuration */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Configuration</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Central System URL</label>
              <input
                type="text"
                value={centralSystemUrl}
                onChange={(e) => setCentralSystemUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ws://localhost:8080"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Charger ID</label>
                <input
                  type="text"
                  value={chargerId}
                  onChange={(e) => setChargerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connector ID</label>
                <input
                  type="number"
                  value={connectorId}
                  onChange={(e) => setConnectorId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Tag</label>
              <input
                type="text"
                value={idTag}
                onChange={(e) => setIdTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Connection</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getConnectionColor()}`}>
                  {connectionStatus}
                </span>
                <span className="text-lg">{getConnectionIcon()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Charger Status</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {chargerStatus}
                </span>
                <span className="text-lg">{getStatusIcon()}</span>
              </div>
            </div>
            
            {isTransactionActive && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Transaction ID</span>
                <span className="text-sm font-bold text-blue-800">{transactionId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Controls</h2>
        
        {/* Connection Controls */}
        <div className="flex space-x-3">
          <button
            onClick={connectToCharger}
            disabled={connectionStatus === 'Connected' || connectionStatus === 'Connecting...'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              connectionStatus === 'Connected' || connectionStatus === 'Connecting...'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <span>▶️</span>
            <span>Connect</span>
          </button>
          
          <button
            onClick={disconnectFromCharger}
            disabled={connectionStatus !== 'Connected'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              connectionStatus !== 'Connected'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <span>⏹️</span>
            <span>Disconnect</span>
          </button>
        </div>

        {/* Status Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => sendStatusUpdate('Available')}
            disabled={connectionStatus !== 'Connected'}
            className="flex items-center justify-center py-2 px-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg font-medium transition-all"
          >
            Available
          </button>
          <button
            onClick={() => sendStatusUpdate('Preparing')}
            disabled={connectionStatus !== 'Connected'}
            className="flex items-center justify-center py-2 px-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg font-medium transition-all"
          >
            Preparing
          </button>
          <button
            onClick={() => sendStatusUpdate('Charging')}
            disabled={connectionStatus !== 'Connected'}
            className="flex items-center justify-center py-2 px-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg font-medium transition-all"
          >
            Charging
          </button>
          <button
            onClick={() => sendStatusUpdate('Finishing')}
            disabled={connectionStatus !== 'Connected'}
            className="flex items-center justify-center py-2 px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg font-medium transition-all"
          >
            Finishing
          </button>
        </div>

        {/* Transaction Controls */}
        <div className="flex space-x-3">
          <button
            onClick={startTransaction}
            disabled={connectionStatus !== 'Connected' || isTransactionActive}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              connectionStatus !== 'Connected' || isTransactionActive
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <span>🔋</span>
            <span>Start Transaction</span>
          </button>

          <button
            onClick={stopTransaction}
            disabled={!isTransactionActive}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              !isTransactionActive
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <span>🛑</span>
            <span>Stop Transaction</span>
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Activity Log</h2>
        <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
          <div className="space-y-1 text-sm font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-500">No activity yet...</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    log.type === 'ocpp' ? 'text-blue-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCPPChargerController;
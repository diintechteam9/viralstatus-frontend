import React from 'react';

const RoleSelection = ({ onRoleSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to YovoAI</h2>
        <p className="text-gray-500 text-sm">Login or create your account to get started</p>
      </div>
      <button
        onClick={() => onRoleSelect('mobileuser')}
        className="w-full p-5 border-2 border-orange-400 rounded-xl hover:bg-orange-50 transition-all flex items-center gap-4 group"
      >
        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-3xl group-hover:bg-orange-200 transition-all">
          📱
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-800 text-lg">Mobile User</h3>
          <p className="text-sm text-gray-500">Login with your mobile account</p>
        </div>
        <div className="ml-auto text-orange-400 text-xl">→</div>
      </button>
    </div>
  );
};

export default RoleSelection;

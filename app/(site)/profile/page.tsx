// app/profile/page.js
"use client";

import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  
  return (
    <ProtectedPage>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        
        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{user.username}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
            
            <div className="mb-6">
              <p>Account created: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            
            <button 
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
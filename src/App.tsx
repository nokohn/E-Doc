import React, { useState, useEffect } from 'react';
import { User, DocumentTypeDirection } from './types';
import { AuthService } from './services/auth';
import { SweetAlertProvider } from './components/SweetAlertModal';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { IncomingView } from './views/IncomingView';
import { OutgoingView } from './views/OutgoingView';
import { WorkflowView } from './views/WorkflowView';
import { ESignatureView } from './views/ESignatureView';
import { EStorageView } from './views/EStorageView';
import { ReportsView } from './views/ReportsView';
import { AdminView } from './views/AdminView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { NewDocumentModal } from './components/NewDocumentModal';
import { RequireRole } from './services/workflowAuthMiddleware';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      return AuthService.getCurrentUser();
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      if (params.get('verify') || path.startsWith('/verify')) return 'esignature';
      if (path.startsWith('/incoming')) return 'incoming';
      if (path.startsWith('/outgoing')) return 'outgoing';
      if (path.startsWith('/workflow')) return 'workflow';
      if (path.startsWith('/esignature')) return 'esignature';
      if (path.startsWith('/estorage')) return 'estorage';
      if (path.startsWith('/reports')) return 'reports';
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/audit')) return 'audit';
      if (path.startsWith('/settings')) return 'settings';
    }
    return 'dashboard';
  });
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showNewDocModal, setShowNewDocModal] = useState<DocumentTypeDirection | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Handle Logout
  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <SweetAlertProvider>
        <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />
      </SweetAlertProvider>
    );
  }

  return (
    <SweetAlertProvider>
      <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onUserChange={(updatedUser) => setCurrentUser(updatedUser)}
          onSearch={(query) => {
            setGlobalSearchQuery(query);
            if (query && currentTab !== 'incoming' && currentTab !== 'outgoing') {
              setCurrentTab('incoming');
            }
          }}
          onOpenDocument={(docId) => setSelectedDocumentId(docId)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
            currentUser={currentUser}
            onNewIncoming={() => setShowNewDocModal('INCOMING')}
            onNewOutgoing={() => setShowNewDocModal('OUTGOING')}
          />

          {/* View Container */}
          <main className="flex-1 overflow-y-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                onOpenDocument={(docId) => setSelectedDocumentId(docId)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'incoming' && (
              <IncomingView
                currentUser={currentUser}
                onOpenDocument={(docId) => setSelectedDocumentId(docId)}
                onNewIncoming={() => setShowNewDocModal('INCOMING')}
              />
            )}

            {currentTab === 'outgoing' && (
              <OutgoingView
                currentUser={currentUser}
                onOpenDocument={(docId) => setSelectedDocumentId(docId)}
                onNewOutgoing={() => setShowNewDocModal('OUTGOING')}
              />
            )}

            {currentTab === 'workflow' && (
              <WorkflowView
                currentUser={currentUser}
                onOpenDocument={(docId) => setSelectedDocumentId(docId)}
              />
            )}

            {currentTab === 'esignature' && (
              <ESignatureView
                currentUser={currentUser}
                onOpenDocument={(docId) => setSelectedDocumentId(docId)}
              />
            )}

            {currentTab === 'estorage' && (
              <EStorageView
                currentUser={currentUser}
                onOpenDocument={(docId) => setSelectedDocumentId(docId)}
              />
            )}

            {currentTab === 'reports' && <ReportsView />}

            {currentTab === 'admin' && (
              <RequireRole
                user={currentUser}
                roles={['ADMIN']}
                fallback={
                  <div className="p-12 text-center text-slate-500">
                    <p className="font-bold text-base text-rose-600">ບໍ່ມີສິດເຂົ້າເຖິງ ໜ້ານີ້ສະເພາະ ADMIN ເທົ່ານັ້ນ</p>
                    <p className="text-xs mt-1">ກະລຸນາໃຊ້ Role Switcher ດ້ານເທິງເລືອກບົດບາດ Administrator</p>
                  </div>
                }
              >
                <AdminView />
              </RequireRole>
            )}

            {currentTab === 'audit' && <AuditLogView />}

            {currentTab === 'settings' && <SettingsView />}
          </main>
        </div>

        {/* 3-Column Document Detail Modal */}
        {selectedDocumentId && (
          <DocumentDetailModal
            documentId={selectedDocumentId}
            currentUser={currentUser}
            onUserChange={(updatedUser) => setCurrentUser(updatedUser)}
            onClose={() => setSelectedDocumentId(null)}
          />
        )}

        {/* New Document Modal */}
        {showNewDocModal && (
          <NewDocumentModal
            initialDirection={showNewDocModal}
            currentUser={currentUser}
            onClose={() => setShowNewDocModal(null)}
            onSuccess={(newId) => {
              setShowNewDocModal(null);
              setSelectedDocumentId(newId);
            }}
          />
        )}
      </div>
    </SweetAlertProvider>
  );
}

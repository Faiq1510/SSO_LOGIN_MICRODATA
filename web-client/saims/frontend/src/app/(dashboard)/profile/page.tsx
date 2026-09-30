"use client";

import React, { useEffect, useState, useRef } from 'react';
import { User, Key, Building, LogIn, MessageCircle, Smartphone, Save, Sliders, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { userService } from '@/services/user.service';
import { User as UserType } from '@/types';
import ConfirmModal, { ConfirmModalType } from '@/components/ui/ConfirmModal';
import PageHeaderCard from '@/components/ui/PageHeaderCard';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    idKaryawan: '',
    department: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmModalType;
    onConfirm?: () => void;
    hideCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [pendingPhone, setPendingPhone] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => {
      setOtpCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const savedUser = localStorage.getItem('saims_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const normalized = {
          ...parsed,
          idKaryawan: parsed.idKaryawan || parsed.id_karyawan || '',
          lastLogin: parsed.lastLogin || parsed.last_login || ''
        };
        setCurrentUser(normalized);
        
        let cleanPhone = normalized.phone || '';
        if (cleanPhone.startsWith('+62')) cleanPhone = cleanPhone.substring(3);
        else if (cleanPhone.startsWith('62')) cleanPhone = cleanPhone.substring(2);
        else if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

        setProfileForm({
          name: normalized.name || '',
          phone: cleanPhone,
          idKaryawan: normalized.idKaryawan || '',
          department: normalized.department || ''
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Data Belum Lengkap',
        message: 'Mohon isi seluruh bidang data yang masih kosong.',
        type: 'warning',
        hideCancel: true,
        onConfirm: closeModal
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const submitData = { 
        name: profileForm.name,
        phone: `+62${profileForm.phone}`,
        id_karyawan: profileForm.idKaryawan,
        department: profileForm.department
      };
      const res = await userService.updateProfile(submitData);
      
      if (res && res.otp_required) {
        setPendingPhone(`+62${profileForm.phone}`);
        setOtpCode('');
        setOtpError('');
        setOtpCountdown(60);
        setIsOtpModalOpen(true);
        
        // Update local storage user with other updated fields, except phone
        const updatedUser = { 
          ...currentUser, 
          name: profileForm.name,
          idKaryawan: profileForm.idKaryawan,
          id_karyawan: profileForm.idKaryawan,
          department: profileForm.department
        };
        localStorage.setItem('saims_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser as UserType);
        
        window.dispatchEvent(new Event('storage'));
        return;
      }

      // Update local storage user (including phone)
      const updatedUser = { 
        ...currentUser, 
        name: profileForm.name,
        phone: `+62${profileForm.phone}`,
        idKaryawan: profileForm.idKaryawan,
        id_karyawan: profileForm.idKaryawan,
        department: profileForm.department
      };
      localStorage.setItem('saims_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser as UserType);
      
      // Dispatch an event so layout can pick up new avatar/name
      window.dispatchEvent(new Event('storage'));
      
      setModalConfig({
        isOpen: true,
        title: 'Berhasil',
        message: 'Profil berhasil diperbarui!',
        type: 'success',
        hideCancel: true,
        onConfirm: closeModal
      });
    } catch (error) {
      console.error(error);
      setModalConfig({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal memperbarui profil.',
        type: 'danger',
        hideCancel: true,
        onConfirm: closeModal
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check complexity: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setModalConfig({
        isOpen: true,
        title: 'Password Tidak Valid',
        message: 'Password baru harus minimal 8 karakter dan mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka.',
        type: 'warning',
        hideCancel: true,
        onConfirm: closeModal
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setModalConfig({
        isOpen: true,
        title: 'Validasi Gagal',
        message: 'Konfirmasi password baru tidak cocok!',
        type: 'warning',
        hideCancel: true,
        onConfirm: closeModal
      });
      return;
    }
    
    setIsSavingPassword(true);
    try {
      await userService.changePassword({
        current_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      });
      setModalConfig({
        isOpen: true,
        title: 'Berhasil',
        message: 'Password berhasil diubah!',
        type: 'success',
        hideCancel: true,
        onConfirm: closeModal
      });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error(error);
      setModalConfig({
        isOpen: true,
        title: 'Gagal Mengubah Password',
        message: error.response?.data?.error || 'Gagal mengubah password.',
        type: 'danger',
        hideCancel: true,
        onConfirm: closeModal
      });
    } finally {
      setIsSavingPassword(false);
    }
  };



  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const submitData = { 
        name: profileForm.name,
        phone: `+62${profileForm.phone}`,
        id_karyawan: profileForm.idKaryawan,
        department: profileForm.department
      };
      await userService.updateProfile(submitData);
      
      // Update local storage user
      const updatedUser = { 
        ...currentUser, 
        idKaryawan: profileForm.idKaryawan,
        id_karyawan: profileForm.idKaryawan,
        department: profileForm.department 
      };
      localStorage.setItem('saims_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser as UserType);
      
      setIsEditingOrg(false);
      
      setModalConfig({
        isOpen: true,
        title: 'Berhasil',
        message: 'Konteks organisasi berhasil diperbarui!',
        type: 'success',
        hideCancel: true,
        onConfirm: closeModal
      });
    } catch (error) {
      console.error(error);
      setModalConfig({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal memperbarui konteks organisasi.',
        type: 'danger',
        hideCancel: true,
        onConfirm: closeModal
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelOrgEdit = () => {
    if (currentUser) {
      setProfileForm(prev => ({
        ...prev,
        idKaryawan: currentUser.idKaryawan || (currentUser as any).id_karyawan || '',
        department: currentUser.department || ''
      }));
    }
    setIsEditingOrg(false);
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    try {
      const submitData = { 
        name: profileForm.name,
        phone: pendingPhone,
        id_karyawan: profileForm.idKaryawan,
        department: profileForm.department
      };
      await userService.updateProfile(submitData);
      setOtpCountdown(60);
      setOtpError('');
    } catch (error: any) {
      console.error(error);
      setOtpError('Gagal mengirim ulang OTP.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setOtpError('Kode OTP harus 6 digit.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      await userService.verifyPhone(otpCode, pendingPhone);
      
      // Update local storage user
      const updatedUser = { 
        ...currentUser, 
        phone: pendingPhone 
      };
      localStorage.setItem('saims_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser as UserType);

      // Update the profileForm phone number in the UI input to reflect the verified phone
      let cleanPhone = pendingPhone;
      if (cleanPhone.startsWith('+62')) cleanPhone = cleanPhone.substring(3);
      else if (cleanPhone.startsWith('62')) cleanPhone = cleanPhone.substring(2);
      else if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
      
      setProfileForm(prev => ({
        ...prev,
        phone: cleanPhone
      }));
      
      window.dispatchEvent(new Event('storage'));
      setIsOtpModalOpen(false);
      
      setModalConfig({
        isOpen: true,
        title: 'Berhasil',
        message: 'Nomor WhatsApp berhasil diperbarui!',
        type: 'success',
        hideCancel: true,
        onConfirm: closeModal
      });
    } catch (error: any) {
      console.error(error);
      setOtpError(error.response?.data?.error || 'Kode OTP tidak valid atau telah kadaluarsa.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (!currentUser) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 dark:text-gray-100">
      <PageHeaderCard
        moduleBadge="Akun Personal"
        badgeColorClass="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
        title="Profil & Pengaturan"
        description="Kelola informasi pribadi, kontak, dan keamanan akun Anda."
        icon={Sliders}
        iconColorClass="text-rose-600"
      />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 min-w-0 space-y-6"
          >
            
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
              <div className="border-b border-gray-100 dark:border-gray-800/50 px-6 py-4 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Informasi Visual & Pribadi</h3>
              </div>
              <form className="p-6" onSubmit={handleProfileSubmit}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-white shrink-0"
                    >
                      <User className="w-10 h-10" />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{currentUser.role}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="group">
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">Nama Lengkap *</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm focus:ring-2 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 focus:ring-blue-500 focus:border-blue-500" 
                        type="text" 
                        value={profileForm.name}
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email Akses <span className="text-gray-400 font-normal">(Read-only)</span></label>
                      <input disabled className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed" type="email" value={currentUser.email} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Pengaturan Kontak (Notifikasi WhatsApp)</h4>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">Nomor WhatsApp</label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-medium sm:text-sm">+62</span>
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-12 pr-4 py-3 sm:text-sm border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none"
                          value={profileForm.phone}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.startsWith('62')) val = val.substring(2);
                            if (val.startsWith('0')) val = val.substring(1);
                            if (val.length > 13) val = val.substring(0, 13);
                            setProfileForm({...profileForm, phone: val});
                          }}
                        />
                      </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">Nomor ini digunakan oleh sistem (Fonnte) untuk mengirimkan notifikasi approval, penolakan, maupun jadwal maintenance aset.</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button type="submit" disabled={isSavingProfile} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95">
                    <Save className="w-4 h-4" />
                    {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
              <div className="border-b border-gray-100 dark:border-gray-800/50 px-6 py-4 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Keamanan Akun</h3>
              </div>
              <form className="p-6" onSubmit={handlePasswordSubmit}>
                <div className="space-y-4 max-w-md">
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 group-focus-within:text-orange-600 dark:group-focus-within:text-orange-400 transition-colors">Password Lama</label>
                    <input 
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm focus:ring-2 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 focus:ring-orange-500 focus:border-orange-500" 
                      type="password" 
                      value={passwordForm.oldPassword}
                      onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 group-focus-within:text-orange-600 dark:group-focus-within:text-orange-400 transition-colors">Password Baru</label>
                    <input 
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm focus:ring-2 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 focus:ring-orange-500 focus:border-orange-500" 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 group-focus-within:text-orange-600 dark:group-focus-within:text-orange-400 transition-colors">Konfirmasi Password Baru</label>
                    <input 
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm focus:ring-2 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 focus:ring-orange-500 focus:border-orange-500" 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isSavingPassword} className="flex items-center justify-center w-full gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95">
                      <Key className="w-4 h-4" />
                      {isSavingPassword ? 'Memproses...' : 'Ubah Password'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
              <div className="border-b border-gray-100 dark:border-gray-800/50 px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Building className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Konteks Organisasi</h3>
                </div>
                {!isEditingOrg && (
                  <button 
                    onClick={() => setIsEditingOrg(true)}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 hover:scale-105 active:scale-95 duration-200"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditingOrg ? (
                <form onSubmit={handleOrgSubmit} className="p-6 space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors">ID Karyawan</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600" 
                      placeholder="Belum diatur" 
                      value={profileForm.idKaryawan}
                      onChange={e => setProfileForm({...profileForm, idKaryawan: e.target.value})}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors">Departemen / Divisi</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600" 
                      placeholder="Belum diatur" 
                      value={profileForm.department}
                      onChange={e => setProfileForm({...profileForm, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role Sistem</label>
                    <div className="mt-1 inline-block">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800/50">{currentUser.role}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800/50 flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={handleCancelOrgEdit} 
                      className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-95"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSavingProfile} 
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
                    >
                      {isSavingProfile ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID Karyawan</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{currentUser.idKaryawan || 'Belum diatur'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Departemen / Divisi</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{currentUser.department || 'Belum diatur'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role Sistem</p>
                    <div className="mt-1.5 inline-block">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800/50">{currentUser.role}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-xl shadow-lg border border-gray-700 dark:border-gray-800 overflow-hidden text-white hover:shadow-xl transition-shadow">
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <LogIn className="w-5 h-5" />
                  <h3 className="font-semibold">Riwayat Login Terakhir</h3>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                  <p className="text-sm md:text-base font-semibold text-white/95 leading-normal">
                    {currentUser.lastLogin ? (
                      `${new Date(currentUser.lastLogin).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} pukul ${new Date(currentUser.lastLogin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                    ) : 'Belum ada data'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">Data ini menampilkan kapan terakhir kali Anda berhasil login ke sistem SAIMS. Jika ada aktivitas mencurigakan, segera ganti password Anda.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        hideCancel={modalConfig.hideCancel}
        confirmText="Oke"
      />

      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl shadow-gray-900/10 dark:shadow-black/50 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800/60 overflow-hidden">
            <div className="flex justify-end">
              <button onClick={() => setIsOtpModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 mx-auto">
              <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Verifikasi WhatsApp</h3>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Masukkan 6 digit kode OTP yang dikirimkan ke nomor WhatsApp baru Anda: <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingPhone}</span>
            </p>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="group">
                <input
                  type="text"
                  maxLength={6}
                  className="w-full text-center font-mono text-2xl tracking-[0.5em] pl-[0.25em] py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600"
                  placeholder="------"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              {otpError && (
                <p className="text-xs text-red-500 dark:text-red-400 text-center font-medium">{otpError}</p>
              )}
              <div className="text-center">
                {otpCountdown > 0 ? (
                  <p className="text-xs text-gray-400">
                    Kirim ulang kode dalam <span className="font-semibold">{otpCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline active:scale-95 duration-150"
                  >
                    Kirim Ulang OTP
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
                >
                  {isVerifyingOtp ? 'Memverifikasi...' : 'Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

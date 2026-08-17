/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Check,
  ShieldCheck,
  Settings as SettingsIcon,
  Sparkles,
  Lock,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { cn } from '@/lib/utils';
import {
  updateUserProfileAction,
  changeUserPasswordAction,
} from '@/app/chat/settings.actions';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    image_url?: string | null;
  } | null;
}

export function SettingsDialog({ open, onOpenChange, user }: SettingsDialogProps) {
  const { data: session, update } = useSession();
  const currentUser = session?.user || user;

  const [activeTab, setActiveTab] = React.useState<'profile' | 'password'>('profile');

  // Profile Form State
  const [displayName, setDisplayName] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPass, setShowCurrentPass] = React.useState(false);
  const [showNewPass, setShowNewPass] = React.useState(false);
  const [showConfirmPass, setShowConfirmPass] = React.useState(false);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const name = currentUser?.name || '';
      const img = currentUser?.image || (currentUser as any)?.image_url || '';
      setDisplayName(name);
      setImageUrl(img);
      setBio((currentUser as any)?.bio || '');
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open, currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    const userId = currentUser?.id;
    if (!userId) {
      toast.error('Không xác định được ID người dùng');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateUserProfileAction(userId, {
        displayName: displayName.trim(),
        image_url: imageUrl,
      });

      if (res.success) {
        toast.success('Cập nhật thông tin cá nhân thành công!');
        // Sync NextAuth session
        await update({
          name: displayName.trim(),
          image: imageUrl,
        });
      } else {
        toast.error(res.error || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    const userId = currentUser?.id;
    if (!userId) {
      toast.error('Không xác định được ID người dùng');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await changeUserPasswordAction({
        userId,
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast.success(res.message || 'Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.error || 'Cập nhật mật khẩu thất bại');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex flex-col md:flex-row h-[600px] w-full">
          {/* Left Navigation Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-muted/20 p-5 flex flex-col justify-between shrink-0">
            <div>
              {/* Sidebar Header */}
              <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-border/50">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-xs">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-base leading-tight">Cài đặt tài khoản</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Quản lý tài khoản & bảo mật</p>
                </div>
              </div>

              {/* Nav Tabs */}
              <nav className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left',
                    activeTab === 'profile'
                      ? 'bg-background text-foreground shadow-sm border border-border/70 font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <User className={cn('w-4 h-4', activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground')} />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('password')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left',
                    activeTab === 'password'
                      ? 'bg-background text-foreground shadow-sm border border-border/70 font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <KeyRound className={cn('w-4 h-4', activeTab === 'password' ? 'text-primary' : 'text-muted-foreground')} />
                  <span>Cập nhật mật khẩu</span>
                </button>
              </nav>
            </div>

            {/* Sidebar Footer info badge */}
            <div className="hidden md:flex flex-col gap-2 p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground mt-auto">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Bảo mật tài khoản</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tài khoản của bạn được bảo vệ với mã hóa và chứng thực an toàn.
              </p>
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-background flex flex-col justify-between">
            {activeTab === 'profile' ? (
              <form onSubmit={handleSaveProfile} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Tab Header */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">Thông tin cá nhân</h3>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cập nhật ảnh đại diện, tên hiển thị và các thông tin cá nhân của bạn.
                    </p>
                  </div>

                  <div className="h-px bg-border/60 w-full" />

                  {/* Avatar Upload */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Ảnh đại diện</Label>
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center gap-5">
                      <ImageUpload
                        value={imageUrl}
                        onChange={(url) => setImageUrl(url)}
                        folder="chat-app-microservices/users"
                        mode="avatar"
                        size={80}
                      />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Tải ảnh mới</p>
                        <p>Hỗ trợ định dạng PNG, JPG hoặc WebP.</p>
                        <p className="text-[11px] text-muted-foreground/80">Kích thước tối đa 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-sm font-medium">Họ và tên / Tên hiển thị</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nhập tên hiển thị..."
                        className="rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Địa chỉ Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={currentUser?.email || ''}
                        disabled
                        className="rounded-lg bg-muted/40 cursor-not-allowed text-muted-foreground"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Email liên kết với tài khoản đăng nhập và không thể thay đổi.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-medium">Tiểu sử (Bio)</Label>
                      <textarea
                        id="bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Giới thiệu ngắn về bạn..."
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSavingProfile}
                    className="rounded-lg"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSavingProfile} className="rounded-lg font-medium">
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Tab Header */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">Cập nhật mật khẩu</h3>
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Đảm bảo an toàn tài khoản bằng cách tạo mật khẩu mạnh có ít nhất 6 ký tự.
                    </p>
                  </div>

                  <div className="h-px bg-border/60 w-full" />

                  {/* Password Form Inputs */}
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pr-10 rounded-lg"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pr-10 rounded-lg"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pr-10 rounded-lg"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">Yêu cầu mật khẩu:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        <li>Tối thiểu 6 ký tự</li>
                        <li>Nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSavingPassword}
                    className="rounded-lg"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSavingPassword} className="rounded-lg font-medium">
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang đổi...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Đổi mật khẩu
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
